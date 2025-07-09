-- Add is_default column to product_types
ALTER TABLE product_types
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Add is_default_model column to product_type_images
ALTER TABLE product_type_images
ADD COLUMN is_default_model BOOLEAN NOT NULL DEFAULT false;

-- Create function to ensure only one default product type
CREATE OR REPLACE FUNCTION update_product_type_default()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE product_types
    SET is_default = false
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product_type default
CREATE TRIGGER ensure_single_default_product_type
BEFORE INSERT OR UPDATE ON product_types
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION update_product_type_default();

-- Create function to ensure only one default model per product type
CREATE OR REPLACE FUNCTION update_product_type_image_default()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default_model THEN
    UPDATE product_type_images
    SET is_default_model = false
    WHERE product_type_id = NEW.product_type_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product_type_image default
CREATE TRIGGER ensure_single_default_model_per_type
BEFORE INSERT OR UPDATE ON product_type_images
FOR EACH ROW
WHEN (NEW.is_default_model = true)
EXECUTE FUNCTION update_product_type_image_default();

-- Set the default product type
UPDATE product_types
SET is_default = true
WHERE id = '796f0b4e-f670-49b9-a675-8a1e2100bce3';

-- Set the default model
UPDATE product_type_images
SET is_default_model = true
WHERE id = '27a4379f-76af-4e9e-b69b-7b51e2cc6c5f'; 