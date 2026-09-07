
CREATE TYPE public.app_role AS ENUM ('user','engineer','team_leader','super_admin');
CREATE TYPE public.ticket_status AS ENUM ('submitted','assigned','accepted','in_progress','completed','confirmed','closed','rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  department text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX one_super_admin ON public.user_roles ((role)) WHERE role = 'super_admin';

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('team_leader','super_admin'))
$$;

CREATE TABLE public.access_keys (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  user_key text NOT NULL DEFAULT '1111',
  engineer_key text NOT NULL DEFAULT '2222',
  team_leader_key text NOT NULL DEFAULT '3333',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.access_keys TO authenticated;
GRANT ALL ON public.access_keys TO service_role;
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;
INSERT INTO public.access_keys (id) VALUES (1);

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('BSC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'submitted',
  location text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  completed_at timestamptz,
  confirmed_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'comment',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_events TO authenticated;
GRANT ALL ON public.ticket_events TO service_role;
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "super admin manages profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- roles policies
CREATE POLICY "roles readable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- access keys: only super admin
CREATE POLICY "super admin reads keys" ON public.access_keys FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "super admin updates keys" ON public.access_keys FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- tickets policies
CREATE POLICY "ticket read access" ON public.tickets FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'engineer'));
CREATE POLICY "users create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "ticket update access" ON public.tickets FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "staff delete tickets" ON public.tickets FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ticket events
CREATE POLICY "events read access" ON public.ticket_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'engineer'))));
CREATE POLICY "events insert access" ON public.ticket_events FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR public.is_staff(auth.uid()))));

-- notifications
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "authenticated create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER tickets_touch BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
