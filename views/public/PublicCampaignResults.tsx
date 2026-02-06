import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Campaign } from '../../types';

const PublicCampaignResults: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchData();
        }
    }, [slug]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch campaign info by slug
            const { data: campaignData, error: campaignError } = await supabase
                .from('campaigns')
                .select('*')
                .eq('slug', slug)
                .single();

            if (campaignError) throw campaignError;
            setCampaign(campaignData as Campaign);

            // 2. Fetch responses for analytics (now allowed by RLS for ended campaigns)
            const { data: responses, error: responsesError } = await supabase
                .from('survey_responses')
                .select('*')
                .eq('campaign_id', campaignData.id);

            if (responsesError) throw responsesError;

            // 3. Process aggregation
            const totalResponses = responses.length;
            setAnalytics({
                totalResponses,
                responses
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const processChoices = (questionId: string) => {
        const counts: Record<string, number> = {};
        analytics?.responses?.forEach((r: any) => {
            const answer = r.response_data[questionId];
            if (Array.isArray(answer)) {
                answer.forEach((val: string) => counts[val] = (counts[val] || 0) + 1);
            } else if (answer) {
                counts[answer] = (counts[answer] || 0) + 1;
            }
        });
        return counts;
    };

    if (loading) return <MainLayout><div className="p-20 text-center text-text-secondary animate-pulse font-black uppercase tracking-widest">Carregando Resultados...</div></MainLayout>;
    if (!campaign) return <MainLayout><div className="p-20 text-center text-red-500 font-bold">Pesquisa não encontrada.</div></MainLayout>;

    return (
        <MainLayout navbarProps={{ variant: 'app', subtitle: 'Resultados da Pesquisa' }}>
            <div className="bg-background-light py-12 px-6">
                <div className="max-w-4xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col items-start">
                        <button
                            onClick={() => navigate('/pesquisas')}
                            className="flex items-center gap-2 text-text-secondary hover:text-secondary transition-colors font-bold uppercase tracking-widest text-[10px] mb-8 group"
                        >
                            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Voltar para Pesquisas
                        </button>
                    </div>
                    {user && (
                        <button
                            onClick={() => {
                                const role = profile?.role;
                                if (role === 'admin') navigate('/admin');
                                else if (role === 'lider_terreiro') navigate('/leader-dashboard');
                                else if (role === 'fornecedor') navigate('/area-profissional');
                                else navigate('/dashboard');
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-secondary/20 text-secondary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-secondary hover:text-white transition-all shadow-lg shadow-secondary/5 group mb-8"
                        >
                            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Voltar para o Meu Painel
                        </button>
                    )}
                </div>

                <div className="max-w-4xl mx-auto mb-12">

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black uppercase tracking-widest mb-4">
                        Relatório Público
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tight uppercase leading-none mb-4">
                        {campaign.title}
                    </h1>
                    <p className="text-lg text-text-secondary font-medium">
                        Confira os dados agregados desta iniciativa de transparência e diagnóstico da OríBase.
                    </p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Total de Participantes</div>
                            <div className="text-3xl font-black text-text-main">{analytics?.totalResponses || 0}</div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Status da Pesquisa</div>
                            <div className="text-sm font-black text-secondary uppercase tracking-widest">Encerrada</div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Dados Verificados</div>
                            <div className="flex items-center gap-1 text-blue-500">
                                <span className="material-symbols-outlined text-base">verified</span>
                                <span className="text-sm font-bold">Auditado</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                    {campaign.form_schema?.sections.map((section: any) => (
                        <div key={section.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100">
                                <h3 className="font-black text-text-main uppercase tracking-tight text-sm">{section.title}</h3>
                            </div>
                            <div className="p-8 space-y-10">
                                {section.questions.map((q: any) => {
                                    if (q.type === 'info') return null;

                                    const results = (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'scale')
                                        ? processChoices(q.id)
                                        : null;

                                    return (
                                        <div key={q.id} className="">
                                            <h4 className="font-bold text-text-main mb-6 flex items-start gap-3">
                                                <span className="shrink-0 size-6 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center text-[10px] font-black">Q</span>
                                                {q.label}
                                            </h4>

                                            {results ? (
                                                <div className="space-y-4">
                                                    {Object.entries(results).map(([label, count]: [string, any]) => {
                                                        const percentage = ((count / (analytics?.totalResponses || 1)) * 100).toFixed(1);
                                                        return (
                                                            <div key={label} className="relative">
                                                                <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase tracking-wide">
                                                                    <span className="text-text-main">{label}</span>
                                                                    <span className="text-secondary">{count} ({percentage}%)</span>
                                                                </div>
                                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-secondary transition-all duration-1000"
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100/50 text-xs text-gray-400 italic font-medium">
                                                    Respostas de texto livre processadas para estatísticas internas.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="bg-secondary/5 rounded-3xl p-8 border border-secondary/10 text-center mt-12">
                        <span className="material-symbols-outlined text-secondary text-4xl mb-4">shield_with_heart</span>
                        <h4 className="text-xl font-black text-text-main uppercase mb-2">Transparência e Respeito</h4>
                        <p className="text-text-secondary text-sm font-medium max-w-xl mx-auto">
                            Estes resultados são o reflexo da nossa comunidade. A OríBase preserva o anonimato individual enquanto fortalece a visão coletiva do nosso povo.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PublicCampaignResults;
