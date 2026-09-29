REVOKE EXECUTE ON FUNCTION public.my_club_id() FROM PUBLIC, anon;
GRANT SELECT ON public.club_logins TO authenticated;
CREATE POLICY "See own club login" ON public.club_logins FOR SELECT TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt()->>'email','')));