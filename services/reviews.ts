import { supabase } from './supabase';
import { Review } from '../types';

export const getProfessionalReviews = async (professionalId: string): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('professional_reviews')
        .select(`
            *,
            user:user_id (
                full_name,
                avatar_url
            )
        `)
        .eq('professional_id', professionalId) // Ensure this column name matches your DB schema
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return data as Review[];
};

export const createReview = async (review: Omit<Review, 'id' | 'created_at' | 'user'>) => {
    const { data, error } = await supabase
        .from('professional_reviews') // Ensure this table name matches your DB schema
        .insert(review)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};
