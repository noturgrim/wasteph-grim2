-- Add inquiry_id column to activity_log table
ALTER TABLE activity_log
ADD COLUMN IF NOT EXISTS inquiry_id UUID REFERENCES inquiry(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_log_inquiry_id ON activity_log(inquiry_id);

-- Update existing inquiry-related activities to set inquiry_id
-- Only update if the inquiry still exists in the inquiry table
UPDATE activity_log
SET inquiry_id = entity_id::uuid
WHERE entity_type = 'inquiry' 
  AND inquiry_id IS NULL
  AND EXISTS (SELECT 1 FROM inquiry WHERE id = activity_log.entity_id::uuid);
