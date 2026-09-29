INSERT INTO public.clubs (slug, name, tagline) VALUES
 ('finance','Finance Club','Finance Club'),
 ('ecell','E-Cell','Entrepreneurship Cell'),
 ('strategy','Strategy & Consulting','Strategy and Consulting Club'),
 ('predixion','Predixion','Analytics Club')
ON CONFLICT (slug) DO NOTHING;

DELETE FROM public.club_logins WHERE email IN (
 'marx@noticeboard.iimnagpur.club','prodg@noticeboard.iimnagpur.club','placecomm@noticeboard.iimnagpur.club');

INSERT INTO public.club_logins (email, club_id)
SELECT v.email, c.id FROM (VALUES
 ('club-marketing@iimnagpur.ac.in','marx'),
 ('club-prodman@iimnagpur.ac.in','prodg'),
 ('placecom@iimnagpur.ac.in','placecomm'),
 ('club-finance@iimnagpur.ac.in','finance'),
 ('ecell@iimnagpur.ac.in','ecell'),
 ('club-strategyandconsulting@iimnagpur.ac.in','strategy'),
 ('club-analytics@iimnagpur.ac.in','predixion')
) v(email, slug) JOIN public.clubs c ON c.slug = v.slug
ON CONFLICT (email) DO UPDATE SET club_id = EXCLUDED.club_id;