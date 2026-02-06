-- Create rewards table
CREATE TABLE IF NOT EXISTS public.campaign_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'draw')), -- pdf or draw (sorteio)
    image_url TEXT,
    file_url TEXT, -- For PDF downloads
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table for Campaign <-> Reward (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.campaign_reward_links (
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.campaign_rewards(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, reward_id)
);

-- Redemptions/Interests table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_id UUID REFERENCES public.campaign_rewards(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fingerprint_id TEXT, -- For anonymous users
    redeemed_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB -- Extra info like "manifested intent for draw"
);

-- RLS Policies
ALTER TABLE public.campaign_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_reward_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Public rewards select" ON public.campaign_rewards FOR SELECT USING (active = true);
CREATE POLICY "Public links select" ON public.campaign_reward_links FOR SELECT USING (true);
CREATE POLICY "User redemption insert" ON public.reward_redemptions FOR INSERT WITH CHECK (true);

-- Admin policies
CREATE POLICY "Admin all rewards" ON public.campaign_rewards TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin all links" ON public.campaign_reward_links TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin all redemptions" ON public.reward_redemptions TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
