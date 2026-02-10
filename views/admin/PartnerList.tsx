import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getPartners, createPartner, updatePartner, deletePartner } from '../../services/admin';
import { Partner } from '../../types';
import AdminLayout from '../../layouts/AdminLayout';
import ImageUpload from '../../components/forms/ImageUpload';
import SidePanel from '../../components/layout/SidePanel';

const PartnerList: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const partnerForm = useForm<Partner>({
        defaultValues: {
            active: true,
            type: 'institutional',
            logo_url: '',
            instagram: '',
            facebook: '',
            linkedin: '',
            whatsapp: ''
        }
    });

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await getPartners();
            setPartners(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const savePartner = async (data: Partner) => {
        try {
            const partnerData = { ...data };
            if (!partnerData.id) delete partnerData.id;

            // Remove empty social media fields to avoid constraint issues
            if (!partnerData.instagram || partnerData.instagram.trim() === '') delete partnerData.instagram;
            if (!partnerData.facebook || partnerData.facebook.trim() === '') delete partnerData.facebook;
            if (!partnerData.linkedin || partnerData.linkedin.trim() === '') delete partnerData.linkedin;
            if (!partnerData.whatsapp || partnerData.whatsapp.trim() === '') delete partnerData.whatsapp;

            if (partnerData.id) {
                await updatePartner(partnerData.id, partnerData);
                alert('Parceiro atualizado!');
            } else {
                await createPartner(partnerData);
                alert('Parceiro criado!');
            }
            handleClosePanel();
            loadPartners();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar parceiro. Verifique se todos os campos estão preenchidos.');
        }
    };

    const handleEditPartner = (partner: Partner) => {
        partnerForm.reset(partner);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        partnerForm.reset({ active: true, type: 'institutional', logo_url: '', instagram: '', facebook: '', linkedin: '', whatsapp: '' });
    };

    const handleDeletePartner = async (id: string) => {
        if (!confirm('Excluir parceiro?')) return;
        try {
            await deletePartner(id);
            loadPartners();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Parceiros Institucionais</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Gerencie os apoiadores exibidos na plataforma</p>
                    </div>
                    <button
                        onClick={() => setIsPanelOpen(true)}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Novo Parceiro
                    </button>
                </div>

                <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Logo</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Tipo</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Descrição</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        Carregando parceiros...
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {partners.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="size-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden p-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    {p.logo_url ? (
                                                        <img src={p.logo_url} className="w-full h-full object-contain" alt={p.name} />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-300 text-3xl">image</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-text-main text-sm uppercase tracking-tight">{p.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold truncate max-w-[200px]">{p.url || 'Sem URL'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                                    {p.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {p.active ? (
                                                    <span className="text-success flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Ativo
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                        <span className="w-2 h-2 rounded-full bg-gray-300"></span> Inativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] text-gray-400 font-bold line-clamp-2 max-w-[300px]">
                                                    {p.description || 'Sem descrição'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditPartner(p)}
                                                        className="p-3 text-primary hover:bg-primary/10 rounded-2xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePartner(p.id)}
                                                        className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {partners.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                                Nenhum parceiro cadastrado.
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                <SidePanel
                    isOpen={isPanelOpen}
                    onClose={handleClosePanel}
                    title={partnerForm.watch('id') ? "Editar Parceiro" : "Novo Parceiro"}
                >
                    <form onSubmit={partnerForm.handleSubmit(savePartner)} className="space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Nome do Parceiro</label>
                                <input
                                    {...partnerForm.register('name', { required: true })}
                                    className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                    placeholder="Ex: AXE Tech"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Tipo</label>
                                    <select
                                        {...partnerForm.register('type', { required: true })}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main appearance-none"
                                    >
                                        <option value="institutional">Institucional</option>
                                        <option value="partner">Parceiro</option>
                                        <option value="supporter">Apoiador</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <div className="flex items-center gap-3 p-5 bg-gray-50/50 rounded-[20px] border border-gray-100 h-[64px]">
                                        <input type="checkbox" {...partnerForm.register('active')} className="size-5 rounded-lg border-gray-300 text-primary focus:ring-primary outline-none" />
                                        <span className="text-[10px] font-black uppercase text-text-main tracking-widest leading-none">Ativo</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">URL do Website</label>
                                <input
                                    {...partnerForm.register('url')}
                                    className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Descrição / Sobre</label>
                                <textarea
                                    {...partnerForm.register('description')}
                                    rows={4}
                                    className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                    placeholder="Fale um pouco sobre este parceiro..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div className="md:col-span-2">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Redes Sociais</h4>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Instagram</label>
                                    <input
                                        {...partnerForm.register('instagram')}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                        placeholder="URL do Instagram"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Facebook</label>
                                    <input
                                        {...partnerForm.register('facebook')}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                        placeholder="URL do Facebook"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">LinkedIn</label>
                                    <input
                                        {...partnerForm.register('linkedin')}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                        placeholder="URL do LinkedIn"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">WhatsApp</label>
                                    <input
                                        {...partnerForm.register('whatsapp')}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                        placeholder="Link do WhatsApp"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <ImageUpload
                                    label="Logo do Parceiro"
                                    value={partnerForm.watch('logo_url')}
                                    onChange={(url) => partnerForm.setValue('logo_url', url)}
                                    folder="partner-logos"
                                    guideline="Resolução recomendada: 400x400px (Proporção 1:1 - Fundo Transparente)"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-5 rounded-[25px] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            {partnerForm.watch('id') ? "Salvar Alterações" : "Criar Parceiro"}
                        </button>
                    </form>
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

export default PartnerList;
