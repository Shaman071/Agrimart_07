-- 3. PRODUCE_LISTINGS (1:M with FARMERS)
CREATE TABLE IF NOT EXISTS public.produce_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    qty_avail NUMERIC(10, 2) NOT NULL,
    qty_reserv NUMERIC(10, 2) DEFAULT 0.00,
    ai_grade TEXT CHECK (ai_grade IN ('Grade A', 'Grade B', 'Grade C', 'Pending')) DEFAULT 'Pending',
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);