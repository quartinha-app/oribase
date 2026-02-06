import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getServiceCategories, getProfessionals, ServiceCategory } from '../../services/professional';
import { STATES } from '../../constants'; // Assuming we have a list of states

const ServiceSearch: React.FC = () => {
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedState, setSelectedState] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        handleSearch();
    }, [selectedCategory, selectedState]); // Auto-search on filter change

    const loadInitialData = async () => {
        try {
            const cats = await getServiceCategories();
            setCategories(cats);
            await handleSearch();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await getProfessionals({
                category_id: selectedCategory,
                state: selectedState,
                search: searchTerm
            });
            setProfessionals(data);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout navbarProps={{ variant: 'app', subtitle: 'Guia de Profissionais' }}>
            <div className="bg-primary/5 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="text-left">
                        <h1 className="text-3xl md:text-5xl font-black text-text-main uppercase tracking-tight mb-4">
                            Encontre Profissionais do Axé
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl">
                            Conecte-se com advogados, contadores, artesãos e prestadores de serviço da nossa comunidade.
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

                {/* Search Bar & Filters */}
                <div className="max-w-5xl mx-auto bg-white rounded-3xl p-4 shadow-xl shadow-gray-200/50 mb-12 border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                        <span className="material-symbols-outlined text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou serviço..."
                            className="bg-transparent border-none outline-none w-full text-text-main font-bold placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <select
                        className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 text-text-main font-bold outline-none cursor-pointer"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Todas as Categorias</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 text-text-main font-bold outline-none cursor-pointer"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                    >
                        <option value="">Todo o Brasil</option>
                        {STATES.map(state => (
                            <option key={state.value} value={state.value}>{state.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSearch}
                        className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        Buscar
                    </button>
                </div>

                {/* Results Grid */}
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : professionals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {professionals.map(pro => (
                                <div key={pro.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onClick={() => navigate(`/servicos/${pro.id}`)}>
                                    <div
                                        className={`h-32 relative bg-cover bg-center ${!pro.banner_url ? 'bg-gradient-to-br from-gray-100 to-gray-200' : ''}`}
                                        style={pro.banner_url ? { backgroundImage: `url(${pro.banner_url})` } : {}}
                                    >
                                        {pro.is_verified && (
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                <span className="material-symbols-outlined text-blue-500 text-sm">verified</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Verificado</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-6 pb-6 -mt-12 relative z-10">
                                        <div className="flex items-end justify-between mb-4">
                                            <div className="size-24 rounded-3xl bg-white border-4 border-white shadow-lg overflow-hidden">
                                                {pro.photo_url ? (
                                                    <img src={pro.photo_url} alt={pro.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                                        <span className="material-symbols-outlined text-4xl">person</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-primary/5 text-primary px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-2">
                                                {pro.category?.name}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-text-main mb-1 truncate">{pro.name}</h3>
                                        <div className="flex items-center gap-1 text-gray-400 text-xs font-bold mb-4 uppercase tracking-wide">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {pro.city}, {pro.state}
                                        </div>

                                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                                            {pro.bio || 'Sem descrição disponível.'}
                                        </p>

                                        <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
                                                <span className="font-bold text-text-main">{pro.rating_average || 0}</span>
                                                <span className="text-xs text-gray-400">({pro.rating_count})</span>
                                            </div>
                                            <span className="text-xs font-black text-primary uppercase tracking-widest group-hover:underline">Ver Perfil</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                            <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">engineering</span>
                            <h3 className="text-xl font-bold text-gray-400">Nenhum profissional encontrado</h3>
                            <p className="text-gray-400">Tente ajustar seus filtros de busca.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default ServiceSearch;
