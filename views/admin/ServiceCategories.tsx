
import React, { useEffect, useState } from 'react';
import { getAdminServiceCategories, createServiceCategory, updateServiceCategory, deleteServiceCategory } from '../../services/admin';
import { ServiceCategory } from '../../types';
import AdminLayout from '../../layouts/AdminLayout';
import SidePanel from '../../components/layout/SidePanel';

const ServiceCategories: React.FC = () => {
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [slug, setSlug] = useState('');
    const [active, setActive] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getAdminServiceCategories();
            setCategories(data);
        } catch (e) {
            console.error(e);
            alert('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedCategory(null);
        setName('');
        setIcon('');
        setSlug('');
        setActive(true);
        setIsPanelOpen(true);
    };

    const handleEdit = (category: ServiceCategory) => {
        setIsCreating(false);
        setSelectedCategory(category);
        setName(category.name);
        setIcon(category.icon || '');
        setSlug(category.slug);
        setActive(category.active);
        setIsPanelOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { name, icon, slug, active };

            if (isCreating) {
                await createServiceCategory(payload);
                alert('Categoria criada com sucesso!');
            } else if (selectedCategory) {
                await updateServiceCategory(selectedCategory.id, payload);
                alert('Categoria atualizada com sucesso!');
            }

            setIsPanelOpen(false);
            loadData();
        } catch (e: any) {
            console.error(e);
            alert('Erro ao salvar: ' + e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso pode afetar profissionais vinculados.')) return;
        try {
            await deleteServiceCategory(id);
            loadData();
            alert('Categoria excluída.');
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir');
        }
    };

    // Auto-generate slug from name
    useEffect(() => {
        if (isCreating && name) {
            setSlug(name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-"));
        }
    }, [name, isCreating]);

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <div className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Categorias de Serviço</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Gerencie as especialidades disponíveis</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nova Categoria
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-50 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest w-20">Ícone</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Slug</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {categories.map(cat => (
                                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined">{cat.icon || 'category'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 font-bold text-text-main">{cat.name}</td>
                                        <td className="px-8 py-4 text-sm text-gray-500 font-mono bg-gray-50 rounded px-2 w-fit">{cat.slug}</td>
                                        <td className="px-8 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {cat.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <SidePanel
                    isOpen={isPanelOpen}
                    onClose={() => setIsPanelOpen(false)}
                    title={isCreating ? "Nova Categoria" : "Editar Categoria"}
                >
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome da Categoria</label>
                            <input
                                type="text"
                                required
                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                placeholder="Ex: Jogo de Búzios"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Slug (URL)</label>
                            <input
                                type="text"
                                required
                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors font-mono text-sm"
                                placeholder="jogo-de-buzios"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ícone (Material Symbols)</label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    className="flex-1 h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50 focus:bg-white transition-colors"
                                    placeholder="visibility"
                                    value={icon}
                                    onChange={e => setIcon(e.target.value)}
                                />
                                <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-gray-600">{icon || 'help'}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400">
                                Consulte em <a href="https://fonts.google.com/icons" target="_blank" className="text-primary hover:underline">Google Fonts Icons</a>
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <div
                                onClick={() => setActive(!active)}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${active ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <div className={`size-4 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-bold text-gray-600">Categoria Ativa</span>
                        </div>

                        <button
                            type="submit"
                            className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8"
                        >
                            <span className="material-symbols-outlined">save</span>
                            Salvar Categoria
                        </button>
                    </form>
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

export default ServiceCategories;
