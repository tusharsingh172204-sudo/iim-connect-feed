CREATE TYPE public.notice_kind AS ENUM ('notice','deadline','extension','timeline');

CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clubs TO anon, authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clubs are public" ON public.clubs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.club_logins (
  email text PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE
);
GRANT ALL ON public.club_logins TO service_role;
ALTER TABLE public.club_logins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_club_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT club_id FROM public.club_logins
  WHERE lower(email) = lower(coalesce(auth.jwt()->>'email',''))
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.my_club_id() TO authenticated;

CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  kind public.notice_kind NOT NULL DEFAULT 'notice',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  due_at timestamptz,
  link text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notices are public" ON public.notices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Club posts own notices" ON public.notices FOR INSERT TO authenticated WITH CHECK (club_id = public.my_club_id());
CREATE POLICY "Club edits own notices" ON public.notices FOR UPDATE TO authenticated USING (club_id = public.my_club_id()) WITH CHECK (club_id = public.my_club_id());
CREATE POLICY "Club deletes own notices" ON public.notices FOR DELETE TO authenticated USING (club_id = public.my_club_id());

CREATE TABLE public.stars (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  notice_id uuid NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notice_id)
);
GRANT SELECT, INSERT, DELETE ON public.stars TO authenticated;
GRANT ALL ON public.stars TO service_role;
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own stars read" ON public.stars FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own stars add" ON public.stars FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own stars remove" ON public.stars FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO public.clubs (slug, name, tagline) VALUES
 ('marx','MARX','Marketing Club'),
 ('prodg','ProdG','Product Management Club'),
 ('placecomm','Placecomm','Placement Committee'),
 ('eques','Eques','Equestrian & Sports Club');

INSERT INTO public.club_logins (email, club_id)
SELECT c.slug || '@noticeboard.iimnagpur.club', c.id FROM public.clubs c;

INSERT INTO public.notices (club_id, kind, title, body, due_at, created_by)
SELECT id, 'deadline', 'Summer Placement CV submission', 'Upload final one-page CV on the portal. Late entries not accepted.', now() + interval '20 hours', NULL FROM public.clubs WHERE slug='placecomm';
INSERT INTO public.notices (club_id, kind, title, body, due_at, created_by)
SELECT id, 'extension', 'Brand Wars registration extended', 'Registrations now open till tomorrow night due to popular demand.', now() + interval '1 day 6 hours', NULL FROM public.clubs WHERE slug='marx';
INSERT INTO public.notices (club_id, kind, title, body, due_at, created_by)
SELECT id, 'timeline', 'PM Case Challenge — Round 1', 'Round 1 submissions, Round 2 shortlist on Friday, finals next week.', now() + interval '3 days', NULL FROM public.clubs WHERE slug='prodg';
INSERT INTO public.notices (club_id, kind, title, body, due_at, created_by)
SELECT id, 'notice', 'Riding sessions resume', 'Morning sessions resume from Monday, 6:30 AM at the campus grounds.', NULL, NULL FROM public.clubs WHERE slug='eques';
INSERT INTO public.notices (club_id, kind, title, body, due_at, created_by)
SELECT id, 'deadline', 'Pre-placement talk RSVP', 'RSVP for this week''s PPTs.', now() + interval '5 hours', NULL FROM public.clubs WHERE slug='placecomm';