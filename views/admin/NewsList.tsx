import React, { useEffect, useState } from 'react';
import { getNews, deleteNews, updateNews, createNews } from '../../services/news';
import { NewsItem } from '../../types';
import AdminLayout from '../../layouts/AdminLayout';
import SidePanel from '../../components/layout/SidePanel';
import ImageUpload from '../../components/forms/ImageUpload';
import { useForm } from 'react-hook-form';

const NewsList: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<NewsItem>>();

    const loadNews = async () => {
        try {
            setLoading(true);
            const data = await getNews(false);
            setNews(data);
        } catch (error) {
            console.error('Failed to load news', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNews();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;
        try {
            await deleteNews(id);
            loadNews();
            alert('Notícia excluída.');
        } catch (error) {
            console.error('Error deleting news', error);
            alert('Erro ao excluir notícia');
        }
    };

    const toggleActive = async (item: NewsItem) => {
        try {
            await updateNews(item.id, { active: !item.active });
            loadNews();
        } catch (error) {
            console.error('Error updating news', error);
        }
    };

    const onSubmit = async (data: Partial<NewsItem>) => {
        setSubmitting(true);
        try {
            if (data.id) {
                await updateNews(data.id, data);
                alert('Notícia atualizada!');
            } else {
                await createNews(data);
                alert('Notícia criada!');
            }
            handleClosePanel();
            loadNews();
        } catch (error) {
            console.error('Error saving news', error);
            alert('Erro ao salvar notícia');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: NewsItem) => {
        reset(item);
        setIsPanelOpen(true);
    };

    const handleNew = () => {
        reset({
            title: '',
            summary: '',
            content: '',
            image_url: '',
            active: true
        });
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        reset();
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Gerenciar Notícias</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Publique novidades e avisos para a comunidade</p>
                    </div>
                    <button
                        onClick={handleNew}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Nova Notícia
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-gray-50 rounded-[32px]" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Notícia</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Publicação</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {news.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="size-16 rounded-2xl bg-gray-100 border-2 border-white shadow-sm overflow-hidden shrink-0">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <span className="material-symbols-outlined text-3xl">image</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="max-w-md">
                                                    <div className="font-black text-text-main text-base uppercase tracking-tight line-clamp-1">{item.title}</div>
                                                    <div className="text-xs text-gray-400 font-medium line-clamp-1 mt-0.5">{item.summary}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                {new Date(item.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button
                                                onClick={() => toggleActive(item)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all ${item.active ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                    }`}
                                            >
                                                <span className={`size-1.5 rounded-full ${item.active ? 'bg-success' : 'bg-gray-300'}`} />
                                                {item.active ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-3 text-primary hover:bg-primary/10 rounded-2xl transition-all"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">edit_note</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {news.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                            Nenhuma notícia publicada.
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
                    title={watch('id') ? "Editar Notícia" : "Nova Notícia"}
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Título da Notícia</label>
                                <input
                                    {...register('title', { required: true })}
                                    className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main"
                                    placeholder="Ex: Novo projeto social inicia amanhã"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Resumo de Chamada</label>
                                <textarea
                                    {...register('summary', { required: true })}
                                    rows={3}
                                    className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main resize-none"
                                    placeholder="Uma breve descrição para atrair o leitor..."
                                />
                            </div>

                            <div className="pt-2">
                                <ImageUpload
                                    label="Imagem de Capa"
                                    value={watch('image_url')}
                                    onChange={(url) => setValue('image_url', url)}
                                    folder="news-covers"
                                    guideline="Resolução recomendada: 1200x630px ou 1600x900px (Proporção 16:9)"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Conteúdo Completo</label>
                                <textarea
                                    {...register('content', { required: true })}
                                    rows={10}
                                    className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main resize-y min-h-[200px]"
                                    placeholder="Desenvolva o texto da notícia aqui..."
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <input
                                    type="checkbox"
                                    {...register('active')}
                                    className="size-5 rounded border-gray-300 text-primary focus:ring-primary outline-none"
                                />
                                <span className="text-xs font-black uppercase text-text-main tracking-widest">Publicar Imediatamente</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary text-white py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                        >
                            {submitting ? 'Salvando...' : (watch('id') ? 'Atualizar Notícia' : 'Publicar Notícia')}
                        </button>
                    </form>
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

export default NewsList;
