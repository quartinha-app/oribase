import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LeaderLayout from '../../layouts/LeaderLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Terreiro, TerreiroType } from '../../types';
import ImageUpload from '../../components/forms/ImageUpload';

const LeaderDashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const [terreiro, setTerreiro] = useState<Terreiro | null>(null);
    const [types, setTypes] = useState<TerreiroType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Terreiro>>({
        name: '',
        address: '',
        city: '',
        state: '',
        description: '',
        contact_whatsapp: '',
        contact_email: '',
        type_id: '',
        slug: '',
        latitude: 0,
        longitude: 0,
        is_visible: false
    });

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchTerreiro(), fetchTypes()]);
        setLoading(false);
    };

    const fetchTypes = async () => {
        const { data } = await supabase.from('terreiro_types').select('*').eq('active', true).order('name');
        if (data) setTypes(data);
    };

    const fetchTerreiro = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('terreiros')
                .select('*')
                .eq('owner_id', user!.id)
                .single();

            if (!error && data) {
                setTerreiro(data as Terreiro);
                setFormData({
                    name: data.name || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    description: data.description || '',
                    contact_whatsapp: data.contact_whatsapp || '',
                    contact_email: data.contact_email || '',
                    type_id: data.type_id || '',
                    slug: data.slug || '',
                    latitude: data.latitude || 0,
                    longitude: data.longitude || 0,
                    is_visible: data.is_visible || false
                });
            }
        } catch (error) {
            console.error('Error fetching terreiro:', error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            if (terreiro) {
                // Update
                const { error } = await supabase
                    .from('terreiros')
                    .update(formData)
                    .eq('id', terreiro.id);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Informações atualizadas com sucesso!' });
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('terreiros')
                    .insert({
                        ...formData,
                        owner_id: user.id,
                        verification_status: 'pending'
                    })
                    .select()
                    .single();
                if (error) throw error;
                setTerreiro(data);
                setMessage({ type: 'success', text: 'Terreiro cadastrado! Agora solicite a verificação.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = async (url: string) => {
        if (!terreiro) return;
        try {
            const { error } = await supabase
                .from('terreiros')
                .update({ image: url })
                .eq('id', terreiro.id);
            if (error) throw error;
            setTerreiro({ ...terreiro, image: url });
            setMessage({ type: 'success', text: 'Imagem atualizada!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar imagem: ' + err.message });
        }
    };

    const handleGalleryChange = async (url: string) => {
        if (!terreiro) return;

        try {
            // Use functional update to avoid stale state issues with multiple uploads
            setTerreiro(prev => {
                if (!prev) return prev;
                const currentGallery = prev.gallery_urls || [];
                if (currentGallery.length >= 6) {
                    setMessage({ type: 'error', text: 'Limite de 6 fotos atingido. Algumas fotos podem não ter sido salvas.' });
                    return prev;
                }
                const newGallery = [...currentGallery, url];

                // Fire and forget DB update (or handle separately)
                // In a perfect world we'd wait, but for multi-upload this is more responsive
                supabase
                    .from('terreiros')
                    .update({ gallery_urls: newGallery })
                    .eq('id', prev.id)
                    .then(({ error }) => {
                        if (error) console.error('Erro ao salvar galeria:', error);
                    });

                return { ...prev, gallery_urls: newGallery };
            });

            setMessage({ type: 'success', text: 'Foto(s) sendo adicionada(s)...' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar galeria: ' + err.message });
        }
    };

    const removeGalleryImage = async (index: number) => {
        if (!terreiro) return;
        const newGallery = terreiro.gallery_urls?.filter((_, i) => i !== index) || [];
        try {
            const { error } = await supabase
                .from('terreiros')
                .update({ gallery_urls: newGallery })
                .eq('id', terreiro.id);
            if (error) throw error;
            setTerreiro({ ...terreiro, gallery_urls: newGallery });
            setMessage({ type: 'success', text: 'Foto removida da galeria.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao remover foto: ' + err.message });
        }
    };

    const statusColors = {
        pending: 'bg-amber-500 text-white',
        verified: 'bg-success text-white',
        rejected: 'bg-red-500 text-white'
    };

    const statusLabels = {
        pending: 'Em Análise',
        verified: 'Verificado',
        rejected: 'Rejeitado'
    };

    return (
        <LeaderLayout>
            <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Dados da Minha Casa</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Gerencie a presença digital do seu terreiro</p>
                    </div>
                    {terreiro && (
                        <div className="flex items-center gap-3">
                            <Link
                                to={terreiro.slug ? `/terreiro/${terreiro.slug}` : `/terreiro/${terreiro.id}`}
                                className="px-4 py-2 bg-white border border-gray-200 text-text-main rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm hover:border-primary hover:text-primary transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                Ver Meu Perfil
                            </Link>
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${statusColors[terreiro.verification_status] || 'bg-gray-100'}`}>
                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                Status: {statusLabels[terreiro.verification_status] || 'Não Cadastrado'}
                            </div>
                        </div>
                    )}
                </header>

                {message && (
                    <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                        <p className="font-bold text-sm tracking-tight">{message.text}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando dados...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar: Image and Summary */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col items-center">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest w-full text-center">Foto ou Logo</h3>
                                <ImageUpload
                                    value={terreiro?.image || ''}
                                    onChange={handleImageChange}
                                    folder="terreiros"
                                    label=""
                                />
                                {terreiro && (
                                    <div className="mt-8 pt-8 border-t border-gray-50 w-full">
                                        <div className="bg-background-light rounded-2xl p-4">
                                            <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-xs">info</span>
                                                Selo de Verificação
                                            </h4>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                {terreiro.verification_status === 'verified'
                                                    ? 'Sua casa possui o Selo Oficial OríBase. Seus dados estão visíveis no mapa nacional.'
                                                    : 'Solicite a verificação para ganhar o Selo Oficial e aparecer no mapa de terreiros nacional.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Content: Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <form onSubmit={handleSave} className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined">description</span>
                                        </div>
                                        <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Informações Básicas</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tipo de Terreiro</label>
                                            <select
                                                required
                                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                                value={formData.type_id}
                                                onChange={e => setFormData({ ...formData, type_id: e.target.value })}
                                            >
                                                <option value="">Selecione um tipo...</option>
                                                {types.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-[#9333ea]">Link Personalizado (Slug)</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-xs">oribase.com.br/</span>
                                                <input
                                                    type="text"
                                                    className="w-full h-12 rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 px-4 bg-purple-50/30 focus:bg-white transition-colors"
                                                    placeholder="meu-terreiro"
                                                    value={formData.slug}
                                                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-8 border-t border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined">gallery_thumbnail</span>
                                            </div>
                                            <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Galeria de Fotos</h3>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-gray-400">{(terreiro?.gallery_urls?.length || 0)}/6 Fotos</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {terreiro?.gallery_urls?.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100 shadow-sm">
                                                <img src={url} className="w-full h-full object-cover" alt={`Galeria ${i}`} />
                                                <button
                                                    onClick={() => removeGalleryImage(i)}
                                                    className="absolute top-2 right-2 size-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                        {(terreiro?.gallery_urls?.length || 0) < 6 && (
                                            <div className="aspect-square flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-100 transition-all group overflow-hidden p-4">
                                                <ImageUpload
                                                    value=""
                                                    onChange={handleGalleryChange}
                                                    folder="terreiros/gallery"
                                                    label=""
                                                    multiple={true}
                                                    compact={true}
                                                />
                                                <span className="text-[9px] font-black uppercase text-gray-400 text-center mt-2">Adicionar Fotos</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 pt-8 border-t border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined">location_on</span>
                                        </div>
                                        <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Localização</h3>
                                        <div className="ml-auto flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-gray-400">Visibilidade:</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, is_visible: !formData.is_visible })}
                                                className={`px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-1 ${formData.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">{formData.is_visible ? 'visibility' : 'visibility_off'}</span>
                                                {formData.is_visible ? 'Visível' : 'Oculto'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                                                Latitude
                                                <span className="material-symbols-outlined text-[10px] cursor-help" title="Clique com o botão direito no local no Google Maps para obter">help</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="-14.235"
                                                value={formData.latitude || ''}
                                                onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                                                Longitude
                                                <span className="material-symbols-outlined text-[10px] cursor-help" title="Clique com o botão direito no local no Google Maps para obter">help</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="-51.925"
                                                value={formData.longitude || ''}
                                                onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="flex items-end pb-1 text-[10px] font-medium text-gray-400 leading-tight italic">
                                            Preencha as coordenadas para aparecer no mapa nacional.
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cidade</label>
                                            <input
                                                type="text"
                                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Estado (UF)</label>
                                            <input
                                                type="text"
                                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                                value={formData.state}
                                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Endereço Completo</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Rua, número, bairro..."
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 pt-8 border-t border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined">contact_support</span>
                                        </div>
                                        <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Contato Público</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">WhatsApp</label>
                                            <input
                                                type="text"
                                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="(00) 00000-0000"
                                                value={formData.contact_whatsapp}
                                                onChange={e => setFormData({ ...formData, contact_whatsapp: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">E-mail de Contato</label>
                                            <input
                                                type="email"
                                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="email@terreiro.com"
                                                value={formData.contact_email}
                                                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">save</span>
                                    {saving ? 'Gravando...' : 'Salvar Alterações'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </LeaderLayout>
    );
};

export default LeaderDashboard;
