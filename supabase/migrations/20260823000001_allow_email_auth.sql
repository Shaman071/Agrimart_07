-- Migration to add email column and make phone optional in users table
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
