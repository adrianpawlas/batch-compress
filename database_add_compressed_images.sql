-- Add compressed image column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS compressed_image_url TEXT;

-- Add index for faster queries on compressed images
CREATE INDEX IF NOT EXISTS idx_products_compressed_image
ON products(compressed_image_url) WHERE compressed_image_url IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN products.compressed_image_url IS 'Compressed version of image_url for faster loading (e.g., TinyPNG compressed)';
