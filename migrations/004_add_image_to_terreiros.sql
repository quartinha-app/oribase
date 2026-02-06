-- Add image column to terreiros table
ALTER TABLE public.terreiros 
ADD COLUMN IF NOT EXISTS image text;

-- Add description column if it doesn't exist (just in case, as it was used in code)
ALTER TABLE public.terreiros 
ADD COLUMN IF NOT EXISTS description text;

-- Add contact_email column if it doesn't exist
ALTER TABLE public.terreiros 
ADD COLUMN IF NOT EXISTS contact_email text;

-- Add contact_whatsapp column if it doesn't exist
ALTER TABLE public.terreiros 
ADD COLUMN IF NOT EXISTS contact_whatsapp text;
