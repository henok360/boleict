
CREATE TABLE public.service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  category text NOT NULL,
  category_name text NOT NULL,
  name_en text NOT NULL,
  name_am text,
  scope_en text,
  uom text NOT NULL DEFAULT 'each',
  default_price numeric(12,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_items TO authenticated;
GRANT UPDATE ON public.service_items TO authenticated;
GRANT ALL ON public.service_items TO service_role;

ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service items readable by authenticated" ON public.service_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "super admin updates service items" ON public.service_items
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER service_items_touch BEFORE UPDATE ON public.service_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.tickets
  ADD COLUMN service_item_id uuid REFERENCES public.service_items(id),
  ADD COLUMN service_qty numeric(12,2) NOT NULL DEFAULT 1,
  ADD COLUMN service_price numeric(12,2),
  ADD COLUMN price_locked_at timestamptz;

CREATE OR REPLACE FUNCTION public.prevent_username_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Usernames are permanent and cannot be changed.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_username_immutable BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_username_change();

INSERT INTO public.service_items (code, category, category_name, name_en, name_am, scope_en, uom, default_price, sort_order) VALUES
('A1','A','Network Maintenance','Network Cable Installation','የኔትወርክ ኬብል መዘርጋት','Laying, pulling, and trunking/conduit installation','per meter',250,1),
('A2','A','Network Maintenance','RJ45 Crimp & Termination','RJ45 ክሪምፕ እና ቴርሚኔሽን','Stripping Cat6 cable, aligning pairs, crimping RJ45 connector, and continuity testing','per RJ45',1500,2),
('A3','A','Network Maintenance','Keystone Socket Splicing & Fixing','የኪስቶን ሶኬት ጥገና እና ገጠማ','Punch-down termination onto Cat6 keystone jack, mounting faceplate/box, and port testing','Per point',500,3),
('A4','A','Network Maintenance','Network Driver & PC Config','የኔትወርክ ድራይቨር እና ፒሲ ኮንፊገሬሽን','Installing/updating NIC drivers, IP configuration, DNS, and domain/workgroup joining','Per PC',1000,4),
('A5','A','Network Maintenance','Network Switch Configuration','የስዊች ኮንፊገሬሽን','Port assignment, VLAN setup, trunking, STP, and management IP configuration','Per Switch',5000,5),
('A6','A','Network Maintenance','Router Configuration','የራውተር ኮንፊገሬሽን','WAN/LAN interface setup, DHCP server, NAT rules, routing protocols, firewall policy','Per Router',5000,6),
('B1','B','Printer Maintenance','Printer Preventive Maintenance','የፕሪንተር ቅድመ ጥገና','Internal dust/toner cleaning, roller inspection, gear lubrication, printhead cleaning, calibration','Per Printer',1500,1),
('B2','B','Printer Maintenance','Printer Corrective / Diagnostic Repair','የፕሪንተር እቃ ጥገና እና ድያግኖስቲክስ','Troubleshooting hardware errors, replacing worn components','Per Printer',6000,2),
('B3','B','Printer Maintenance','Printer Driver & Network Configuration','የፕሪንተር ድራይቨር እና ኔትወርክ ማገናኘት','Driver installation, network IP assignment, shared printer setup','Per Printer/PC',1500,3),
('B4','B','Printer Maintenance','Printer Consumables Maintenance & Refilling','የቶነር መሙላት እና የፍጆታ እቃዎች ጥገና','Toner refilling, drum unit replacement, waste toner box replacement','Per Printer',1500,4),
('C1','C','Photo Copy Maintenance','Photo Copy Preventive Maintenance','የፎቶ ኮፒ ቅድመ ጥገና','Internal cleaning, roller inspection, lubrication, calibration','Per Machine',1500,1),
('C2','C','Photo Copy Maintenance','Photo Copy Corrective / Diagnostic Repair','የፎቶ ኮፒ ማሽን ዋና ጥገና','Troubleshooting hardware errors, replacing worn components','Per Machine',6000,2),
('C3','C','Photo Copy Maintenance','Photo Copy Driver & Network Configuration','የፎቶ ኮፒ ድራይቨር እና ኔትወርክ ማገናኘት','Driver installation, network IP assignment, scanner/print setup','Per Machine',1500,3),
('C4','C','Photo Copy Maintenance','Photo Copy Consumables Maintenance & Refilling','የፎቶ ኮፒ ቶነር መሙላት እና ጥገና','Toner refilling, drum replacement, consumable servicing','Per Machine',1500,4),
('D1','D','Computer Maintenance','Computer Preventive Maintenance','የኮምፒውተር ቅድመ ጥገና','Internal dust/fan cleaning, thermal paste, cable management, diagnostics','Per PC',1500,1),
('D2','D','Computer Maintenance','Computer Software and Driver Setup','የሶፍትዌር እና ድራይቨር መጫን','Driver setup or updates, application software installation','Per PC',1500,2),
('D3','D','Computer Maintenance','Computer OS Installation, Format','የኦፕሬቲንግ ሲስተም (OS) እና ፎርማት','Clean Windows/Linux installation, system activation','Per PC',2500,3),
('D4','D','Computer Maintenance','Computer Hardware Repair & Component Replacement','የኮምፒውተር ሃርድዌር ጥገና','Replacing RAM, SSD/HDD, PSU, CMOS battery, screen, or keyboard','Per PC',6000,4),
('D5','D','Computer Maintenance','Computer Virus Removal & System Tune-Up','ቫይረስ ማጽዳት እና ሲስተም ማፋጠን','Malware cleanup, bloatware removal, disk cleanup, startup optimization','Per PC',1500,5),
('D6','D','Computer Maintenance','Computer Data Recovery & Drive Diagnostics','የጠፋ ዳታ መመለስ','Logical data recovery, bad sector repair, file backup','Per PC',1500,6);
