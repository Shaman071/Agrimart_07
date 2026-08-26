-- Rollback: remove trigger and function
DROP TRIGGER IF EXISTS trg_sync_auth_user ON auth.users;
DROP FUNCTION IF EXISTS public.sync_auth_user();
