-- Create Service Categories
CREATE TABLE public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT, -- Material Symbols name
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS for categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for categories
CREATE POLICY "Public categories are viewable by everyone" ON public.service_categories
    FOR SELECT USING (true);
    
-- Only admins can manage categories
CREATE POLICY "Admins can manage categories" ON public.service_categories
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );


-- Create Professionals Table
CREATE TABLE public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to auth user
    category_id UUID REFERENCES public.service_categories(id),
    name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    
    -- Location
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    neighborhood TEXT,
    
    -- Contact (Revealed on click)
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    instagram TEXT,
    site_url TEXT,
    
    -- Status & Subscription
    subscription_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'expired', 'suspended'
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    
    -- Metrics Cache
    rating_average NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS for professionals
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Public can view ACTIVE professionals
CREATE POLICY "Active professionals are viewable by everyone" ON public.professionals
    FOR SELECT USING (subscription_status = 'active');

-- Users can view their OWN professional profile regardless of status
CREATE POLICY "Users can view own professional profile" ON public.professionals
    FOR SELECT USING (auth.uid() = user_id);

-- Professionals can update their own profile
CREATE POLICY "Professionals can update own profile" ON public.professionals
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile request
CREATE POLICY "Users can register as professional" ON public.professionals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
-- Admins can view/edit all
CREATE POLICY "Admins can manage all professionals" ON public.professionals
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );


-- Create Reviews Table
CREATE TABLE public.professional_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Reviewer
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are public
CREATE POLICY "Reviews are public" ON public.professional_reviews
    FOR SELECT USING (true);

-- Authenticated users can write reviews
CREATE POLICY "Auth users can review" ON public.professional_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Create Metrics / Click Log Table
CREATE TABLE public.professional_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
    fingerprint_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL, -- 'whatsapp', 'email', 'instagram', 'profile_view'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.professional_metrics ENABLE ROW LEVEL SECURITY;

-- Anonymous users (via server function usually, but allowing insert for public usage logic if needed) 
-- Ideally this would be inserted via a secure RPC, but for now allow public insert with rate limiting logic on client/server
CREATE POLICY "Public can insert metrics" ON public.professional_metrics
    FOR INSERT WITH CHECK (true);

-- Only owner or admin can read metrics
CREATE POLICY "Professionals can view own metrics" ON public.professional_metrics
    FOR SELECT USING (
        professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view all metrics" ON public.professional_metrics
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );


-- Indexes for performance
CREATE INDEX idx_professionals_category ON public.professionals(category_id);
CREATE INDEX idx_professionals_status ON public.professionals(subscription_status);
CREATE INDEX idx_professionals_location ON public.professionals(state, city);
CREATE INDEX idx_metrics_professional ON public.professional_metrics(professional_id);
