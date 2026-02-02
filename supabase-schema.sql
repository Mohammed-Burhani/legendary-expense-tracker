-- Create enum types
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'LABORER');
CREATE TYPE site_status AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');
CREATE TYPE transaction_type AS ENUM ('EXPENSE', 'INCOME');

-- Create users table (without foreign keys first)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role user_role NOT NULL,
  site_id UUID,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sites table (without foreign keys first)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  manager_id UUID NOT NULL,
  status site_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  laborer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints after tables are created
ALTER TABLE users
  ADD CONSTRAINT fk_users_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE sites
  ADD CONSTRAINT fk_sites_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_site_id ON users(site_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_sites_manager_id ON sites(manager_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_expenses_manager_id ON expenses(manager_id);
CREATE INDEX idx_expenses_site_id ON expenses(site_id);
CREATE INDEX idx_expenses_laborer_id ON expenses(laborer_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Only admins can insert users" ON users FOR INSERT WITH CHECK (false);
CREATE POLICY "Only admins can update users" ON users FOR UPDATE USING (false);
CREATE POLICY "Only admins can delete users" ON users FOR DELETE USING (false);

-- RLS Policies for sites table
CREATE POLICY "Users can view all sites" ON sites FOR SELECT USING (true);
CREATE POLICY "Only admins can insert sites" ON sites FOR INSERT WITH CHECK (false);
CREATE POLICY "Only admins can update sites" ON sites FOR UPDATE USING (false);
CREATE POLICY "Only admins can delete sites" ON sites FOR DELETE USING (false);

-- RLS Policies for expenses table
CREATE POLICY "Users can view expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Managers can insert expenses for their site" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers can update their own expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Managers can delete their own expenses" ON expenses FOR DELETE USING (true);

-- Insert mock data
-- First, insert users (managers and admin)
INSERT INTO users (id, name, role, site_id, manager_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'MANAGER', NULL, NULL),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'MANAGER', NULL, NULL),
  ('00000000-0000-0000-0000-000000000003', 'Mike Johnson', 'MANAGER', NULL, NULL),
  ('00000000-0000-0000-0000-000000000099', 'Admin', 'ADMIN', NULL, NULL);

-- Insert sites
INSERT INTO sites (id, name, location, manager_id, status) VALUES
  ('00000000-0000-0000-0000-000000000011', 'Downtown Plaza', 'Main Street, Downtown', '00000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000012', 'Riverside Apartments', 'River Road, East Side', '00000000-0000-0000-0000-000000000002', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000013', 'Industrial Complex', 'Highway 101, North', '00000000-0000-0000-0000-000000000003', 'ACTIVE');

-- Update users with site_id
UPDATE users SET site_id = '00000000-0000-0000-0000-000000000011' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE users SET site_id = '00000000-0000-0000-0000-000000000012' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE users SET site_id = '00000000-0000-0000-0000-000000000013' WHERE id = '00000000-0000-0000-0000-000000000003';

-- Insert laborers
INSERT INTO users (id, name, role, site_id, manager_id) VALUES
  ('00000000-0000-0000-0000-000000000021', 'Raj Kumar', 'LABORER', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000022', 'Amit Singh', 'LABORER', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000023', 'Suresh Patel', 'LABORER', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000024', 'Vijay Sharma', 'LABORER', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002');

-- Insert sample expenses
INSERT INTO expenses (amount, description, category, date, manager_id, site_id, type, laborer_id) VALUES
  (1500, 'Cement - 50 bags', 'Materials', CURRENT_DATE, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'EXPENSE', NULL),
  (800, 'Daily wages - 4 laborers', 'Labor', CURRENT_DATE, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'EXPENSE', '00000000-0000-0000-0000-000000000021'),
  (5000, 'Client advance payment', 'Client Payment', CURRENT_DATE, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'INCOME', NULL),
  (2200, 'Steel rods - 100kg', 'Materials', CURRENT_DATE - INTERVAL '1 day', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'EXPENSE', NULL),
  (600, 'Daily wages - 3 laborers', 'Labor', CURRENT_DATE - INTERVAL '1 day', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'EXPENSE', '00000000-0000-0000-0000-000000000023'),
  (3500, 'Client payment', 'Client Payment', CURRENT_DATE - INTERVAL '1 day', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'INCOME', NULL);
