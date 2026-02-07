-- Migration to support negative carryforward (deficit tracking)
-- This allows carrying forward negative balances when expenses exceed income

-- Step 1: Remove the CHECK constraint that prevents negative amounts
ALTER TABLE carryforwards DROP CONSTRAINT IF EXISTS carryforwards_amount_check;

-- Step 2: Add new CHECK constraint that allows negative amounts
ALTER TABLE carryforwards ADD CONSTRAINT carryforwards_amount_check CHECK (amount >= -999999.99);

-- Step 3: Update the create_carryforward function to handle negative balances
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
  
  -- Calculate total expenses for the date (including any deficit deducted as expense)
  SELECT COALESCE(SUM(e.amount), 0)
  INTO v_expense
  FROM expenses e
  WHERE e.site_id = p_site_id
    AND e.date = p_date
    AND e.type = 'EXPENSE';
  
  -- Calculate carryforward amount (can be positive or negative)
  -- Positive: income > expense (surplus to carry forward)
  -- Negative: expense > income (deficit to carry forward)
  v_carryforward := v_income - v_expense;
  
  -- Only create carryforward if there's a non-zero amount
  IF v_carryforward != 0 THEN
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
        CASE 
          WHEN v_carryforward > 0 THEN 'Surplus carryforward from ' || p_date::TEXT
          ELSE 'Deficit carryforward from ' || p_date::TEXT
        END
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
        description = CASE 
          WHEN v_carryforward > 0 THEN 'Surplus carryforward from ' || p_date::TEXT
          ELSE 'Deficit carryforward from ' || p_date::TEXT
        END,
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

-- Update comments
COMMENT ON TABLE carryforwards IS 'Tracks daily carryforward amounts - positive for surplus, negative for deficit';
COMMENT ON FUNCTION create_carryforward IS 'Calculates and creates/updates carryforward (positive or negative) for a site and date';
COMMENT ON FUNCTION get_pending_carryforward IS 'Gets the carryforward amount (positive to add, negative to deduct) for today''s income';
