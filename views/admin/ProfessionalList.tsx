
import React, { useEffect, useState } from 'react';
import { getAllProfessionals, updateProfessionalStatus, deleteProfessional, getProfessionalPayments } from '../../services/admin';
import { Professional, ProfessionalPayment } from '../../types';
import AdminLayout from '../../layouts/AdminLayout';
import SidePanel from '../../components/layout/SidePanel';

const PaymentHistoryList: React.FC<{ professionalId: string }> = ({ professionalId }) => {
    const [payments, setPayments] = useState<ProfessionalPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getProfessionalPayments(professionalId);
                setPayments(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [professionalId]);

    if (loading) return <div className="text-center py-4 text-xs text-gray-400">Carregando...</div>;

    if (payments.length === 0) {
        return <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400 border border-dashed border-gray-200">Sem pagamentos registrados</div>;
    }

    return (
        <div className="space-y-2 max-h-40 overflow-y-auto">
            {payments.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div>
                        <div className="font-bold text-xs text-gray-900">{p.plan?.name || 'Assinatura'}</div>
                        <div className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-xs text-green-600">R$ {p.amount.toFixed(2)}</div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">{p.status}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProfessionalList: React.FC = () => {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getAllProfessionals();
            setProfessionals(data);
        } catch (e) {
            console.error(e);
            alert('Erro ao carregar profissionais');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStatusChange = async (id: string, newStatus: any, isVerified?: boolean) => {
        try {
            await updateProfessionalStatus(id, newStatus, isVerified);
            if (selectedProfessional?.id === id) {
                setSelectedProfessional({
                    ...selectedProfessional,
                    subscription_status: newStatus,
                    is_verified: isVerified !== undefined ? isVerified : selectedProfessional.is_verified
                });
            }
            loadData();
            alert(`Status atualizado com sucesso!`);
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará permanentemente todos os dados deste profissional.')) return;
        try {
            await deleteProfessional(id);
            if (selectedProfessional?.id === id) handleClosePanel();
            loadData();
            alert('Profissional excluído.');
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir');
        }
    };

    const handleViewDetails = (prof: Professional) => {
        setSelectedProfessional(prof);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setSelectedProfessional(null);
    };

    const filteredProfessionals = professionals.filter(p => {
        if (filterStatus === 'all') return true;
        return p.subscription_status === filterStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'expired': return 'bg-red-100 text-red-700 border-red-200';
            case 'suspended': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'pending': return 'Pendente';
            case 'expired': return 'Expirado';
            case 'suspended': return 'Suspenso';
            default: return status;
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Rede de Profissionais</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Gestão de assinaturas e perfis</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        {['all', 'pending', 'active', 'expired'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {status === 'all' ? 'Todos' : getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-24 bg-gray-50 rounded-[32px]" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Profissional</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Categoria</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Localização</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProfessionals.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                                                    {p.photo_url ? (
                                                        <img src={p.photo_url} className="w-full h-full object-cover" alt={p.name} />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-300 text-2xl">person</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-text-main text-sm uppercase tracking-tight flex items-center gap-2">
                                                        {p.name}
                                                        {p.is_verified && <span className="material-symbols-outlined text-blue-500 text-[16px]" title="Verificado">verified</span>}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[200px]">{p.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                                                <span className="material-symbols-outlined text-gray-400 text-sm">{p.category?.icon || 'work'}</span>
                                                <span className="text-xs font-bold text-gray-600">{p.category?.name || 'Sem categoria'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px] text-gray-300">location_on</span>
                                                {p.city} - {p.state}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(p.subscription_status)}`}>
                                                {getStatusLabel(p.subscription_status)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(p)}
                                                    className="p-3 text-primary hover:bg-primary/10 rounded-2xl transition-all"
                                                    title="Ver Detalhes"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProfessionals.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                            Nenhum profissional encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <SidePanel
                    isOpen={isPanelOpen}
                    onClose={handleClosePanel}
                    title="Detalhes do Profissional"
                >
                    {selectedProfessional && (
                        <div className="space-y-8">
                            {/* Profile Header */}
                            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-[32px] border border-gray-100 text-center">
                                <div className="size-32 rounded-full bg-white border-4 border-white shadow-md overflow-hidden mb-4 flex items-center justify-center">
                                    {selectedProfessional.photo_url ? (
                                        <img src={selectedProfessional.photo_url} className="w-full h-full object-cover" alt={selectedProfessional.name} />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-200 text-6xl">person</span>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{selectedProfessional.name}</h3>
                                <p className="text-sm text-gray-500 font-medium mb-4">{selectedProfessional.category?.name}</p>

                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedProfessional.subscription_status)}`}>
                                        {getStatusLabel(selectedProfessional.subscription_status)}
                                    </span>
                                    {selectedProfessional.is_verified && (
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">verified</span> Verificado
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <section>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block px-2">Contato</label>
                                <div className="p-5 bg-white border border-gray-100 rounded-3xl space-y-3 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                                        <span className="material-symbols-outlined text-gray-300">mail</span>
                                        {selectedProfessional.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                                        <span className="material-symbols-outlined text-gray-300">chat</span>
                                        {selectedProfessional.whatsapp} (WhatsApp)
                                    </div>
                                    {selectedProfessional.instagram && (
                                        <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                                            <span className="material-symbols-outlined text-gray-300">photo_camera</span>
                                            {selectedProfessional.instagram}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Payment History */}
                            <section>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block px-2">Histórico de Pagamentos</label>
                                <PaymentHistoryList professionalId={selectedProfessional.id} />
                            </section>

                            {/* Actions */}
                            <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block px-2 text-center">Gestão de Assinatura</label>

                                {selectedProfessional.subscription_status === 'pending' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedProfessional.id, 'active')}
                                        className="bg-success text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Aprovar / Ativar Assinatura
                                    </button>
                                )}

                                {selectedProfessional.subscription_status === 'active' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedProfessional.id, 'suspended')}
                                        className="bg-amber-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">block</span>
                                        Suspender Assinatura
                                    </button>
                                )}

                                {selectedProfessional.subscription_status === 'suspended' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedProfessional.id, 'active')}
                                        className="bg-success text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Reativar Assinatura
                                    </button>
                                )}

                                <div className="h-px bg-gray-100 my-2" />

                                <button
                                    onClick={() => handleStatusChange(selectedProfessional.id, selectedProfessional.subscription_status, !selectedProfessional.is_verified)}
                                    className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border-2 ${selectedProfessional.is_verified
                                        ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                        : 'border-blue-100 text-blue-600 bg-blue-50 hover:bg-blue-100'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                    {selectedProfessional.is_verified ? 'Remover Selo de Verificado' : 'Conceder Selo de Verificado'}
                                </button>
                            </div>
                        </div>
                    )}
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

export default ProfessionalList;
