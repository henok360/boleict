ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS rating_comment text,
  ADD COLUMN IF NOT EXISTS rated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rated_by uuid;