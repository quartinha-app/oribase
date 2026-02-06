import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import { Partner, SiteContent, Terreiro, Profile, UserRole, CampaignReward, RewardRedemption, FAQ, Professional, ServiceCategory, AdminDashboardStats } from '../types';

// --- Partners ---
export const getPartners = async () => {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name');
    if (error) throw error;
    return data as Partner[];
};

export const createPartner = async (partner: Partial<Partner>) => {
    const { data, error } = await supabase
        .from('partners')
        .insert([partner])
        .select()
        .single();
    if (error) throw error;
    return data as Partner;
};

export const updatePartner = async (id: string, updates: Partial<Partner>) => {
    const { data, error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Partner;
};

export const deletePartner = async (id: string) => {
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) throw error;
};

// --- Site Content ---
export const getSiteContent = async (section: string) => {
    const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', section);
    if (error) throw error;
    return data as SiteContent[];
};

export const updateSiteContent = async (section: string, key: string, updates: Partial<SiteContent>) => {
    // Upsert logic: try to update, if not found insert
    // Note: Supabase upsert requires primary key or unique constraint. We added unique(section, key).
    const { data, error } = await supabase
        .from('site_content')
        .upsert([{ section, key, ...updates }], { onConflict: 'section,key' })
        .select()
        .single();
    if (error) throw error;
    return data as SiteContent;
};

// --- Terreiros Management ---
export const getAllTerreiros = async () => {
    const { data, error } = await supabase
        .from('terreiros')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Terreiro[];
};

export const updateTerreiroStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
        .from('terreiros')
        .update({ verification_status: status })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Terreiro;
};

export const deleteTerreiro = async (id: string) => {
    const { error } = await supabase.from('terreiros').delete().eq('id', id);
    if (error) throw error;
};

export const createTerreiro = async (terreiro: Partial<Terreiro>) => {
    const { data, error } = await supabase
        .from('terreiros')
        .insert([terreiro])
        .select()
        .single();
    if (error) throw error;
    return data as Terreiro;
};

export const uploadTerreiroLogo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `terreiro-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('campaign-assets') // Reusing existing bucket or create new one if prefer
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const createTerreiroWithUser = async (
    terreiroData: Partial<Terreiro>,
    responsible: { name: string; email: string },
    logoFile?: File
) => {
    let logoUrl = null;

    // 1. Upload Logo if exists
    if (logoFile) {
        logoUrl = await uploadTerreiroLogo(logoFile);
    }

    // 2. Create User
    // We'll use a specific password or generate one.
    // For now, hardcoding as per plan discussion
    const tempPassword = 'Mudar@123';
    let userId = null;

    try {
        const { user } = await registerUserByAdmin(
            responsible.email,
            tempPassword,
            responsible.name,
            'lider_terreiro' // Default role for terreiro owner
        );
        userId = user?.id; // Assuming registerUserByAdmin returns { user: ... } or similar
    } catch (e: any) {
        const errorMsg = e.message?.toLowerCase() || '';
        if (errorMsg.includes('registered') || errorMsg.includes('registrado') || errorMsg.includes('already exists')) {
            throw new Error("Este e-mail já está cadastrado no sistema. Por favor, utilize outro e-mail ou vincule a conta existente (vínculo manual não implementado).");
        }
        throw e;
    }

    if (!userId) throw new Error("Falha ao criar usuário responsável.");

    // 3. Create Terreiro
    const { data, error } = await supabase
        .from('terreiros')
        .insert([{
            ...terreiroData,
            image: logoUrl || undefined,
            owner_id: userId,
            verification_status: 'verified' // Admin created, so auto-verified? Or pending? Let's say verified or pending. User prompt implies admin creates it, likely valid. Let's set 'verified'.
        }])
        .select()
        .single();

    if (error) throw error;
    return data as Terreiro;
};

// --- User Management ---
export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Profile[];
};

export const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Profile;
};

export const updateUserRole = async (id: string, role: UserRole) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Profile;
};
export const registerUserByAdmin = async (email: string, password: string, fullName: string, role: UserRole) => {
    // We create a separate client to avoid affecting the admin's session
    const adminClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
        auth: { persistSession: false }
    });

    const { data, error } = await adminClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role
            }
        }
    });

    if (error) throw error;
    return data;
};

// --- Campaigns Management ---
export const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;
};

export const getCampaignAnalytics = async (campaignId: string) => {
    // Basic count of responses
    const { count: responseCount, error: countError } = await supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

    if (countError) throw countError;

    // Fetch visits stats
    const { data: visits, error: visitsError } = await supabase
        .from('campaign_visits')
        .select('fingerprint_id');

    if (visitsError) throw visitsError;

    const totalVisits = visits?.length || 0;
    const uniqueVisits = new Set(visits?.map(v => v.fingerprint_id)).size;

    // Fetch all responses for deeper analysis
    const { data: responses, error: dataError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('campaign_id', campaignId);

    if (dataError) throw dataError;

    return {
        totalResponses: responseCount || 0,
        totalVisits,
        uniqueVisits,
        responses: responses || []
    };
};

export const getCampaignResponses = async (campaignId: string) => {
    const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- Rewards Management ---
export const getRewards = async (campaignId?: string) => {
    let query = supabase
        .from('campaign_rewards')
        .select('*, partner:partners(*)');

    if (campaignId) {
        query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as (CampaignReward & { partner: Partner })[];
};

export const createReward = async (reward: Partial<CampaignReward>) => {
    const { data, error } = await supabase
        .from('campaign_rewards')
        .insert([reward])
        .select()
        .single();
    if (error) throw error;
    return data as CampaignReward;
};

export const updateReward = async (id: string, updates: Partial<CampaignReward>) => {
    const { data, error } = await supabase
        .from('campaign_rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as CampaignReward;
};

export const deleteReward = async (id: string) => {
    const { error } = await supabase.from('campaign_rewards').delete().eq('id', id);
    if (error) throw error;
};

export const getCampaignRewards = async (campaignId: string) => {
    // We'll primarily use the campaign_id field now, but fallback to join table if needed
    // or just transition completely to campaign_id.
    const { data, error } = await supabase
        .from('campaign_rewards')
        .select('*, partner:partners(*)')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (CampaignReward & { partner: Partner })[];
};

export const linkRewardToCampaign = async (campaignId: string, rewardId: string, drawPosition?: string) => {
    const { error } = await supabase
        .from('campaign_reward_links')
        .upsert([{
            campaign_id: campaignId,
            reward_id: rewardId,
            draw_position: drawPosition
        }]);
    if (error) throw error;
};

export const unlinkRewardFromCampaign = async (campaignId: string, rewardId: string) => {
    const { error } = await supabase
        .from('campaign_reward_links')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('reward_id', rewardId);
    if (error) throw error;
};

// --- FAQ Management ---
export const getFAQs = async (category?: string) => {
    let query = supabase.from('faqs').select('*').order('order_index');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data as FAQ[];
};

export const createFAQ = async (faq: Partial<FAQ>) => {
    const { data, error } = await supabase.from('faqs').insert([faq]).select().single();
    if (error) throw error;
    return data as FAQ;
};

export const updateFAQ = async (id: string, updates: Partial<FAQ>) => {
    const { data, error } = await supabase.from('faqs').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as FAQ;
};

export const deleteFAQ = async (id: string) => {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) throw error;
};

// --- Service Categories ---
export const getAdminServiceCategories = async () => {
    const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
    if (error) throw error;
    return data as ServiceCategory[];
};

export const createServiceCategory = async (category: Partial<ServiceCategory>) => {
    const { data, error } = await supabase
        .from('service_categories')
        .insert([category])
        .select()
        .single();
    if (error) throw error;
    return data as ServiceCategory;
};

export const updateServiceCategory = async (id: string, updates: Partial<ServiceCategory>) => {
    const { data, error } = await supabase
        .from('service_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as ServiceCategory;
};

export const deleteServiceCategory = async (id: string) => {
    const { error } = await supabase.from('service_categories').delete().eq('id', id);
    if (error) throw error;
};

// --- Professionals Management ---
export const getAllProfessionals = async () => {
    const { data, error } = await supabase
        .from('professionals')
        .select(`
            *,
            category:service_categories(*)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Professional[];
};

