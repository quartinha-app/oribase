import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../services/supabase';
import { Campaign } from '../../types';
import { deleteCampaign } from '../../services/admin';

const AdminCampaigns: React.FC = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCampaigns(data as Campaign[]);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) return;
        try {
            await deleteCampaign(id);
            fetchCampaigns();
            alert('Campanha excluída.');
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir campanha');
        }
    };

    const handleCreate = () => {
        navigate('/admin/campaigns/new');
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Gestão de Campanhas</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Crie e monitore suas pesquisas e arrecadações</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Nova Campanha
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-gray-50 rounded-[32px]" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Campanha</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Progresso</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {campaigns.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="size-16 rounded-2xl bg-gray-100 border-2 border-white shadow-sm overflow-hidden shrink-0">
                                                    {c.image_url ? (
                                                        <img src={c.image_url} className="w-full h-full object-cover" alt={c.title} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <span className="material-symbols-outlined text-3xl">campaign</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="max-w-md">
                                                    <div className="font-black text-text-main text-base uppercase tracking-tight line-clamp-1">{c.title}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">SLUG: {c.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="max-w-[160px] mx-auto space-y-2">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-gray-400">Respostas</span>
                                                    <span className="text-primary">{c.current_amount || 0} / {c.goal_amount || '∞'}</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500"
                                                        style={{ width: `${Math.min(100, (c.current_amount || 0) / (c.goal_amount || 1) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${c.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                <span className={`size-1.5 rounded-full ${c.status === 'active' ? 'bg-success' : 'bg-gray-300'}`} />
                                                {c.status === 'active' ? 'Ativa' : 'Rascunho'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/campaigns/${c.id}/raffle`)}
                                                    className="p-3 text-purple-500 hover:bg-purple-50 rounded-2xl transition-all"
                                                    title="Sorteador"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">redeem</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/campaigns/${c.id}/analytics`)}
                                                    className="p-3 text-amber-500 hover:bg-amber-50 rounded-2xl transition-all"
                                                    title="Analytics"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">analytics</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/campaigns/${c.id}`)}
                                                    className="p-3 text-primary hover:bg-primary/10 rounded-2xl transition-all"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">edit_note</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    disabled={c.status !== 'draft'}
                                                    className={`p-3 rounded-2xl transition-all ${c.status === 'draft'
                                                        ? 'text-red-500 hover:bg-red-50'
                                                        : 'text-gray-300 cursor-not-allowed'}`}
                                                    title={c.status === 'draft' ? 'Excluir' : 'Não é possível excluir campanhas ativas'}
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {campaigns.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                            Nenhuma campanha criada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCampaigns;
