-- AgriMart Database Schema
-- PostgreSQL / Supabase compatible

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (core auth table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmers profile table
CREATE TABLE farmers (
    farmer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    land_size NUMERIC(10, 2),
    is_verified BOOLEAN DEFAULT FALSE,
    trust_score NUMERIC(5, 2) DEFAULT 50.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyers profile table
CREATE TABLE buyers (
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
CREATE TABLE produce_listings (
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
CREATE TABLE orders (
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
CREATE TABLE transports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver VARCHAR(255),
    plate_num VARCHAR(20),
    dispatch VARCHAR(20) DEFAULT 'Picked Up' CHECK (dispatch IN ('Picked Up', 'In Transit', 'Arrived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (escrow)
CREATE TABLE transactions (
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
CREATE TABLE disputes (
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
CREATE TABLE pooled_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(listing_id, buyer_id)
);

-- Indexes for performance
CREATE INDEX idx_listings_farmer ON produce_listings(farmer_id);
CREATE INDEX idx_listings_crop ON produce_listings(crop_type);
CREATE INDEX idx_listings_active ON produce_listings(is_active);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_listing ON orders(listing_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_pooled_listing ON pooled_contributions(listing_id);