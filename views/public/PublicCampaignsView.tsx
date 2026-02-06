import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getPublicCampaigns, PublicCampaignsParams } from '../../services/campaign';
import { Campaign } from '../../types';

const PublicCampaignsView: React.FC = () => {
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('from') || '';

    useEffect(() => {
        const fetchCampaigns = async () => {
            setLoading(true);
            try {
                const params: PublicCampaignsParams = {
                    search: search || undefined,
                    status: status || undefined,
                    dateFrom: dateFrom || undefined,
                };
                const data = await getPublicCampaigns(params);
                setCampaigns(data);
            } catch (error) {
                console.error('Erro ao buscar pesquisas:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [search, status, dateFrom]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set('q', value);
        else newParams.delete('q');
        setSearchParams(newParams);
    };

    const handleStatusChange = (val: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (val) newParams.set('status', val);
        else newParams.delete('status');
        setSearchParams(newParams);
    };

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 w-full">
                    <div>
                        <h1 className="text-4xl font-black text-text-main tracking-tight uppercase leading-none mb-4">
                            Arquivo de <span className="text-secondary">Pesquisas</span>
                        </h1>
                        <p className="text-text-secondary font-medium">
                            Explore todas as iniciativas e diagnósticos realizados pela OríBase.
                        </p>
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
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-secondary/20 text-secondary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-secondary hover:text-white transition-all shadow-lg shadow-secondary/5 group"
                        >
                            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Voltar para o Meu Painel
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-12 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Buscar por Título</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Digite palavras-chave..."
                                className="w-full bg-gray-50 border-transparent focus:bg-white focus:ring-4 ring-primary/5 rounded-2xl py-4 pl-12 pr-4 font-bold text-text-main transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-64">
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Filtrar por Status</label>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full bg-gray-50 border-transparent focus:bg-white focus:ring-4 ring-primary/5 rounded-2xl py-4 px-4 font-bold text-text-main transition-all outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Todos os Status</option>
                            <option value="active">Em Andamento</option>
                            <option value="ended">Finalizadas</option>
                        </select>
                    </div>

                    <div className="w-full md:w-64">
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">A partir de</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                const newParams = new URLSearchParams(searchParams);
                                if (e.target.value) newParams.set('from', e.target.value);
                                else newParams.delete('from');
                                setSearchParams(newParams);
                            }}
                            className="w-full bg-gray-50 border-transparent focus:bg-white focus:ring-4 ring-primary/5 rounded-2xl py-4 px-4 font-bold text-text-main transition-all outline-none cursor-pointer"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Carregando arquivo...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {campaigns.map((campaign) => (
                            <Link key={campaign.id} to={campaign.status === 'active' ? `/survey/${campaign.slug}` : `/pesquisas/${campaign.slug}/resultados`}>
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center ${campaign.status === 'active' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                                            <span className="material-symbols-outlined text-3xl">
                                                {campaign.status === 'active' ? 'bar_chart' : 'analytics'}
                                            </span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${campaign.status === 'active' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                                            {campaign.status === 'active' ? 'Ativa' : 'Ver Resultados'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-main mb-2 leading-tight group-hover:text-primary transition-colors">
                                        {campaign.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm mb-6 flex-grow line-clamp-3 font-medium">
                                        {campaign.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                            Lançada em: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                            arrow_forward
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {campaigns.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">search_off</span>
                                <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhuma pesquisa encontrada para estes filtros.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default PublicCampaignsView;
