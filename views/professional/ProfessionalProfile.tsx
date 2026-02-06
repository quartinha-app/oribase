import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { getProfessionalById, registerInteraction, Professional, ServiceCategory } from '../../services/professional';
import { getProfessionalServices } from '../../services/professional';
import { ProfessionalService, Review } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getFingerprint } from '../../services/fingerprint';
import { getProfessionalReviews } from '../../services/reviews';
import ReviewList from '../../components/reviews/ReviewList';
import ReviewForm from '../../components/reviews/ReviewForm';

const ProfessionalProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [professional, setProfessional] = useState<Professional & { category: ServiceCategory } | null>(null);
    const [services, setServices] = useState<ProfessionalService[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [revealedContacts, setRevealedContacts] = useState<{ whatsapp: boolean; email: boolean }>({ whatsapp: false, email: false });

    useEffect(() => {
        if (id) {
            loadProfessional(id);
        }
    }, [id]);

    const loadProfessional = async (profId: string) => {
        try {
            const [data, srvs, revs] = await Promise.all([
                getProfessionalById(profId),
                getProfessionalServices(profId),
                getProfessionalReviews(profId)
            ]);
            setProfessional(data);
            setServices(srvs || []);
            setReviews(revs || []);

            // Log profile view
            const fp = await getFingerprint();
            if (data.user_id !== user?.id) { // Don't log own views
                registerInteraction(profId, 'profile_view', fp);
            }
        } catch (error) {
            console.error('Error loading professional:', error);
            navigate('/servicos');
        } finally {
            setLoading(false);
        }
    };

    const handleReveal = async (type: 'whatsapp' | 'email') => {
        if (!professional) return;

        setRevealedContacts(prev => ({ ...prev, [type]: true }));

        const fp = await getFingerprint();
        registerInteraction(professional.id, type as any, fp);

        if (type === 'whatsapp') {
            const message = `Olá ${professional.name}, vi seu perfil na OríBase e gostaria de solicitar um orçamento.`;
            const url = `https://wa.me/${professional.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
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

    if (!professional) return null;

    return (
        <MainLayout variant="app" subtitle={professional.category?.name}>
            <div className="bg-gray-50/50 min-h-screen pb-20">
                {/* Header / Cover */}
                <div
                    className={`h-64 relative bg-cover bg-center ${!professional.banner_url ? 'bg-gradient-to-r from-primary/10 to-primary/5' : ''}`}
                    style={professional.banner_url ? { backgroundImage: `url(${professional.banner_url})` } : {}}
                >
                    {professional.banner_url && (
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F9FAFB] via-[#F9FAFB]/60 to-transparent" />
                    )}
                    <div className="absolute -bottom-16 left-0 right-0 px-6">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end gap-6">
                            <div className="size-32 md:size-40 bg-white rounded-[32px] p-1 shadow-xl shadow-gray-200/50 border-4 border-white relative z-10 shrink-0">
                                {professional.photo_url ? (
                                    <img src={professional.photo_url} className="w-full h-full object-cover rounded-[28px]" alt={professional.name} />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 rounded-[28px] flex items-center justify-center text-gray-300">
                                        <span className="material-symbols-outlined text-6xl">person</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 mb-4 relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-primary text-white border border-primary/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">{professional.category?.name}</span>
                                    {professional.is_verified && (
                                        <div className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                                            <span className="material-symbols-outlined text-sm">verified</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Verificado</span>
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-text-main drop-shadow-sm">{professional.name}</h1>
                                <div className="flex items-center gap-2 font-bold text-sm mt-1 text-gray-600">
                                    <span className="material-symbols-outlined text-lg">location_on</span>
                                    {professional.city}, {professional.state}
                                    {professional.neighborhood && <span> • {professional.neighborhood}</span>}
                                </div>
                            </div>
                            <div className="mb-4 flex gap-3 relative z-10">
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-amber-500">
                                        <span className="font-black text-2xl drop-shadow-sm">{professional.rating_average || '0.0'}</span>
                                        <span className="material-symbols-outlined text-2xl">star</span>
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{professional.rating_count} avaliações</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-black text-text-main uppercase tracking-tight mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">description</span>
                                Sobre o Profissional
                            </h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {professional.bio || "Este profissional ainda não adicionou uma biografia."}
                            </p>
                        </section>

                        {services.length > 0 && (
                            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                                <h2 className="text-lg font-black text-text-main uppercase tracking-tight mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">design_services</span>
                                    Serviços Principais
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {services.map(service => (
                                        <div key={service.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-primary/20 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900">{service.title}</h3>
                                                {service.price && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">R$ {service.price}</span>}
                                            </div>
                                            {service.description && (
                                                <p className="text-xs text-gray-500 mb-2 line-clamp-3 leading-relaxed">{service.description}</p>
                                            )}
                                            {service.duration && (
                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    {service.duration}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-black text-text-main uppercase tracking-tight mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">reviews</span>
                                Avaliações ({professional.rating_count})
                            </h2>

                            {user && !showReviewForm && (
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="mb-6 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">rate_review</span>
                                    Avaliar Profissional
                                </button>
                            )}

                            {showReviewForm && (
                                <ReviewForm
                                    professionalId={professional.id}
                                    onSuccess={() => {
                                        setShowReviewForm(false);
                                        loadProfessional(professional.id);
                                    }}
                                />
                            )}

                            <ReviewList reviews={reviews} />
                        </section>
                    </div>

                    {/* Right Column: Contact CTA */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-primary/5 sticky top-24">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Entre em Contato</h3>

                            <div className="space-y-4">
                                <button
                                    onClick={() => handleReveal('whatsapp')}
                                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#25D366]/20 active:scale-95"
                                >
                                    <span className="material-symbols-outlined">chat</span>
                                    {revealedContacts.whatsapp ? professional.whatsapp : 'WhatsApp'}
                                </button>

                                {revealedContacts.whatsapp && (
                                    <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                                        Número revelado e redirecionando...
                                    </div>
                                )}

                                {professional.email && (
                                    <button
                                        onClick={() => handleReveal('email')}
                                        className="w-full bg-white border-2 border-gray-100 hover:bg-gray-50 text-text-main py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-gray-400">mail</span>
                                        {revealedContacts.email ? professional.email : 'Ver Email'}
                                    </button>
                                )}

                                {professional.instagram && (
                                    <a
                                        href={`https://instagram.com/${professional.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-pink-500/20 hover:opacity-90 active:scale-95"
                                        onClick={() => registerInteraction(professional.id, 'instagram' as any, 'temp')}
                                    >
                                        <span className="material-symbols-outlined">photo_camera</span>
                                        Instagram
                                    </a>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400">
                                    Ao contactar, diga que viu na <strong className="text-primary">OríBase</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ProfessionalProfile;
