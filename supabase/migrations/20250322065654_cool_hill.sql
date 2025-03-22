/*
  # Update Supabase helper functions

  1. Changes
     - Fixes parameter naming in functions to use table_name instead of table
     - Adds better error handling for functions
*/

-- Drop existing functions to recreate them with correct parameters
DROP FUNCTION IF EXISTS increment(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS add_to_column(UUID, TEXT, TEXT, INTEGER);

-- Create helper functions with correct parameter names
CREATE OR REPLACE FUNCTION increment(row_id UUID, table_name TEXT, column_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
  new_value INTEGER;
BEGIN
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', column_name, table_name)
  INTO current_value
  USING row_id;
  
  -- Handle NULL values
  IF current_value IS NULL THEN
    current_value := 0;
  END IF;
  
  new_value := current_value + 1;
  
  RETURN new_value;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in increment function: %', SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_to_column(row_id UUID, table_name TEXT, column_name TEXT, value_to_add INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
  new_value INTEGER;
BEGIN
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', column_name, table_name)
  INTO current_value
  USING row_id;
  
  -- Handle NULL values
  IF current_value IS NULL THEN
    current_value := 0;
  END IF;
  
  new_value := current_value + value_to_add;
  
  RETURN new_value;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in add_to_column function: %', SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql;