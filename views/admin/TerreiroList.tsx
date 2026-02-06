import React, { useEffect, useState } from 'react';
import { getAllTerreiros, updateTerreiroStatus, deleteTerreiro, createTerreiroWithUser } from '../../services/admin';
import { Terreiro } from '../../types';
import AdminLayout from '../../layouts/AdminLayout';
import SidePanel from '../../components/layout/SidePanel';

const TerreiroList: React.FC = () => {
    const [terreiros, setTerreiros] = useState<Terreiro[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTerreiro, setSelectedTerreiro] = useState<Terreiro | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // New States for enhanced creation
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [responsibleData, setResponsibleData] = useState({ name: '', email: '' });

    const [formData, setFormData] = useState<Partial<Terreiro>>({
        name: '',
        address: '',
        city: '',
        state: '',
        description: '',
        contact_email: '',
        contact_whatsapp: '' // This will be masked
    });

    // Mask Helper
    const maskWhatsapp = (value: string) => {
        return value
            .replace(/\D/g, '') // Remove non-numbers
            .replace(/^(\d{2})(\d)/g, '($1) $2') // Add parens
            .replace(/(\d)(\d{4})$/, '$1-$2') // Add dash
            .slice(0, 15); // Limit length
    };

    const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskWhatsapp(e.target.value);
        setFormData({ ...formData, contact_whatsapp: masked });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getAllTerreiros();
            setTerreiros(data);
        } catch (e) {
            console.error(e);
            alert('Erro ao carregar terreiros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedTerreiro(null);
        setLogoFile(null);
        setPreviewUrl(null);
        setResponsibleData({ name: '', email: '' });
        setFormData({
            name: '',
            address: '',
            city: '',
            state: '',
            description: '',
            contact_email: '',
            contact_whatsapp: ''
        });
        setIsPanelOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!responsibleData.name || !responsibleData.email) {
                alert('Por favor, preencha os dados do responsável.');
                return;
            }

            await createTerreiroWithUser(
                formData,
                responsibleData,
                logoFile || undefined
            );

            alert("Terreiro criado com sucesso! O responsável receberá acesso.");
            loadData();
            handleClosePanel();
        } catch (error: any) {
            console.error('Error creating terreiro:', error);
            alert("Erro ao criar terreiro: " + (error.message || 'Erro desconhecido'));
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateTerreiroStatus(id, newStatus);
            if (selectedTerreiro?.id === id) {
                setSelectedTerreiro({ ...selectedTerreiro, verification_status: newStatus as any });
            }
            loadData();
            alert(`Terreiro ${newStatus === 'verified' ? 'aprovado' : 'rejeitado'} com sucesso!`);
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará permanentemente todos os dados deste terreiro.')) return;
        try {
            await deleteTerreiro(id);
            if (selectedTerreiro?.id === id) handleClosePanel();
            loadData();
            alert('Terreiro excluído.');
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir');
        }
    };

    const handleViewDetails = (terreiro: Terreiro) => {
        setIsCreating(false);
        setSelectedTerreiro(terreiro);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setSelectedTerreiro(null);
        setIsCreating(false);
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Gestão de Terreiros</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Validação e monitoramento das casas cadastradas</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_home_work</span>
                        Novo Terreiro
                    </button>
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
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Terreiro</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Localização</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {terreiros.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-14 rounded-2xl bg-gray-100 border-2 border-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                                                    {t.image ? (
                                                        <img src={t.image} className="w-full h-full object-cover" alt={t.name} />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-300 text-3xl">home_max</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-text-main text-base uppercase tracking-tight">{t.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: {t.id.split('-')[0]}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px] text-gray-300">location_on</span>
                                                {t.city} - {t.state}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${t.verification_status === 'verified' ? 'bg-success/10 text-success' :
                                                t.verification_status === 'rejected' ? 'bg-red-50 text-red-500' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                <span className={`size-1.5 rounded-full ${t.verification_status === 'verified' ? 'bg-success' :
                                                    t.verification_status === 'rejected' ? 'bg-red-500' :
                                                        'bg-amber-500'
                                                    }`} />
                                                {t.verification_status === 'verified' ? 'Verificado' :
                                                    t.verification_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(t)}
                                                    className="p-3 text-primary hover:bg-primary/10 rounded-2xl transition-all"
                                                    title="Ver Detalhes"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {terreiros.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                            Nenhum terreiro cadastrado.
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
                    title={isCreating ? "Novo Terreiro" : "Detalhes do Terreiro"}
                >
                    {isCreating ? (
                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center">
                                <div className="size-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <span className="material-symbols-outlined text-gray-300 text-4xl mb-1">add_photo_alternate</span>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Upload Logo</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h4 className="text-xs font-black text-primary uppercase tracking-widest text-center">Dados do Responsável</h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome do Responsável</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="Nome Completo"
                                        value={responsibleData.name}
                                        onChange={e => setResponsibleData({ ...responsibleData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email do Responsável (Login)</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="email@login.com"
                                        value={responsibleData.email}
                                        onChange={e => setResponsibleData({ ...responsibleData, email: e.target.value })}
                                    />
                                    <p className="text-[9px] text-gray-400 font-medium px-1">
                                        Uma senha provisória <code className="text-primary bg-primary/5 px-1 rounded">Mudar@123</code> será criada.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h4 className="text-xs font-black text-primary uppercase tracking-widest text-center">Dados do Terreiro</h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome do Terreiro</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="Ex: Ilê Axé..."
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cidade</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Cidade"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Estado</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="UF"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Endereço</label>
                                    <input
                                        type="text"
                                        className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="Rua, número, bairro"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email de Contato (Público)</label>
                                    <input
                                        type="email"
                                        className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="email@terreiro.com"
                                        value={formData.contact_email}
                                        onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="(00) 00000-0000"
                                        value={formData.contact_whatsapp}
                                        onChange={handleWhatsappChange}
                                        maxLength={15}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Descrição</label>
                                    <textarea
                                        className="w-full h-24 rounded-xl border-gray-200 focus:ring-primary focus:border-primary p-4 bg-gray-50 focus:bg-white transition-colors resize-none"
                                        placeholder="Breve descrição do terreiro..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <span className="material-symbols-outlined">save</span>
                                Salvar e Criar
                            </button>
                        </form>
                    ) : selectedTerreiro && (
                        <div className="space-y-8">
                            {/* Header Info */}
                            <div className="flex items-start gap-6 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                <div className="size-24 rounded-[24px] bg-white border-4 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                                    {selectedTerreiro.image ? (
                                        <img src={selectedTerreiro.image} className="w-full h-full object-cover" alt={selectedTerreiro.name} />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-200 text-5xl">home_max</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-text-main uppercase tracking-tight leading-tight">{selectedTerreiro.name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedTerreiro.verification_status === 'verified' ? 'bg-success text-white' :
                                            selectedTerreiro.verification_status === 'rejected' ? 'bg-red-500 text-white' :
                                                'bg-amber-500 text-white'
                                            }`}>
                                            {selectedTerreiro.verification_status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-6">
                                <section>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block px-2">Localização</label>
                                    <div className="p-5 bg-white border border-gray-100 rounded-3xl space-y-3 shadow-sm">
                                        <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                                            <span className="material-symbols-outlined text-gray-300">pin_drop</span>
                                            {selectedTerreiro.address || 'Endereço não informado'}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                                            <span className="material-symbols-outlined text-gray-300">location_city</span>
                                            {selectedTerreiro.city} - {selectedTerreiro.state}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block px-2">Contato</label>
                                    <div className="p-5 bg-white border border-gray-100 rounded-3xl space-y-3 shadow-sm">
                                        <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                                            <span className="material-symbols-outlined text-gray-300">mail</span>
                                            {selectedTerreiro.contact_email || 'E-mail não informado'}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                                            <span className="material-symbols-outlined text-gray-300">chat</span>
                                            {selectedTerreiro.contact_whatsapp || 'WhatsApp não informado'}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block px-2">Descrição</label>
                                    <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm text-sm text-gray-600 leading-relaxed font-medium">
                                        {selectedTerreiro.description || 'Nenhuma descrição fornecida.'}
                                    </div>
                                </section>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block px-2 text-center">Ações Administrativas</label>
                                {selectedTerreiro.verification_status === 'pending' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleStatusChange(selectedTerreiro.id, 'verified')}
                                            className="bg-success text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Aprovar
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(selectedTerreiro.id, 'rejected')}
                                            className="bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">cancel</span>
                                            Rejeitar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleStatusChange(selectedTerreiro.id, 'pending')}
                                        className="bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">restart_alt</span>
                                        Colocar em Revisão
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

export default TerreiroList;
