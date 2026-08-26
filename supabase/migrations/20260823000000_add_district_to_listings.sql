-- Migration to add district column to produce_listings table
ALTER TABLE public.produce_listings ADD COLUMN IF NOT EXISTS district VARCHAR(100);
