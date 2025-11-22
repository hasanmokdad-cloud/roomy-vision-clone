-- Grant SELECT permissions on dorms table to anonymous and authenticated users
GRANT SELECT ON public.dorms TO anon;
GRANT SELECT ON public.dorms TO authenticated;

-- Grant SELECT permissions on rooms table as well
GRANT SELECT ON public.rooms TO anon;
GRANT SELECT ON public.rooms TO authenticated;