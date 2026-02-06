import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Terreiro, TerreiroType } from '../../types';
import MainLayout from '../../layouts/MainLayout';
import { Link } from 'react-router-dom';

const TerreiroListView: React.FC = () => {
    const [terreiros, setTerreiros] = useState<Terreiro[]>([]);
    const [types, setTypes] = useState<TerreiroType[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterState, setFilterState] = useState('');

    useEffect(() => {
        fetchData();
    }, [filterType, filterState]);

    const fetchData = async () => {
        setLoading(true);
        let query = supabase
            .from('terreiros')
            .select('*, type:terreiro_types(*)')
            .eq('verification_status', 'verified')
            .eq('is_visible', true);

        if (filterType) query = query.eq('type_id', filterType);
        if (filterState) query = query.eq('state', filterState);

        const [tRes, typesRes] = await Promise.all([
            query.order('name'),
            supabase.from('terreiro_types').select('*').eq('active', true).order('name')
        ]);

        if (tRes.data) setTerreiros(tRes.data as Terreiro[]);
        if (typesRes.data) setTypes(typesRes.data);
        setLoading(false);
    };

    const filteredTerreiros = terreiros.filter(t =>
        t.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        t.city?.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
        <MainLayout navbarProps={{ variant: 'app', subtitle: 'Guia de Terreiros' }}>
            <div className="bg-background-light min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <header className="mb-12 space-y-8">
                        <div>
                            <h1 className="text-4xl font-black text-text-main uppercase tracking-tight mb-2">Encontre uma Casa de Axé</h1>
                            <p className="text-text-secondary font-medium">Explore comunidades tradicionais de matriz africana em todo o Brasil.</p>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-primary/5 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Nome ou cidade..."
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-primary focus:border-primary transition-all text-sm font-bold"
                                    value={filterSearch}
                                    onChange={e => setFilterSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-primary focus:border-primary transition-all text-sm font-bold"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                            >
                                <option value="">Todos os Tipos</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <select
                                className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-primary focus:border-primary transition-all text-sm font-bold"
                                value={filterState}
                                onChange={e => setFilterState(e.target.value)}
                            >
                                <option value="">Todos os Estados</option>
                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                            <Link to="/map" className="h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
                                <span className="material-symbols-outlined">map</span> Ver no Mapa
                            </Link>
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                    ) : filteredTerreiros.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                            <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">search_off</span>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum terreiro encontrado com esses filtros</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredTerreiros.map(t => (
                                <Link
                                    key={t.id}
                                    to={t.slug ? `/terreiro/${t.slug}` : `/map`}
                                    className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
                                >
                                    <div className="relative aspect-[16/10]">
                                        <img src={t.image || 'https://via.placeholder.com/600x400?text=Terreiro'} className="w-full h-full object-cover" alt={t.name} />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-text-main text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                                                {t.type?.name || 'Terreiro'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <h3 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{t.name}</h3>
                                        <div className="flex items-center gap-2 text-text-secondary font-bold text-xs uppercase tracking-widest">
                                            <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                                            {t.city} • {t.state}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default TerreiroListView;
