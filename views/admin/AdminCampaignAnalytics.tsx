import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { getCampaignAnalytics } from '../../services/admin';
import { supabase } from '../../services/supabase';
import { Campaign } from '../../types';

const AdminCampaignAnalytics: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch campaign info
            const { data: campaignData, error: campaignError } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();

            if (campaignError) throw campaignError;
            setCampaign(campaignData as Campaign);

            // Fetch analytics
            const stats = await getCampaignAnalytics(id!);
            setAnalytics(stats);
        } catch (e) {
            console.error(e);
            alert('Erro ao carregar analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <AdminLayout><div className="p-8 text-center text-text-secondary">Carregando dados da campanha...</div></AdminLayout>;
    if (!campaign) return <AdminLayout><div className="p-8 text-center text-red-500">Campanha não encontrada.</div></AdminLayout>;

    // Basic aggregate data for choices
    const processChoices = (questionId: string) => {
        const counts: Record<string, number> = {};
        analytics?.responses?.forEach((r: any) => {
            const answer = r.response_data[questionId];
            if (Array.isArray(answer)) {
                answer.forEach(val => counts[val] = (counts[val] || 0) + 1);
            } else if (answer) {
                counts[answer] = (counts[answer] || 0) + 1;
            }
        });
        return counts;
    };

    return (
        <AdminLayout>
            <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/campaigns')} className="text-gray-500 hover:text-gray-800">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-text-main line-clamp-1">{campaign.title}</h1>
                        <p className="text-xs text-text-secondary">Analytics & Resultados</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-20">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">description</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Respostas</span>
                        </div>
                        <div className="text-2xl font-black text-text-main">{analytics?.totalResponses || 0}</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">flag</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Meta</span>
                        </div>
                        <div className="text-2xl font-bold text-text-main">
                            {analytics?.totalResponses || 0} / {campaign.goal_amount || '∞'}
                        </div>
                        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, (analytics?.totalResponses || 0) / (campaign.goal_amount || 1) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">ads_click</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Cliques Totais</span>
                        </div>
                        <div className="text-2xl font-black text-text-main">{analytics?.totalVisits || 0}</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">group</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Unicos</span>
                        </div>
                        <div className="text-2xl font-black text-text-main">{analytics?.uniqueVisits || 0}</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 bg-pink-50 text-pink-500 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">leaderboard</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Conversão</span>
                        </div>
                        <div className="text-2xl font-black text-text-main">
                            {analytics?.uniqueVisits > 0
                                ? `${((analytics.totalResponses / analytics.uniqueVisits) * 100).toFixed(1)}%`
                                : '0%'}
                        </div>
                    </div>
                </div>

                {/* Analysis by Question */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">analytics</span> Resumo por Pergunta
                    </h2>

                    {campaign.form_schema?.sections.map(section => (
                        <Card key={section.id} title={section.title}>
                            <div className="space-y-8">
                                {section.questions.map(q => {
                                    if (q.type === 'info') return null;

                                    const results = (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'scale')
                                        ? processChoices(q.id)
                                        : null;

                                    return (
                                        <div key={q.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                                            <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
                                                <span className="text-primary opacity-50">Q:</span> {q.label}
                                            </h3>

                                            {results ? (
                                                <div className="space-y-3">
                                                    {Object.entries(results).map(([label, count]: [string, any]) => {
                                                        const percentage = ((count / (analytics?.totalResponses || 1)) * 100).toFixed(1);
                                                        return (
                                                            <div key={label} className="relative">
                                                                <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                                                    <span>{label}</span>
                                                                    <span className="text-text-secondary">{count} ({percentage}%)</span>
                                                                </div>
                                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 p-4 rounded-xl text-sm italic text-gray-500">
                                                    Múltiplas respostas de texto registradas.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-text-main uppercase tracking-tight text-sm">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

export default AdminCampaignAnalytics;
