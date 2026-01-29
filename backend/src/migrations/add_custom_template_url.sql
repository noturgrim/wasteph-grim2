-- Add custom_template_url column to contracts table
-- This allows sales to upload client's custom contract template

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS custom_template_url TEXT;

COMMENT ON COLUMN contracts.custom_template_url IS 'URL/path to client custom contract template uploaded by sales';
