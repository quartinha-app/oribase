-- Add social media columns to partners table
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add comment for documentation
COMMENT ON COLUMN partners.instagram IS 'Instagram profile URL';
COMMENT ON COLUMN partners.facebook IS 'Facebook page URL';
COMMENT ON COLUMN partners.linkedin IS 'LinkedIn profile URL';
COMMENT ON COLUMN partners.whatsapp IS 'WhatsApp contact link';
