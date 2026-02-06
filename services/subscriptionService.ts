import { supabase } from './supabase';
import { SubscriptionPlan, ProfessionalPayment } from '../types';

export const getSubscriptionPlans = async () => {
    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

    if (error) throw error;
    return data as SubscriptionPlan[];
};

export const getPaymentHistory = async (professionalId: string) => {
    const { data, error } = await supabase
        .from('professional_payments')
        .select(`
            *,
            plan:subscription_plans(name)
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ProfessionalPayment[];
};

export const createPayment = async (
    professionalId: string,
    planId: string,
    amount: number,
    durationMonths: number
) => {
    // 1. Record the payment
    const { data: payment, error: paymentError } = await supabase
        .from('professional_payments')
        .insert([{
            professional_id: professionalId,
            plan_id: planId,
            amount: amount,
            status: 'paid', // Mocking success
            payment_method: 'credit_card' // Mock default
        }])
        .select()
        .single();

    if (paymentError) throw paymentError;

    // 2. Update professional subscription status
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const { error: profileError } = await supabase
        .from('professionals')
        .update({
            subscription_status: 'active',
            subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', professionalId);

    if (profileError) throw profileError;

    return payment;
};
