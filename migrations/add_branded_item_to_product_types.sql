-- Add is_branded_item column to product_types table
-- This allows product types to be marked as branded items (like keychains, stickers)
-- that don't need unique famous moments

ALTER TABLE product_types 
ADD COLUMN is_branded_item BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN product_types.is_branded_item IS 'Indicates if this product type is a branded item (like keychains, stickers) that does not require unique famous moments';

-- Update existing product types to not be branded items by default
UPDATE product_types SET is_branded_item = FALSE WHERE is_branded_item IS NULL;
