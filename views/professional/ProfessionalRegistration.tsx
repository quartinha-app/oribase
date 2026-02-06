import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { createProfessionalProfile, updateProfessionalProfile, getProfessionalByUserId, getServiceCategories, ServiceCategory, Professional } from '../../services/professional';
import { STATES } from '../../constants';
import ImageUpload from '../../components/forms/ImageUpload';

interface FormData {
    name: string;
    category_id: string;
    bio: string;
    photo_url: string;
    banner_url: string;
    city: string;
    state: string;
    neighborhood: string;
    whatsapp: string;
    email: string;
    instagram: string;
    site_url: string;
}

const ProfessionalRegistration: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [bannerUrl, setBannerUrl] = useState<string>('');

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();

    // Check for existing profile (Edit Mode)
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const [cats, profile] = await Promise.all([
                    getServiceCategories(),
                    getProfessionalByUserId(user.id)
                ]);
                setCategories(cats);

                if (profile) {
                    setExistingProfileId(profile.id);
                    setValue('name', profile.name);
                    setValue('category_id', profile.category_id);
                    setValue('bio', profile.bio || '');
                    setValue('photo_url', profile.photo_url || '');
                    setValue('city', profile.city);
                    setValue('state', profile.state);
                    setValue('neighborhood', profile.neighborhood || '');
                    setValue('whatsapp', profile.whatsapp);
                    setValue('email', profile.email);
                    setValue('instagram', profile.instagram || '');
                    setValue('site_url', profile.site_url || '');

                    if (profile.photo_url) setPhotoUrl(profile.photo_url);
                    if (profile.banner_url) setBannerUrl(profile.banner_url);
                } else {
                    // Pre-fill email from auth if new
                    setValue('email', user.email || '');
                    setValue('name', user.user_metadata?.full_name || '');
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, setValue]);

    const onSubmit = async (data: FormData) => {
        if (!user) return;
        setLoading(true);
        try {
            const profileData = {
                user_id: user.id,
                name: data.name,
                category_id: data.category_id,
                bio: data.bio || null,
                photo_url: data.photo_url || null,
                banner_url: data.banner_url || null,
                city: data.city,
                state: data.state,
                neighborhood: data.neighborhood || null,
                whatsapp: data.whatsapp,
                email: data.email,
                instagram: data.instagram || null,
                site_url: data.site_url || null,
                subscription_expires_at: null // Handled by backend/admin
            };

            if (existingProfileId) {
                await updateProfessionalProfile(existingProfileId, profileData);
            } else {
                await createProfessionalProfile(profileData);
            }

            navigate('/area-profissional');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            const errorMessage = error?.message || error?.error_description || 'Erro desconhecido';
            alert(`Erro ao salvar perfil: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout variant="app" subtitle={existingProfileId ? "Editar Perfil" : "Cadastro Profissional"}>
            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-text-main mb-2">
                        {existingProfileId ? "Editar dados do Profissional" : "Quero ser um Profissional"}
                    </h1>
                    <p className="text-text-secondary">Preencha seus dados com atenção. Eles serão exibidos publicamente para a comunidade.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm border-b pb-2 mb-4">Dados Básicos</h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo / Nome do Negócio</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                placeholder="Ex: Advogada Maria Silva, Buffet Axé..."
                            />
                            {errors.name && <span className="text-red-500 text-xs font-bold">Campo obrigatório</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria de Serviço</label>
                            <select
                                {...register('category_id', { required: true })}
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-gray-700"
                            >
                                <option value="">Selecione...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <span className="text-red-500 text-xs font-bold">Selecione uma categoria</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Biografia / Descrição</label>
                            <textarea
                                {...register('bio', { required: true })}
                                className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium resize-none"
                                placeholder="Conte um pouco sobre sua experiência e serviços..."
                            />
                            {errors.bio && <span className="text-red-500 text-xs font-bold">Campo obrigatório</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Fotos do Perfil</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ImageUpload
                                    label="Foto de Perfil"
                                    value={photoUrl}
                                    bucket="professional-assets"
                                    folder="photos"
                                    onChange={(url) => {
                                        setPhotoUrl(url);
                                        setValue('photo_url', url);
                                    }}
                                    guideline="Recomendado: Quadrada (1:1), min. 500x500px"
                                />
                                <ImageUpload
                                    label="Banner do Perfil"
                                    value={bannerUrl}
                                    bucket="professional-assets"
                                    folder="banners"
                                    onChange={(url) => {
                                        setBannerUrl(url);
                                        setValue('banner_url', url);
                                    }}
                                    guideline="Recomendado: Retangular (3:1), min. 1200x400px"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm border-b pb-2 mb-4">Localização</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                                <select
                                    {...register('state', { required: true })}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-gray-700"
                                >
                                    <option value="">UF</option>
                                    {STATES.map(st => (
                                        <option key={st.value} value={st.value}>{st.label}</option>
                                    ))}
                                </select>
                                {errors.state && <span className="text-red-500 text-xs font-bold">Obrigatório</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label>
                                <input
                                    {...register('city', { required: true })}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                />
                                {errors.city && <span className="text-red-500 text-xs font-bold">Obrigatório</span>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bairro (Opcional)</label>
                            <input
                                {...register('neighborhood')}
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                            />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm border-b pb-2 mb-4">Contato</h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp (Com DDD)</label>
                            <input
                                {...register('whatsapp', { required: true })}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, "");
                                    if (value.length > 11) value = value.slice(0, 11);

                                    if (value.length > 10) {
                                        value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                                    } else if (value.length > 6) {
                                        value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
                                    } else if (value.length > 2) {
                                        value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
                                    }

                                    setValue('whatsapp', value);
                                }}
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                            />
                            {errors.whatsapp && <span className="text-red-500 text-xs font-bold">Obrigatório</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Profissional</label>
                            <input
                                {...register('email', { required: true })}
                                type="email"
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                            />
                            {errors.email && <span className="text-red-500 text-xs font-bold">Obrigatório</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instagram (@usuario)</label>
                                <input
                                    {...register('instagram')}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                    placeholder="@..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Site (Opcional)</label>
                                <input
                                    {...register('site_url')}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-14 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-dark hover:-translate-y-1'}`}
                        >
                            {loading ? (
                                <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">save</span>
                                    Salvar Perfil
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </MainLayout>
    );
};

export default ProfessionalRegistration;
