BEGIN;
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['users','farmers','buyers','produce_listings','orders','transports','transactions','disputes','pooled_contributions'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access" ON %I;', tbl);
        EXECUTE format('CREATE POLICY "Admin full access" ON %I FOR ALL USING (auth.role() = ''admin'');', tbl);
    END LOOP;
END $$;
COMMIT;
