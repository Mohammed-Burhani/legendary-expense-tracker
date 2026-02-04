-- Carryforward Feature Migration
-- This migration adds support for carrying forward unused income to the next day

-- Create carryforwards table
CREATE TABLE carryforwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  income_amount DECIMAL(10, 2) NOT NULL,
  expense_amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, from_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_carryforwards_site_id ON carryforwards(site_id);
CREATE INDEX idx_carryforwards_from_date ON carryforwards(from_date DESC);
CREATE INDEX idx_carryforwards_to_date ON carryforwards(to_date DESC);
CREATE INDEX idx_carryforwards_created_at ON carryforwards(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_carryforwards_updated_at BEFORE UPDATE ON carryforwards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE carryforwards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carryforwards table
CREATE POLICY "Users can view all carryforwards" ON carryforwards FOR SELECT USING (true);
CREATE POLICY "Only admins can insert carryforwards" ON carryforwards FOR INSERT WITH CHECK (false);
CREATE POLICY "Only admins can update carryforwards" ON carryforwards FOR UPDATE USING (false);
CREATE POLICY "Only admins can delete carryforwards" ON carryforwards FOR DELETE USING (false);

-- Function to calculate and create carryforward for a site and date
CREATE OR REPLACE FUNCTION create_carryforward(
  p_site_id UUID,
  p_date DATE
)
RETURNS TABLE(
  carryforward_id UUID,
  amount DECIMAL(10, 2),
  income DECIMAL(10, 2),
  expense DECIMAL(10, 2)
) AS $$
DECLARE
  v_income DECIMAL(10, 2);
  v_expense DECIMAL(10, 2);
  v_carryforward DECIMAL(10, 2);
  v_next_date DATE;
  v_carryforward_id UUID;
BEGIN
  -- Calculate next date
  v_next_date := p_date + INTERVAL '1 day';
  
  -- Calculate total income for the date (including any carryforward added as income)
  SELECT COALESCE(SUM(e.amount), 0)
  INTO v_income
  FROM expenses e
  WHERE e.site_id = p_site_id
    AND e.date = p_date
    AND e.type = 'INCOME';
  
  -- Calculate total expenses for the date
  SELECT COALESCE(SUM(e.amount), 0)
  INTO v_expense
  FROM expenses e
  WHERE e.site_id = p_site_id
    AND e.date = p_date
    AND e.type = 'EXPENSE';
  
  -- Calculate carryforward amount (only if income exceeds expense)
  v_carryforward := GREATEST(v_income - v_expense, 0);
  
  -- Only create carryforward if there's an amount to carry forward
  IF v_carryforward > 0 THEN
    -- Check if carryforward already exists for this site and date
    SELECT id INTO v_carryforward_id
    FROM carryforwards
    WHERE site_id = p_site_id AND from_date = p_date;
    
    IF v_carryforward_id IS NULL THEN
      -- Insert new carryforward record
      INSERT INTO carryforwards (
        site_id,
        from_date,
        to_date,
        amount,
        income_amount,
        expense_amount,
        description
      ) VALUES (
        p_site_id,
        p_date,
        v_next_date,
        v_carryforward,
        v_income,
        v_expense,
        'Carryforward from ' || p_date::TEXT
      )
      RETURNING id INTO v_carryforward_id;
    ELSE
      -- Update existing carryforward
      UPDATE carryforwards
      SET 
        amount = v_carryforward,
        income_amount = v_income,
        expense_amount = v_expense,
        to_date = v_next_date,
        updated_at = NOW()
      WHERE id = v_carryforward_id;
    END IF;
  END IF;
  
  -- Return the carryforward details
  RETURN QUERY
  SELECT 
    v_carryforward_id,
    v_carryforward,
    v_income,
    v_expense;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending carryforward for a site and date
CREATE OR REPLACE FUNCTION get_pending_carryforward(
  p_site_id UUID,
  p_date DATE
)
RETURNS TABLE(
  carryforward_id UUID,
  amount DECIMAL(10, 2),
  from_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.amount,
    c.from_date
  FROM carryforwards c
  WHERE c.site_id = p_site_id
    AND c.to_date = p_date
  ORDER BY c.from_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get carryforward history for a site
CREATE OR REPLACE FUNCTION get_carryforward_history(
  p_site_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  from_date DATE,
  to_date DATE,
  amount DECIMAL(10, 2),
  income_amount DECIMAL(10, 2),
  expense_amount DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.from_date,
    c.to_date,
    c.amount,
    c.income_amount,
    c.expense_amount,
    c.description,
    c.created_at
  FROM carryforwards c
  WHERE c.site_id = p_site_id
    AND (p_start_date IS NULL OR c.from_date >= p_start_date)
    AND (p_end_date IS NULL OR c.from_date <= p_end_date)
  ORDER BY c.from_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE carryforwards IS 'Tracks daily carryforward amounts when income exceeds expenses';
COMMENT ON FUNCTION create_carryforward IS 'Calculates and creates/updates carryforward for a site and date';
COMMENT ON FUNCTION get_pending_carryforward IS 'Gets the carryforward amount that should be added to today''s income';
COMMENT ON FUNCTION get_carryforward_history IS 'Retrieves carryforward history for a site with optional date range';
