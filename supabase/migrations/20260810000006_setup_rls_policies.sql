-- Enable RLS across all 7 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. Public / Buyers can view available produce listings
CREATE POLICY "Allow public read for produce listings" 
ON public.produce_listings FOR SELECT 
USING (qty_avail > 0);

-- 2. Farmers can insert/update their own listings
CREATE POLICY "Farmers can manage own listings"
ON public.produce_listings FOR ALL
USING (auth.uid() = farmer_id);

-- 3. Users can view and update their own base profile
CREATE POLICY "Users can access own user row"
ON public.users FOR ALL
USING (auth.uid() = id);

-- 4. Buyers and Farmers can view their respective orders
CREATE POLICY "Buyers can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = buyer_id);