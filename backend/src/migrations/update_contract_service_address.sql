-- Update contracts table to replace serviceAddress and actualAddress with latitude/longitude
-- This migration converts service address to GPS coordinates

-- Add new latitude/longitude columns
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS service_latitude TEXT,
ADD COLUMN IF NOT EXISTS service_longitude TEXT;

-- Drop old columns
ALTER TABLE contracts
DROP COLUMN IF EXISTS service_address,
DROP COLUMN IF EXISTS actual_address;

-- Add comments for clarity
COMMENT ON COLUMN contracts.service_latitude IS 'GPS latitude coordinate of service location';
COMMENT ON COLUMN contracts.service_longitude IS 'GPS longitude coordinate of service location';
