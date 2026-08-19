-- Migration: initial schema for AgriMart
-- Combines schema.sql, functions.sql, and rls_policies.sql

-- ---------- BEGIN schema.sql ----------
-- AgriMart Database Schema
-- PostgreSQL / Supabase compatible

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (core auth table)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmers profile table
CREATE TABLE IF NOT EXISTS farmers (
    farmer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    land_size NUMERIC(10, 2),
    is_verified BOOLEAN DEFAULT FALSE,
    trust_score NUMERIC(5, 2) DEFAULT 50.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyers profile table
CREATE TABLE IF NOT EXISTS buyers (
    buyer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    buyer_type VARCHAR(20) NOT NULL CHECK (buyer_type IN ('Consumer', 'Retailer', 'Wholesaler')),
    biz_name VARCHAR(255),
    gstin VARCHAR(15) UNIQUE,
    address TEXT,
    trust_score NUMERIC(5, 2) DEFAULT 50.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produce listings table
CREATE TABLE IF NOT EXISTS produce_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    crop_type VARCHAR(100) NOT NULL,
    qty_avail NUMERIC(10, 2) NOT NULL DEFAULT 0,
    qty_reserved NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL,
    ai_grade VARCHAR(10) CHECK (ai_grade IN ('A', 'B', 'C')),
    is_active BOOLEAN DEFAULT TRUE,
    pooling_enabled BOOLEAN DEFAULT FALSE,
    pooling_threshold NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Dispatched', 'Completed', 'Disputed')),
    is_pooled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transports table
CREATE TABLE IF NOT EXISTS transports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver VARCHAR(255),
    plate_num VARCHAR(20),
    dispatch VARCHAR(20) DEFAULT 'Picked Up' CHECK (dispatch IN ('Picked Up', 'In Transit', 'Arrived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (escrow)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Locked' CHECK (status IN ('Locked', 'Released', 'Refunded')),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    evidence_urls TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Pooled contributions table (group buying)
CREATE TABLE IF NOT EXISTS pooled_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(listing_id, buyer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON produce_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_crop ON produce_listings(crop_type);
CREATE INDEX IF NOT EXISTS idx_listings_active ON produce_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_pooled_listing ON pooled_contributions(listing_id);

-- ---------- END schema.sql ----------


-- ---------- BEGIN functions.sql ----------
-- AgriMart PostgreSQL Functions
-- Atomic operations, triggers, and business logic

-- ============================================================
-- 1. Atomic Stock Reservation Function
-- Prevents double-selling under concurrency using SELECT FOR UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION reserve_stock(p_listing_id UUID, p_qty NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_avail NUMERIC;
BEGIN
    -- Lock the listing row for update to prevent race conditions
    SELECT qty_avail INTO v_avail
    FROM produce_listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF v_avail IS NULL THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;

    IF v_avail < p_qty THEN
        RETURN FALSE;
    END IF;

    UPDATE produce_listings
    SET qty_avail = qty_avail - p_qty,
        qty_reserved = qty_reserved + p_qty,
        updated_at = NOW()
    WHERE id = p_listing_id;

    RETURN TRUE;
END;
$$;

-- Function to release reserved stock (e.g., on order cancellation)
CREATE OR REPLACE FUNCTION release_stock(p_listing_id UUID, p_qty NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE produce_listings
    SET qty_avail = qty_avail + p_qty,
        qty_reserved = GREATEST(qty_reserved - p_qty, 0),
        updated_at = NOW()
    WHERE id = p_listing_id;
END;
$$;

-- ============================================================
-- 2. Trust Score Calculation
-- Recalculates trust_score when orders complete or are disputed
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_farmer_trust_score(p_farmer_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_completed INT;
    v_disputed INT;
    v_total INT;
    v_score NUMERIC;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE o.status = 'Completed'),
        COUNT(*) FILTER (WHERE o.status = 'Disputed'),
        COUNT(*)
    INTO v_completed, v_disputed, v_total
    FROM orders o
    JOIN produce_listings pl ON pl.id = o.listing_id
    WHERE pl.farmer_id = p_farmer_id;

    IF v_total = 0 THEN
        RETURN 50.00;
    END IF;

    -- Base score: 50 + completion_rate * 40 - dispute_penalty * 10
    v_score := 50.00 + (v_completed::NUMERIC / v_total * 40.00) - (v_disputed::NUMERIC / v_total * 10.00);
    v_score := GREATEST(LEAST(v_score, 100.00), 0.00);

    UPDATE farmers
    SET trust_score = ROUND(v_score, 2)
    WHERE farmer_id = p_farmer_id;

    RETURN ROUND(v_score, 2);
END;
$$;

CREATE OR REPLACE FUNCTION calculate_buyer_trust_score(p_buyer_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_completed INT;
    v_disputed INT;
    v_total INT;
    v_score NUMERIC;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE status = 'Completed'),
        COUNT(*) FILTER (WHERE status = 'Disputed'),
        COUNT(*)
    INTO v_completed, v_disputed, v_total
    FROM orders
    WHERE buyer_id = p_buyer_id;

    IF v_total = 0 THEN
        RETURN 50.00;
    END IF;

    v_score := 50.00 + (v_completed::NUMERIC / v_total * 40.00) - (v_disputed::NUMERIC / v_total * 10.00);
    v_score := GREATEST(LEAST(v_score, 100.00), 0.00);

    UPDATE buyers
    SET trust_score = ROUND(v_score, 2)
    WHERE buyer_id = p_buyer_id;

    RETURN ROUND(v_score, 2);
END;
$$;

-- Trigger function to auto-update trust scores
CREATE OR REPLACE FUNCTION update_trust_scores_on_order_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_farmer_id UUID;
BEGIN
    -- Only act on status changes to Completed or Disputed
    IF NEW.status IN ('Completed', 'Disputed') AND NEW.status != OLD.status THEN
        -- Get farmer_id from listing
        SELECT pl.farmer_id INTO v_farmer_id
        FROM produce_listings pl
        WHERE pl.id = NEW.listing_id;

        IF v_farmer_id IS NOT NULL THEN
            PERFORM calculate_farmer_trust_score(v_farmer_id);
        END IF;

        PERFORM calculate_buyer_trust_score(NEW.buyer_id);
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS trigger_update_trust_scores ON orders;
CREATE TRIGGER trigger_update_trust_scores
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_trust_scores_on_order_change();

-- ============================================================
-- 3. Order State Machine Validation
-- Enforces valid status transitions at DB level
-- ============================================================
CREATE OR REPLACE FUNCTION validate_order_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Define valid transitions
    IF OLD.status = 'Pending' AND NEW.status NOT IN ('Accepted', 'Disputed') THEN
        RAISE EXCEPTION 'Invalid transition: Pending -> %', NEW.status;
    END IF;

    IF OLD.status = 'Accepted' AND NEW.status NOT IN ('Dispatched', 'Disputed') THEN
        RAISE EXCEPTION 'Invalid transition: Accepted -> %', NEW.status;
    END IF;

    IF OLD.status = 'Dispatched' AND NEW.status NOT IN ('Completed', 'Disputed') THEN
        RAISE EXCEPTION 'Invalid transition: Dispatched -> %', NEW.status;
    END IF;

    IF OLD.status IN ('Completed', 'Disputed') THEN
        RAISE EXCEPTION 'Cannot transition from terminal state: %', OLD.status;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_order_transition ON orders;
CREATE TRIGGER trigger_validate_order_transition
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION validate_order_transition();

-- ============================================================
-- 4. Auto-create Transaction on Order Acceptance (Escrow Lock)
-- ============================================================
CREATE OR REPLACE FUNCTION create_escrow_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'Pending' AND NEW.status = 'Accepted' THEN
        INSERT INTO transactions (order_id, amount, status)
        VALUES (NEW.id, NEW.total_cost, 'Locked');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_escrow ON orders;
CREATE TRIGGER trigger_create_escrow
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION create_escrow_transaction();

-- ============================================================
-- 5. Auto-release escrow on completion
-- ============================================================
CREATE OR REPLACE FUNCTION release_escrow_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'Dispatched' AND NEW.status = 'Completed' THEN
        UPDATE transactions
        SET status = 'Released', updated_at = NOW()
        WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_release_escrow ON orders;
CREATE TRIGGER trigger_release_escrow
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION release_escrow_on_completion();

-- ============================================================
-- 6. Refund escrow on dispute resolution
-- ============================================================
CREATE OR REPLACE FUNCTION handle_dispute_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'Open' AND NEW.status = 'Resolved' THEN
        -- Resolution logic: 'refund' or 'release'
        IF NEW.resolution = 'refund' THEN
            UPDATE transactions
            SET status = 'Refunded', updated_at = NOW()
            WHERE order_id = NEW.order_id;

            -- Release reserved stock back to available
            PERFORM release_stock(
                (SELECT listing_id FROM orders WHERE id = NEW.order_id),
                (SELECT quantity FROM orders WHERE id = NEW.order_id)
            );
        ELSIF NEW.resolution = 'release' THEN
            UPDATE transactions
            SET status = 'Released', updated_at = NOW()
            WHERE order_id = NEW.order_id;

            -- Mark order as completed
            UPDATE orders
            SET status = 'Completed', updated_at = NOW()
            WHERE id = NEW.order_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_dispute_resolution ON disputes;
CREATE TRIGGER trigger_dispute_resolution
AFTER UPDATE OF status ON disputes
FOR EACH ROW
EXECUTE FUNCTION handle_dispute_resolution();

-- ============================================================
-- 7. Group Buying / Pooling: Auto-convert when threshold met
-- ============================================================
CREATE OR REPLACE FUNCTION check_pool_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_qty NUMERIC;
    v_threshold NUMERIC;
    v_farmer_id UUID;
    v_price NUMERIC;
    v_crop_type VARCHAR;
BEGIN
    IF NEW.quantity > 0 THEN
        -- Get pooling threshold and listing details
        SELECT pl.pooling_threshold, pl.farmer_id, pl.price, pl.crop_type
        INTO v_threshold, v_farmer_id, v_price, v_crop_type
        FROM produce_listings pl
        WHERE pl.id = NEW.listing_id;

        IF v_threshold IS NOT NULL THEN
            -- Sum all contributions
            SELECT COALESCE(SUM(quantity), 0) INTO v_total_qty
            FROM pooled_contributions
            WHERE listing_id = NEW.listing_id;

            -- If threshold met, create a pooled order
            IF v_total_qty >= v_threshold THEN
                INSERT INTO orders (buyer_id, listing_id, quantity, total_cost, is_pooled, status)
                VALUES (NEW.buyer_id, NEW.listing_id, v_total_qty, v_total_qty * v_price, TRUE, 'Pending');

                -- Reserve stock for the full pooled quantity
                PERFORM reserve_stock(NEW.listing_id, v_total_qty);

                -- Disable pooling on listing
                UPDATE produce_listings
                SET pooling_enabled = FALSE, updated_at = NOW()
                WHERE id = NEW.listing_id;

                -- Clear contributions (optional: keep for audit)
                DELETE FROM pooled_contributions WHERE listing_id = NEW.listing_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_pool_threshold ON pooled_contributions;
CREATE TRIGGER trigger_check_pool_threshold
AFTER INSERT ON pooled_contributions
FOR EACH ROW
EXECUTE FUNCTION check_pool_threshold();

-- ============================================================
-- 8. Updated_at auto-update trigger (generic)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_produce_listings_updated_at ON produce_listings;
CREATE TRIGGER update_produce_listings_updated_at
BEFORE UPDATE ON produce_listings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transports_updated_at ON transports;
CREATE TRIGGER update_transports_updated_at
BEFORE UPDATE ON transports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- END functions.sql ----------


-- ---------- BEGIN rls_policies.sql ----------
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

-- ---------- END rls_policies.sql ----------
