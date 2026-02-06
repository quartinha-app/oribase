import { supabase } from './supabase';
import { Partner, SiteContent, Profile } from '../types';

export const getPublicPartners = async () => {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true)
        .order('name');
    if (error) throw error;
    return data as Partner[];
};

export const getPublicContent = async (section: string) => {
    const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', section);
    if (error) throw error;
    return data as SiteContent[];
};

export const getPublicTeam = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('show_on_landing', true)
        .order('full_name');
    if (error) throw error;
    return data as Profile[];
};

export const getPublicFAQs = async (category?: string) => {
    let query = supabase
        .from('faqs')
        .select('*')
        .eq('active', true)
        .order('order_index');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data as any[];
};
