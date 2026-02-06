-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-assets', 'campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Allow public access to read files
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'campaign-assets' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
    bucket_id = 'campaign-assets' 
    AND auth.role() = 'authenticated' 
);

-- Allow authenticated users to update/delete their own files (optional but good practice)
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
USING ( 
    bucket_id = 'campaign-assets' 
    AND auth.role() = 'authenticated' 
);

CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
USING ( 
    bucket_id = 'campaign-assets' 
    AND auth.role() = 'authenticated' 
);
