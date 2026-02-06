import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getProfessionalByUserId, Professional } from '../../services/professional';
import {
    getSubscriptionPlans,
    getPaymentHistory,
    createPayment
} from '../../services/subscriptionService';
import { SubscriptionPlan, ProfessionalPayment } from '../../types';

const SubscriptionManager: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [professional, setProfessional] = useState<Professional | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [payments, setPayments] = useState<ProfessionalPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const prof = await getProfessionalByUserId(user!.id);
            if (!prof) {
                navigate('/cadastro-profissional');
                return;
            }
            setProfessional(prof);

            const [p, h] = await Promise.all([
                getSubscriptionPlans(),
                getPaymentHistory(prof.id)
            ]);
            setPlans(p || []);
            setPayments(h || []);
        } catch (error) {
            console.error('Error loading subscription data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!professional || !selectedPlanId) return;

        const plan = plans.find(p => p.id === selectedPlanId);
        if (!plan) return;

        if (!window.confirm(`Confirma a assinatura do plano ${plan.name} por R$ ${plan.price}?`)) return;

        try {
            setActionLoading(true);
            await createPayment(professional.id, plan.id, plan.price, plan.duration_months);

            alert('Assinatura realizada com sucesso!');
            await loadData(); // Reload to show new status
        } catch (error) {
            console.error('Error subscribing:', error);
            alert('Erro ao processar assinatura.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide">Ativo</span>;
            case 'pending':
                return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide">Pendente</span>;
            case 'expired':
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide">Expirado</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide">{status}</span>;
        }
    };

    if (loading) {
        return (
            <MainLayout variant="app">
                <div className="flex justify-center p-20">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout variant="app" subtitle="Minha Assinatura">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-text-main mb-2">Assinatura e Pagamentos</h1>
                        <p className="text-text-secondary">Gerencie seu plano e visualize seu histórico.</p>
                    </div>
                    <Link to="/area-profissional">
                        <button className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                            Voltar
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Status & Plans Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Current Status */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h2 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">verified_user</span>
                                Status da Assinatura
                            </h2>

                            <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div>
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Situação Atual</div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(professional?.subscription_status || 'unknown')}
                                        {professional?.subscription_expires_at && (
                                            <span className="text-sm font-medium text-gray-500">
                                                Expira em: {new Date(professional.subscription_expires_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {professional?.subscription_status === 'active' && (
                                    <div className="size-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Available Plans */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h2 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">shopping_cart</span>
                                Planos Disponíveis
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plans.map(plan => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`relative cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedPlanId === plan.id
                                            ? 'border-primary bg-primary/5 shadow-md'
                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-lg text-gray-900">{plan.name}</h3>
                                                <div className="text-sm text-gray-500 font-medium">
                                                    {plan.duration_months === 1 ? 'Renova mensalmente' : `Válido por ${plan.duration_months} meses`}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-primary">R$ {plan.price.toFixed(2)}</div>
                                            </div>
                                        </div>

                                        {selectedPlanId === plan.id && (
                                            <div className="absolute top-4 right-4 text-primary animate-in zoom-in">
                                                <span className="material-symbols-outlined">check_circle</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleSubscribe}
                                    disabled={!selectedPlanId || actionLoading}
                                    className="px-8 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    {actionLoading ? 'Processando...' : 'Assinar Agora'}
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* History Column */}
                    <div className="lg:col-span-1">
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
                            <h2 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">history</span>
                                Histórico
                            </h2>

                            {payments.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    Nenhum pagamento registrado.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {payments.map(payment => (
                                        <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                                            <div>
                                                <div className="font-bold text-gray-900">{payment.plan?.name || 'Assinatura'}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(payment.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">R$ {payment.amount.toFixed(2)}</div>
                                                <div className="text-[10px] uppercase font-bold text-gray-400">{payment.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SubscriptionManager;
