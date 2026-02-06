import { supabase } from './supabase';
import { NewsItem } from '../types';

export const getNews = async (onlyActive = false) => {
    let query = supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });

    if (onlyActive) {
        query = query.eq('active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as NewsItem[];
};

export const getNewsById = async (id: string) => {
    const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as NewsItem;
};

export const createNews = async (news: Partial<NewsItem>) => {
    const { data, error } = await supabase
        .from('news')
        .insert([news])
        .select()
        .single();

    if (error) throw error;
    return data as NewsItem;
};

export const updateNews = async (id: string, updates: Partial<NewsItem>) => {
    const { data, error } = await supabase
        .from('news')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as NewsItem;
};

export const deleteNews = async (id: string) => {
    const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
