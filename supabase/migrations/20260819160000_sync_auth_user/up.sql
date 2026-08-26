-- Migration: sync auth.users -> public.users on signup

-- Create function to copy new auth users into public.users
CREATE OR REPLACE FUNCTION public.sync_auth_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users only if not exists
  INSERT INTO public.users (id, phone, role, created_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta->>'phone', NEW.phone), COALESCE(NEW.raw_user_meta->>'role', 'buyer'), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users AFTER INSERT
DROP TRIGGER IF EXISTS trg_sync_auth_user ON auth.users;
CREATE TRIGGER trg_sync_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user();
