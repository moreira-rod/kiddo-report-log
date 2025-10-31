-- Add new roles to app_role enum (each in separate transaction)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'director') THEN
    ALTER TYPE app_role ADD VALUE 'director';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'coordinator') THEN
    ALTER TYPE app_role ADD VALUE 'coordinator';
  END IF;
END $$;