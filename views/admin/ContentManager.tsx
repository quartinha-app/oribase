import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getSiteContent, updateSiteContent, getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../../services/admin';
import { FAQ, SiteContent } from '../../types';
import AdminLayout from '../../layouts/AdminLayout';
import SidePanel from '../../components/layout/SidePanel';
import ImageUpload from '../../components/forms/ImageUpload';

const ContentManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'about' | 'contact' | 'social' | 'faq' | 'legal'>('about');
    const [loading, setLoading] = useState(false);

    // Forms
    const aboutForm = useForm<{ title: string; content: string; image_url: string }>();
    const contactForm = useForm<{ email: string; phone: string }>();
    const socialForm = useForm<{ instagram: string; facebook: string; linkedin: string; youtube: string; whatsapp: string }>();
    const legalForm = useForm<{ terms: string; privacy: string }>();

    // FAQ State
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [selectedFaq, setSelectedFaq] = useState<Partial<FAQ> | null>(null);
    const [isFaqPanelOpen, setIsFaqPanelOpen] = useState(false);

    useEffect(() => {
        loadContent();
    }, [activeTab]);

    const loadContent = async () => {
        setLoading(true);
        try {
            if (activeTab === 'about') {
                const data = await getSiteContent('about');
                const title = data.find(i => i.key === 'title');
                const content = data.find(i => i.key === 'content');
                const imageUrl = data.find(i => i.key === 'image_url');
                if (title) aboutForm.setValue('title', title.content || '');
                if (content) aboutForm.setValue('content', content.content || '');
                if (imageUrl) aboutForm.setValue('image_url', imageUrl.content || '');
            } else if (activeTab === 'contact') {
                const data = await getSiteContent('contact');
                const email = data.find(i => i.key === 'email');
                const phone = data.find(i => i.key === 'phone');
                if (email) contactForm.setValue('email', email.content || '');
                if (phone) contactForm.setValue('phone', phone.content || '');
            } else if (activeTab === 'social') {
                const data = await getSiteContent('social');
                const instagram = data.find(i => i.key === 'instagram');
                const facebook = data.find(i => i.key === 'facebook');
                const linkedin = data.find(i => i.key === 'linkedin');
                const youtube = data.find(i => i.key === 'youtube');
                const whatsapp = data.find(i => i.key === 'whatsapp');
                socialForm.setValue('instagram', instagram?.content || '');
                socialForm.setValue('facebook', facebook?.content || '');
                socialForm.setValue('linkedin', linkedin?.content || '');
                socialForm.setValue('youtube', youtube?.content || '');
                socialForm.setValue('whatsapp', whatsapp?.content || '');
            } else if (activeTab === 'faq') {
                const data = await getFAQs();
                setFaqs(data);
            } else if (activeTab === 'legal') {
                const data = await getSiteContent('legal');
                const terms = data.find(i => i.key === 'terms');
                const privacy = data.find(i => i.key === 'privacy');
                if (terms) legalForm.setValue('terms', terms.content || '');
                if (privacy) legalForm.setValue('privacy', privacy.content || '');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const saveAbout = async (data: any) => {
        try {
            await updateSiteContent('about', 'title', { content: data.title });
            await updateSiteContent('about', 'content', { content: data.content });
            await updateSiteContent('about', 'image_url', { content: data.image_url });
            alert('Conteúdo "Sobre" atualizado!');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar');
        }
    };

    const saveContact = async (data: any) => {
        try {
            await updateSiteContent('contact', 'email', { content: data.email });
            await updateSiteContent('contact', 'phone', { content: data.phone });
            alert('Contato atualizado!');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar');
        }
    };

    const saveLegal = async (data: any) => {
        try {
            await updateSiteContent('legal', 'terms', { content: data.terms });
            await updateSiteContent('legal', 'privacy', { content: data.privacy });
            alert('Documentos legais atualizados!');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar documentos legais');
        }
    };

    const saveSocial = async (data: any) => {
        try {
            await updateSiteContent('social', 'instagram', { content: data.instagram });
            await updateSiteContent('social', 'facebook', { content: data.facebook });
            await updateSiteContent('social', 'linkedin', { content: data.linkedin });
            await updateSiteContent('social', 'youtube', { content: data.youtube });
            await updateSiteContent('social', 'whatsapp', { content: data.whatsapp });
            alert('Redes sociais atualizadas!');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar redes sociais');
        }
    };

    const handleSaveFAQ = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedFaq?.id) {
                await updateFAQ(selectedFaq.id, selectedFaq);
            } else {
                await createFAQ(selectedFaq!);
            }
            alert('FAQ salva!');
            setIsFaqPanelOpen(false);
            loadContent();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar FAQ');
        }
    };

    const handleDeleteFAQ = async (id: string) => {
        if (!confirm('Excluir esta pergunta?')) return;
        try {
            await deleteFAQ(id);
            loadContent();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">Gerenciar Conteúdo</h1>
                    <p className="text-gray-500 font-medium">Ajuste textos institucionais e documentos legais da plataforma.</p>
                </header>

                <div className="flex gap-4 mb-8 border-b border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {[
                        { id: 'about', label: 'Sobre' },
                        { id: 'contact', label: 'Contato' },
                        { id: 'social', label: 'Redes Sociais' },
                        { id: 'faq', label: 'FAQ / Regras' },
                        { id: 'legal', label: 'Jurídico' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-text-main'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center gap-3 text-gray-400 font-bold uppercase tracking-widest text-xs p-10">
                        <div className="size-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                        Carregando conteúdo...
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm max-w-5xl">
                        {activeTab === 'about' && (
                            <form onSubmit={aboutForm.handleSubmit(saveAbout)} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Título da Seção</label>
                                        <input
                                            {...aboutForm.register('title')}
                                            className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                            placeholder="Título do 'Sobre Nós'"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Conteúdo</label>
                                        <textarea
                                            {...aboutForm.register('content')}
                                            rows={8}
                                            className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                            placeholder="Descreva a história e missão..."
                                        />
                                    </div>
                                    <div>
                                        <ImageUpload
                                            label="Imagem Institucional"
                                            value={aboutForm.watch('image_url')}
                                            onChange={(url) => aboutForm.setValue('image_url', url)}
                                            folder="site-content"
                                            guideline="Resolução recomendada: 1200x800px (Proporção 3:2)"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                                    Salvar Alterações
                                </button>
                            </form>
                        )}

                        {activeTab === 'contact' && (
                            <form onSubmit={contactForm.handleSubmit(saveContact)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">E-mail de Suporte</label>
                                        <input
                                            {...contactForm.register('email')}
                                            className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                            placeholder="contato@exemplo.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Telefone / WhatsApp</label>
                                        <input
                                            {...contactForm.register('phone')}
                                            className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                                    Salvar Contatos
                                </button>
                            </form>
                        )}

                        {activeTab === 'social' && (
                            <form onSubmit={socialForm.handleSubmit(saveSocial)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Instagram (URL)</label>
                                        <input {...socialForm.register('instagram')} className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main" placeholder="https://instagram.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Facebook (URL)</label>
                                        <input {...socialForm.register('facebook')} className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main" placeholder="https://facebook.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">LinkedIn (URL)</label>
                                        <input {...socialForm.register('linkedin')} className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main" placeholder="https://linkedin.com/in/..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">YouTube (URL)</label>
                                        <input {...socialForm.register('youtube')} className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main" placeholder="https://youtube.com/..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">WhatsApp (Link Direto)</label>
                                        <input {...socialForm.register('whatsapp')} className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] focus:ring-4 ring-primary/5 outline-none transition-all font-bold text-text-main" placeholder="https://wa.me/..." />
                                    </div>
                                </div>
                                <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                                    Salvar Redes Sociais
                                </button>
                            </form>
                        )}

                        {activeTab === 'faq' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-gray-50/50 p-6 rounded-[30px] border border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Gerenciar FAQ / Regras</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Defina as regras de patrocínio e dúvidas comuns</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedFaq({ question: '', answer: '', category: 'supporter_rules', active: true, order_index: faqs.length });
                                            setIsFaqPanelOpen(true);
                                        }}
                                        className="bg-primary/5 text-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        Nova Pergunta
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {faqs.map(faq => (
                                        <div key={faq.id} className="p-6 bg-white rounded-3xl border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${faq.active ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'}`}>
                                                        {faq.active ? 'Ativa' : 'Inativa'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{faq.order_index} - {faq.category}</span>
                                                </div>
                                                <h4 className="font-bold text-text-main">{faq.question}</h4>
                                                <p className="text-gray-400 text-sm line-clamp-1 mt-1">{faq.answer}</p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedFaq(faq); setIsFaqPanelOpen(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-xl"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                                <button onClick={() => handleDeleteFAQ(faq.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                            </div>
                                        </div>
                                    ))}
                                    {faqs.length === 0 && (
                                        <div className="p-20 text-center border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300 font-black uppercase tracking-widest text-xs">
                                            Nenhuma pergunta cadastrada.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'legal' && (
                            <form onSubmit={legalForm.handleSubmit(saveLegal)} className="space-y-8">
                                <div className="grid grid-cols-1 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Termos de Uso</label>
                                        <textarea
                                            {...legalForm.register('terms')}
                                            rows={12}
                                            className="w-full border-gray-100 bg-gray-50/50 p-6 rounded-[25px] focus:ring-4 ring-primary/5 outline-none transition-all font-mono text-sm leading-relaxed"
                                            placeholder="Digite aqui os termos de uso..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Política de Privacidade</label>
                                        <textarea
                                            {...legalForm.register('privacy')}
                                            rows={12}
                                            className="w-full border-gray-100 bg-gray-50/50 p-6 rounded-[25px] focus:ring-4 ring-primary/5 outline-none transition-all font-mono text-sm leading-relaxed"
                                            placeholder="Digite aqui a política de privacidade..."
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                                    Salvar Documentos
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <SidePanel
                    isOpen={isFaqPanelOpen}
                    onClose={() => setIsFaqPanelOpen(false)}
                    title={selectedFaq?.id ? "Editar Pergunta" : "Nova Pergunta"}
                >
                    <form onSubmit={handleSaveFAQ} className="space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Pergunta</label>
                                <input
                                    required
                                    value={selectedFaq?.question || ''}
                                    onChange={e => setSelectedFaq(prev => ({ ...prev, question: e.target.value }))}
                                    className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] font-bold text-text-main"
                                    placeholder="Ex: Como ser um patrocinador?"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Resposta</label>
                                <textarea
                                    required
                                    rows={8}
                                    value={selectedFaq?.answer || ''}
                                    onChange={e => setSelectedFaq(prev => ({ ...prev, answer: e.target.value }))}
                                    className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] font-bold text-text-main"
                                    placeholder="Explique os detalhes e regras..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Categoria</label>
                                    <select
                                        value={selectedFaq?.category || 'general'}
                                        onChange={e => setSelectedFaq(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] font-bold text-text-main appearance-none"
                                    >
                                        <option value="general">Geral</option>
                                        <option value="supporter_rules">Regras de Apoio</option>
                                        <option value="sponsorship">Patrocínio</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Ordem (0-99)</label>
                                    <input
                                        type="number"
                                        value={selectedFaq?.order_index || 0}
                                        onChange={e => setSelectedFaq(prev => ({ ...prev, order_index: parseInt(e.target.value) }))}
                                        className="w-full border-gray-100 bg-gray-50/50 p-5 rounded-[20px] font-bold text-text-main"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-5 bg-gray-50/50 rounded-[20px] border border-gray-100 h-[64px]">
                                <input
                                    type="checkbox"
                                    checked={selectedFaq?.active}
                                    onChange={e => setSelectedFaq(prev => ({ ...prev, active: e.target.checked }))}
                                    className="size-5 rounded-lg border-gray-300 text-primary focus:ring-primary outline-none"
                                />
                                <span className="text-[10px] font-black uppercase text-text-main tracking-widest leading-none">Ativa e Visível</span>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-primary text-white py-5 rounded-[25px] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                            Salvar Pergunta
                        </button>
                    </form>
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

export default ContentManager;
