-- AgriMart Row Level Security Policies
-- Run AFTER schema.sql

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pooled_contributions ENABLE ROW LEVEL SECURITY;

-- USERS TABLE
-- Users can read their own row
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Farmers can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- FARMERS TABLE
-- Farmers can read/update their own profile
CREATE POLICY "Farmers can read own profile" ON farmers
    FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own profile" ON farmers
    FOR UPDATE USING (auth.uid() = farmer_id);

-- BUYERS TABLE
-- Buyers can read/update their own profile
CREATE POLICY "Buyers can read own profile" ON buyers
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own profile" ON buyers
    FOR UPDATE USING (auth.uid() = buyer_id);

-- PRODUCE LISTINGS
-- Farmers can CRUD their own listings
CREATE POLICY "Farmers can read own listings" ON produce_listings
    FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can insert own listings" ON produce_listings
    FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own listings" ON produce_listings
    FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete own listings" ON produce_listings
    FOR DELETE USING (auth.uid() = farmer_id);

-- All authenticated users can read ACTIVE listings (for marketplace)
CREATE POLICY "Anyone can read active listings" ON produce_listings
    FOR SELECT USING (is_active = TRUE);

-- ORDERS
-- Buyers can read their own orders
CREATE POLICY "Buyers can read own orders" ON orders
    FOR SELECT USING (auth.uid() = buyer_id);

-- Farmers can read orders for their listings
CREATE POLICY "Farmers can read orders for own listings" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM produce_listings pl
            WHERE pl.id = orders.listing_id
            AND pl.farmer_id = auth.uid()
        )
    );

-- Buyers can create orders
CREATE POLICY "Buyers can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Farmers can update order status (Accept/Dispatch) for their listings
CREATE POLICY "Farmers can update order status" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM produce_listings pl
            WHERE pl.id = orders.listing_id
            AND pl.farmer_id = auth.uid()
        )
    );

-- TRANSPORTS
-- Farmers can manage transports for their orders
CREATE POLICY "Farmers can manage transports" ON transports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN produce_listings pl ON pl.id = o.listing_id
            WHERE o.id = transports.order_id
            AND pl.farmer_id = auth.uid()
        )
    );

-- Buyers can read transports for their orders
CREATE POLICY "Buyers can read transports" ON transports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = transports.order_id
            AND o.buyer_id = auth.uid()
        )
    );

-- TRANSACTIONS
-- Parties on an order can read the transaction
CREATE POLICY "Order parties can read transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = transactions.order_id
            AND (o.buyer_id = auth.uid() OR EXISTS (
                SELECT 1 FROM produce_listings pl
                WHERE pl.id = o.listing_id AND pl.farmer_id = auth.uid()
            ))
        )
    );

-- DISPUTES
-- Parties on an order can read/create disputes
CREATE POLICY "Order parties can read disputes" ON disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = disputes.order_id
            AND (o.buyer_id = auth.uid() OR EXISTS (
                SELECT 1 FROM produce_listings pl
                WHERE pl.id = o.listing_id AND pl.farmer_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Order parties can create disputes" ON disputes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = disputes.order_id
            AND (o.buyer_id = auth.uid() OR EXISTS (
                SELECT 1 FROM produce_listings pl
                WHERE pl.id = o.listing_id AND pl.farmer_id = auth.uid()
            ))
        )
    );

-- Admins can read all disputes
CREATE POLICY "Admins can read all disputes" ON disputes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can resolve disputes
CREATE POLICY "Admins can update disputes" ON disputes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- POOLED CONTRIBUTIONS
-- Buyers can read their own contributions
CREATE POLICY "Buyers can read own contributions" ON pooled_contributions
    FOR SELECT USING (auth.uid() = buyer_id);

-- Buyers can join pools
CREATE POLICY "Buyers can join pools" ON pooled_contributions
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Farmers can read contributions for their listings
CREATE POLICY "Farmers can read pool contributions" ON pooled_contributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM produce_listings pl
            WHERE pl.id = pooled_contributions.listing_id
            AND pl.farmer_id = auth.uid()
        )
    );

-- ADMIN BYPASS POLICIES
-- Admins have full access to all tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['users','farmers','buyers','produce_listings','orders','transports','transactions','disputes','pooled_contributions'])
    LOOP
        EXECUTE format('CREATE POLICY "Admin full access" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ''admin''))', tbl);
    END LOOP;
END $$;

-- CROSS-PROFILE VIEWING (after order acceptance)
-- Buyers can see minimal farmer info once order is Accepted
CREATE POLICY "Buyers can view farmer profile after acceptance" ON farmers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN produce_listings pl ON pl.id = o.listing_id
            WHERE pl.farmer_id = farmers.farmer_id
            AND o.buyer_id = auth.uid()
            AND o.status IN ('Accepted', 'Dispatched', 'Completed')
        )
    );

-- Farmers can see minimal buyer info once order is Accepted
CREATE POLICY "Farmers can view buyer profile after acceptance" ON buyers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN produce_listings pl ON pl.id = o.listing_id
            WHERE pl.farmer_id = auth.uid()
            AND o.buyer_id = buyers.buyer_id
            AND o.status IN ('Accepted', 'Dispatched', 'Completed')
        )
    );