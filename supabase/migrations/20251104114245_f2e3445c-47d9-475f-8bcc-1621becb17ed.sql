-- Add student role to app_role enum (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'student') THEN
    ALTER TYPE app_role ADD VALUE 'student';
  END IF;
END $$;

-- Add hierarchy fields to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'managed_by') THEN
    ALTER TABLE public.profiles ADD COLUMN managed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add hierarchy fields to classes table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'managed_by') THEN
    ALTER TABLE public.classes ADD COLUMN managed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance on hierarchy queries
CREATE INDEX IF NOT EXISTS idx_profiles_managed_by ON public.profiles(managed_by);
CREATE INDEX IF NOT EXISTS idx_classes_managed_by ON public.classes(managed_by);