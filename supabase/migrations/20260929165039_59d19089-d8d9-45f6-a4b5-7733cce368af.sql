DROP POLICY "Own stars add" ON public.stars;
CREATE POLICY "Own stars add" ON public.stars FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND lower(coalesce(auth.jwt()->>'email','')) LIKE '%@iimnagpur.ac.in');