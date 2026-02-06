import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSiteContent } from '../../services/admin';
import MainLayout from '../../layouts/MainLayout';

const LegalView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'terms';
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const data = await getSiteContent('legal');
                const item = data.find(i => i.key === type);
                setContent(item?.content || 'Documento não encontrado.');
            } catch (err) {
                console.error(err);
                setContent('Erro ao carregar documento.');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [type]);

    const title = type === 'terms' ? 'Termos de Uso' : 'Política de Privacidade';

    return (
        <MainLayout>
            <div className="min-h-screen bg-white">
                <header className="py-20 bg-gray-50 border-b border-gray-100">
                    <div className="max-w-4xl mx-auto px-6">
                        <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tight uppercase mb-4">
                            {title}
                        </h1>
                        <p className="text-gray-500 font-medium">Última atualização: {new Date().toLocaleDateString()}</p>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-16">
                    {loading ? (
                        <div className="flex flex-col gap-4 animate-pulse">
                            <div className="h-6 bg-gray-100 rounded w-full"></div>
                            <div className="h-6 bg-gray-100 rounded w-5/6"></div>
                            <div className="h-6 bg-gray-100 rounded w-4/6"></div>
                            <div className="h-6 bg-gray-100 rounded w-full"></div>
                        </div>
                    ) : (
                        <div className="prose prose-lg prose-red max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {content}
                        </div>
                    )}
                </main>

                <footer className="py-12 border-t border-gray-100 mb-10">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <button
                            onClick={() => window.history.back()}
                            className="text-primary font-bold hover:underline"
                        >
                            Voltar
                        </button>
                        <div className="mt-8 text-xs text-gray-400 font-bold uppercase tracking-widest">
                            OríBase &copy; {new Date().getFullYear()}
                        </div>
                    </div>
                </footer>
            </div>
        </MainLayout>
    );
};

export default LegalView;
