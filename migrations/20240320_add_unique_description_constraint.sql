-- Add unique constraint to products table for description
ALTER TABLE products ADD CONSTRAINT unique_product_description UNIQUE (description);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT unique_product_description ON products IS 'Ensures product descriptions are unique across all products'; 