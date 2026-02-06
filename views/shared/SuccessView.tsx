
import React from 'react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../../constants';

import MainLayout from '../../layouts/MainLayout';

const SuccessView: React.FC = () => {
  return (
    <MainLayout
      navbarProps={{
        variant: 'app',
        subtitle: 'Sucesso'
      }}
    >
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-12 animate-in fade-in duration-1000">
        <div className="space-y-4">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-text-main leading-tight">
            Obrigado por fortalecer o nosso legado!
          </h1>
          <p className="text-lg text-text-secondary max-w-lg mx-auto">
            Sua participação no Censo Nacional do Axé 2026 foi registrada com sucesso.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-white p-4 shadow-2xl flex items-center justify-center ring-1 ring-accent/10">
            <img src={IMAGES.SELO} alt="Selo Oficial" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 text-white text-xs font-bold rounded uppercase shadow-lg">Certificado</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
          <button className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-xl h-14 px-8 flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">download</span>
            <span className="font-bold">Baixar Selo Oficial</span>
          </button>
          <Link to="/" className="flex-1 bg-white border border-gray-200 text-text-main rounded-xl h-14 px-8 flex items-center justify-center gap-2 transition-all hover:bg-gray-50">
            <span className="font-bold">Voltar para a Home</span>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default SuccessView;
