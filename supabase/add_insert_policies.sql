DROP POLICY IF EXISTS "Farmers can insert own profile" ON farmers;
CREATE POLICY "Farmers can insert own profile" ON farmers FOR INSERT WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Buyers can insert own profile" ON buyers;
CREATE POLICY "Buyers can insert own profile" ON buyers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
