import { supabase } from '../supabase';
import { ProfessionalService } from '../../types';

export interface Professional {
    id: string;
    user_id: string;
    category_id: string;
    name: string;
    bio: string | null;
    photo_url: string | null;
    city: string;
    state: string;
    neighborhood: string | null;
    whatsapp: string;
    email: string;
    instagram: string | null;
    site_url: string | null;
    subscription_status: 'pending' | 'active' | 'expired' | 'suspended';
    subscription_expires_at: string | null;
    is_verified: boolean;
    banner_url: string | null;
    rating_average: number;
    rating_count: number;
}

export interface ServiceCategory {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
}

export const getServiceCategories = async () => {
    const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('active', true)
        .order('name');

    if (error) throw error;
    return data as ServiceCategory[];
};

export const getFeaturedProfessionals = async (limit = 4) => {
    const { data, error } = await supabase
        .from('professionals')
        .select(`
            *,
            category:service_categories(name, icon)
        `)
        .ilike('subscription_status', 'active')
        .order('rating_average', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as (Professional & { category: ServiceCategory })[];
};

export const getProfessionals = async (filters?: {
    category_id?: string;
    city?: string;
    state?: string;
    search?: string;
}) => {
    let query = supabase
        .from('professionals')
        .select(`
            *,
            category:service_categories(name, icon)
        `)
        .ilike('subscription_status', 'active');

    if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
    }
    if (filters?.state) {
        query = query.eq('state', filters.state);
    }
    if (filters?.city) {
        query = query.eq('city', filters.city);
    }
    if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as (Professional & { category: ServiceCategory })[];
};

export const getProfessionalById = async (id: string) => {
    const { data, error } = await supabase
        .from('professionals')
        .select(`
            *,
            category:service_categories(*)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Professional & { category: ServiceCategory };
};

export const getProfessionalByUserId = async (userId: string) => {
    const { data, error } = await supabase
        .from('professionals')
        .select(`
            *,
            category:service_categories(*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data as Professional & { category: ServiceCategory } | null;
};

export const createProfessionalProfile = async (profileData: Omit<Professional, 'id' | 'subscription_status' | 'rating_average' | 'rating_count' | 'is_verified'>) => {
    const { data, error } = await supabase
        .from('professionals')
        .insert([profileData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateProfessionalProfile = async (id: string, updates: Partial<Professional>) => {
    const { data, error } = await supabase
        .from('professionals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const registerInteraction = async (professionalId: string, type: 'whatsapp' | 'email' | 'instagram' | 'profile_view', fingerprintId: string) => {
    const { error } = await supabase
        .from('professional_metrics')
        .insert({
            professional_id: professionalId,
            interaction_type: type,
            fingerprint_id: fingerprintId
        });

    if (error) console.error('Error logging interaction:', error);
};

export const getProfessionalMetrics = async (professionalId: string) => {
    const { data, error } = await supabase
        .from('professional_metrics')
        .select('interaction_type, created_at')
        .eq('professional_id', professionalId);

    if (error) throw error;
    return data;
};

// Merged from professionalServices.ts
export const getProfessionalServices = async (professionalId: string) => {
    const { data, error } = await supabase
        .from('professional_services')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as ProfessionalService[];
};

export const createProfessionalService = async (service: Omit<ProfessionalService, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('professional_services')
        .insert([service])
        .select()
        .single();

    if (error) throw error;
    return data as ProfessionalService;
};

export const updateProfessionalService = async (id: string, updates: Partial<ProfessionalService>) => {
    const { data, error } = await supabase
        .from('professional_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as ProfessionalService;
};

export const deleteProfessionalService = async (id: string) => {
    const { error } = await supabase
        .from('professional_services')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
