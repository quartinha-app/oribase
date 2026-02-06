import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Terreiro } from '../../types';
import MainLayout from '../../layouts/MainLayout';

const TerreiroProfileView: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [terreiro, setTerreiro] = useState<Terreiro | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) fetchTerreiro();
    }, [slug]);

    const fetchTerreiro = async () => {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug!);

        const query = supabase
            .from('terreiros')
            .select('*, type:terreiro_types(*)');

        if (isUUID) {
            query.or(`id.eq.${slug},slug.eq.${slug}`);
        } else {
            query.eq('slug', slug);
        }

        const { data } = await query.single();

        if (data) setTerreiro(data as Terreiro);
        setLoading(false);
    };

    if (loading) return <div className="flex justify-center p-40"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
    if (!terreiro) return <div className="p-20 text-center">Terreiro não encontrado.</div>;

    return (
        <MainLayout navbarProps={{ variant: 'app', subtitle: terreiro.name }}>
            <div className="max-w-6xl mx-auto px-4 py-12">
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        <div className="w-full md:w-1/3 aspect-square rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
                            <img src={terreiro.image || 'https://via.placeholder.com/600x600?text=Logo'} className="w-full h-full object-cover" alt={terreiro.name} />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full">
                                        {terreiro.type?.name || 'Comunidade Tradicional'}
                                    </span>
                                    {terreiro.verification_status === 'verified' && (
                                        <span className="flex items-center gap-1 text-success text-xs font-black uppercase tracking-widest">
                                            <span className="material-symbols-outlined text-[18px]">verified</span> Selo Oficial
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-5xl font-black text-text-main uppercase tracking-tight leading-none mb-4">{terreiro.name}</h1>
                                <p className="text-xl text-text-secondary font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">location_on</span>
                                    {terreiro.city} - {terreiro.state}
                                </p>
                            </div>

                            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
                                {terreiro.description || 'Esta casa ainda não adicionou uma descrição.'}
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                {terreiro.contact_whatsapp && (
                                    <a href={`https://wa.me/${terreiro.contact_whatsapp}`} target="_blank" className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-600/20">
                                        <span className="material-symbols-outlined">chat</span> Contato WhatsApp
                                    </a>
                                )}
                                {terreiro.contact_email && (
                                    <a href={`mailto:${terreiro.contact_email}`} className="bg-white border-2 border-gray-100 text-text-main px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-primary/20 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined">mail</span> Enviar E-mail
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {terreiro.gallery_urls && terreiro.gallery_urls.length > 0 && (
                    <section className="space-y-8 pt-12 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined">gallery_thumbnail</span>
                            </div>
                            <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">Galeria da Casa</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {terreiro.gallery_urls.map((url, i) => (
                                <div key={i} className="aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                                    <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={`${terreiro.name} galeria ${i}`} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </MainLayout>
    );
};

export default TerreiroProfileView;
