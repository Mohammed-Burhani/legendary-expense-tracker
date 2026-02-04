-- Migration to add email authentication to users table
-- This connects the users table with Supabase Auth

-- Add email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Update RLS policies to work with Supabase Auth
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

-- New RLS policies that use auth.uid()
CREATE POLICY "Authenticated users can view all users" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  TO authenticated 
  USING (auth_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth_id = auth.uid());

-- Admin policies (you'll need to set up admin role checking)
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

-- Update sites RLS policies
DROP POLICY IF EXISTS "Users can view all sites" ON sites;
DROP POLICY IF EXISTS "Only admins can insert sites" ON sites;
DROP POLICY IF EXISTS "Only admins can update sites" ON sites;
DROP POLICY IF EXISTS "Only admins can delete sites" ON sites;

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

-- Update expenses RLS policies
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can insert expenses for their site" ON expenses;
DROP POLICY IF EXISTS "Managers can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can delete their own expenses" ON expenses;

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

-- Function to automatically create user profile after signup
-- Note: This function needs to be created but the trigger on auth.users
-- may not work due to permissions. We'll handle user creation manually in the app.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'LABORER')
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Try to create trigger on auth.users
-- This may fail if you don't have permission, which is fine
-- We'll handle user creation manually in the application
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not create trigger on auth.users - will handle user creation in application';
  WHEN OTHERS THEN
    RAISE NOTICE 'Trigger creation skipped: %', SQLERRM;
END $$;
