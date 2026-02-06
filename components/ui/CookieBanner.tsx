import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="max-w-4xl mx-auto bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                    <span className="material-symbols-outlined text-4xl">cookie</span>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black text-text-main uppercase tracking-tight mb-2">Cookies & Privacidade</h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Utilizamos cookies para melhorar sua experiência e analisar o tráfego da plataforma, garantindo a segurança e proteção dos dados conforme a LGPD. Ao continuar, você concorda com nossos <Link to="/legal?type=terms" className="text-primary hover:underline font-bold">Termos de Uso</Link> e <Link to="/legal?type=privacy" className="text-primary hover:underline font-bold">Política de Privacidade</Link>.
                    </p>
                </div>

                <div className="flex shrink-0 gap-3">
                    <button
                        onClick={handleAccept}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        Aceitar e Continuar
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="bg-gray-50 text-gray-400 px-4 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all border border-gray-100"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
