-- Complete cleanup and migration script
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- STEP 1: Clean up old trigger and function
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- STEP 2: Add columns if they don't exist
-- ============================================
DO $$ 
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
  END IF;

  -- Add auth_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- ============================================
-- STEP 3: Drop ALL existing RLS policies
-- ============================================

-- Drop all policies on users table
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Drop all policies on sites table
DROP POLICY IF EXISTS "Users can view all sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can view sites" ON sites;
DROP POLICY IF EXISTS "Only admins can insert sites" ON sites;
DROP POLICY IF EXISTS "Admins and managers can insert sites" ON sites;
DROP POLICY IF EXISTS "Only admins can update sites" ON sites;
DROP POLICY IF EXISTS "Admins and managers can update sites" ON sites;
DROP POLICY IF EXISTS "Only admins can delete sites" ON sites;
DROP POLICY IF EXISTS "Admins can delete sites" ON sites;

-- Drop all policies on expenses table
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can insert expenses for their site" ON expenses;
DROP POLICY IF EXISTS "Managers can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can update expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can delete their own expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can delete expenses" ON expenses;

-- ============================================
-- STEP 4: Create NEW RLS policies
-- ============================================

-- Users table policies
CREATE POLICY "Authenticated users can view all users" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth_id = auth.uid());

CREATE POLICY "Admins can insert users" 
  ON users FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update any user" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete users" 
  ON users FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

-- Sites table policies
CREATE POLICY "Authenticated users can view sites" 
  ON sites FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins and managers can insert sites" 
  ON sites FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "Admins and managers can update sites" 
  ON sites FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "Admins can delete sites" 
  ON sites FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

-- Expenses table policies
CREATE POLICY "Authenticated users can view expenses" 
  ON expenses FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Managers can insert expenses" 
  ON expenses FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "Managers can update expenses" 
  ON expenses FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid() 
      AND (u.role = 'ADMIN' OR u.id = expenses.manager_id)
    )
  );

CREATE POLICY "Managers can delete expenses" 
  ON expenses FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid() 
      AND (u.role = 'ADMIN' OR u.id = expenses.manager_id)
    )
  );

-- ============================================
-- STEP 5: Verify setup
-- ============================================

-- Check columns exist
DO $$
DECLARE
  email_exists BOOLEAN;
  auth_id_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) INTO email_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) INTO auth_id_exists;
  
  IF email_exists AND auth_id_exists THEN
    RAISE NOTICE '✓ Columns added successfully';
  ELSE
    RAISE WARNING '✗ Some columns are missing';
  END IF;
END $$;

-- Show policy count
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename IN ('users', 'sites', 'expenses');
  
  RAISE NOTICE '✓ Created % RLS policies', policy_count;
END $$;

-- ============================================
-- Migration complete!
-- ============================================
