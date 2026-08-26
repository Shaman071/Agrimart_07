-- 4. TRANSPORTS (1:1 with ORDERS)
CREATE TABLE IF NOT EXISTS public.transports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    driver TEXT NOT NULL,
    plate_num TEXT NOT NULL,
    dispatch TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TRANSACTIONS (1:1 with ORDERS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'held' CHECK (status IN ('held', 'released_to_farmer', 'refunded_to_buyer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);  