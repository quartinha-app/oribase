import { supabase } from '../supabase';
import { Campaign } from '../../types';

export const recordCampaignVisit = async (campaignId: string, fingerprintId: string, userId?: string) => {
    try {
        const { error } = await supabase.from('campaign_visits').insert({
            campaign_id: campaignId,
            fingerprint_id: fingerprintId,
            user_id: userId
        });
        if (error) console.error('Error recording visit:', error);
    } catch (e) {
        console.error('Failed to record visit:', e);
    }
};

export interface LandingPageCampaigns {
    inProgress: Campaign | null;
    finished: Campaign | null;
    upcoming: Campaign | null;
}

export interface PublicCampaignsParams {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const getLandingPageCampaigns = async (): Promise<LandingPageCampaigns & { totalCount: number }> => {
    // Buscar campanha em andamento (mais recente ativa)
    const { data: activeData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    // Buscar campanha finalizada (mais recente finalizada)
    const { data: endedData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'ended')
        .order('created_at', { ascending: false })
        .limit(1);

    // Buscar campanha futura (mais antiga 'draft' ou com start_date futuro)
    const { data: upcomingData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: true })
        .limit(1);

    // Get total public count (excluding internal drafts if needed, but here status check is enough)
    const { count } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'ended']);

    return {
        inProgress: activeData?.[0] || null,
        finished: endedData?.[0] || null,
        upcoming: upcomingData?.[0] || null,
        totalCount: count || 0
    };
};

export const getPublicCampaigns = async (params?: PublicCampaignsParams) => {
    let query = supabase
        .from('campaigns')
        .select('*')
        .in('status', ['active', 'ended'])
        .order('created_at', { ascending: false });

    if (params?.search) {
        query = query.ilike('title', `%${params.search}%`);
    }

    if (params?.status) {
        query = query.eq('status', params.status);
    }

    if (params?.dateFrom) {
        query = query.gte('created_at', params.dateFrom);
    }

    if (params?.dateTo) {
        query = query.lte('created_at', params.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Campaign[];
};
