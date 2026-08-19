-- Rollback for initial AgriMart migration
-- WARNING: This will drop the public schema and recreate it, removing all objects in public.
-- Use with caution (suitable for local/dev environments).

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Recreate extensions commonly expected
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: if you need a more surgical rollback, replace this with explicit DROP TRIGGER/FUNCTION/POLICY/TABLE statements.
