-- Allow authenticated users to view farmer and buyer profile information
-- This is necessary for marketplace browsing, listing display, order reviews, and escrow management.

DROP POLICY IF EXISTS "Anyone authenticated can view farmer profiles" ON public.farmers;
CREATE POLICY "Anyone authenticated can view farmer profiles" ON public.farmers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can view buyer profiles" ON public.buyers;
CREATE POLICY "Anyone authenticated can view buyer profiles" ON public.buyers
    FOR SELECT USING (true);