export const updateProfessionalStatus = async (id: string, status: 'pending' | 'active' | 'expired' | 'suspended', isVerified?: boolean) => {
    const updates: any = { subscription_status: status };
    if (isVerified !== undefined) updates.is_verified = isVerified;

    // Se estiver ativando, define expiração padrão de 1 ano
    if (status === 'active') {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        updates.subscription_expires_at = nextYear.toISOString();
    }

    const { data, error } = await supabase
        .from('professionals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Professional;
};

export const deleteProfessional = async (id: string) => {
    const { error } = await supabase.from('professionals').delete().eq('id', id);
    if (error) throw error;
};
export const getProfessionalPayments = async (professionalId: string) => {
    const { data, error } = await supabase
        .from('professional_payments')
        .select(`
            *,
            plan:subscription_plans(name)
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
    const [terreiros, users, professionals, campaigns, responses] = await Promise.all([
        supabase.from('terreiros').select('verification_status'),
        supabase.from('profiles').select('role'),
        supabase.from('professionals').select('subscription_status'),
        supabase.from('campaigns').select('status'),
        supabase.from('survey_responses').select('id', { count: 'exact', head: true })
    ]);

    const stats: AdminDashboardStats = {
        terreiros: {
            total: terreiros.data?.length || 0,
            pending: terreiros.data?.filter(t => t.verification_status === 'pending').length || 0,
            verified: terreiros.data?.filter(t => t.verification_status === 'verified').length || 0,
        },
        users: {
            total: users.data?.length || 0,
            byRole: (users.data || []).reduce((acc: any, user: any) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {
                admin: 0,
                lider_terreiro: 0,
                pesquisador: 0,
                medium: 0,
                consulente: 0,
                fornecedor: 0
            } as Record<UserRole, number>)
        },
        professionals: {
            total: professionals.data?.length || 0,
            active: professionals.data?.filter(p => p.subscription_status === 'active').length || 0,
            pending: professionals.data?.filter(p => p.subscription_status === 'pending').length || 0,
        },
        diagnostic: {
            totalResponses: responses.count || 0,
            activeCampaigns: campaigns.data?.filter(c => c.status === 'active').length || 0,
        }
    };

    return stats;
};
