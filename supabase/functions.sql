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