-- Function to update both products and product types with owner's Stripe account
CREATE OR REPLACE FUNCTION update_owner_stripe_account(owner_account_id TEXT)
RETURNS void AS $$
BEGIN
  -- Update all products
  UPDATE products
  SET stripe_account_id = owner_account_id,
      updated_at = NOW()
  WHERE stripe_account_id IS NULL OR stripe_account_id != owner_account_id;

  -- Update all product types
  UPDATE product_types
  SET stripe_account_id = owner_account_id,
      updated_at = NOW()
  WHERE stripe_account_id IS NULL OR stripe_account_id != owner_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clear Stripe account from both products and product types
CREATE OR REPLACE FUNCTION clear_owner_stripe_account()
RETURNS void AS $$
BEGIN
  -- Clear all products
  UPDATE products
  SET stripe_account_id = NULL,
      updated_at = NOW()
  WHERE stripe_account_id IS NOT NULL;

  -- Clear all product types
  UPDATE product_types
  SET stripe_account_id = NULL,
      updated_at = NOW()
  WHERE stripe_account_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql; 