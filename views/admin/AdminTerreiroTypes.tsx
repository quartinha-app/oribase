import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../services/supabase';
import { TerreiroType } from '../../types';

const AdminTerreiroTypes: React.FC = () => {
    const [types, setTypes] = useState<TerreiroType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<Partial<TerreiroType> | null>(null);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('terreiro_types')
            .select('*')
            .order('name');

        if (error) console.error(error);
        if (data) setTypes(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingType?.name || !editingType?.slug) return;

        try {
            if (editingType.id) {
                await supabase.from('terreiro_types').update(editingType).eq('id', editingType.id);
            } else {
                await supabase.from('terreiro_types').insert(editingType);
            }
            setIsModalOpen(false);
            fetchTypes();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AdminLayout>
            <header className="h-16 border-b bg-white flex items-center justify-between px-8">
                <h1 className="text-xl font-bold text-text-main">Tipos de Terreiro</h1>
                <button
                    onClick={() => { setEditingType({ name: '', slug: '', active: true }); setIsModalOpen(true); }}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span> Novo Tipo
                </button>
            </header>

            <div className="p-8">
                {loading ? (
                    <div className="flex justify-center p-20"><div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 text-xs font-black uppercase text-gray-400">Nome</th>
                                    <th className="p-4 text-xs font-black uppercase text-gray-400">Slug</th>
                                    <th className="p-4 text-xs font-black uppercase text-gray-400">Status</th>
                                    <th className="p-4 text-xs font-black uppercase text-gray-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {types.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-text-main">{t.name}</td>
                                        <td className="p-4 text-sm text-gray-500">{t.slug}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${t.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {t.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => { setEditingType(t); setIsModalOpen(true); }}
                                                className="text-primary hover:bg-primary/5 p-2 rounded-lg"
                                            >
                                                <span className="material-symbols-outlined text-xl">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-black text-text-main mb-6 uppercase tracking-tight">
                            {editingType?.id ? 'Editar Tipo' : 'Novo Tipo'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Nome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50"
                                    value={editingType?.name || ''}
                                    onChange={e => setEditingType({ ...editingType!, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Slug</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-4 bg-gray-50"
                                    value={editingType?.slug || ''}
                                    onChange={e => setEditingType({ ...editingType!, slug: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={editingType?.active}
                                    onChange={e => setEditingType({ ...editingType!, active: e.target.checked })}
                                />
                                <label htmlFor="active" className="text-sm font-bold text-text-main">Ativo</label>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminTerreiroTypes;
