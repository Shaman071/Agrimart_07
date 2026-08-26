-- 2. FARMERS (1:1 with USERS)
CREATE TABLE IF NOT EXISTS public.farmers (
    farmer_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    district TEXT NOT NULL,
    land_size NUMERIC(8, 2),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BUYERS (1:1 with USERS)
CREATE TABLE IF NOT EXISTS public.buyers (
    buyer_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    buyer_type TEXT CHECK (buyer_type IN ('retailer', 'wholesaler', 'individual', 'exporter')),
    biz_name TEXT,
    gstin TEXT,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);