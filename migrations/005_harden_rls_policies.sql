-- Migration: Harden RLS Policies
-- Goal: Replace insecure "auth.role() = 'authenticated'" checks with proper role-based checks.

-- 1. Profiles Hardening
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. News Hardening
DROP POLICY IF EXISTS "Admins can insert news" ON public.news;
DROP POLICY IF EXISTS "Admins can update news" ON public.news;
DROP POLICY IF EXISTS "Admins can delete news" ON public.news;

CREATE POLICY "Only admins can manage news" ON public.news
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- 3. Partners Hardening
DROP POLICY IF EXISTS "Admins can view all partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can insert partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can update partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can delete partners" ON public.partners;

CREATE POLICY "Only admins can manage partners" ON public.partners
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- 4. Site Content Hardening
DROP POLICY IF EXISTS "Admins can insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can update site_content" ON public.site_content;

CREATE POLICY "Only admins can manage site content" ON public.site_content
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- 5. Storage Hardening (Bucket: campaign-assets)
-- We need to check role in profiles for storage policies too
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

CREATE POLICY "Admins can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'campaign-assets'
    AND public.is_admin()
);

CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'campaign-assets'
    AND public.is_admin()
);

CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'campaign-assets'
    AND public.is_admin()
);
