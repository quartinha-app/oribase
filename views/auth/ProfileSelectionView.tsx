
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../../types';

const profiles = [
  { id: 'lider_terreiro', title: 'Liderança', desc: 'Pai/Mãe de Santo, Dirigentes e responsáveis pela casa.', icon: 'workspace_premium' },
  { id: 'medium', title: 'Médium', desc: 'Filhos e Filhas de Casa, médiuns ativos e iniciados.', icon: 'volunteer_activism' },
  { id: 'consulente', title: 'Consulente', desc: 'Frequentadores e pessoas que buscam atendimento.', icon: 'diversity_3' },
  { id: 'fornecedor', title: 'Fornecedor', desc: 'Venda de artigos religiosos ou serviços de apoio.', icon: 'storefront' },
];

import MainLayout from '../../layouts/MainLayout';

const ProfileSelectionView: React.FC = () => {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  return (
    <MainLayout
      navbarProps={{
        variant: 'app',
        subtitle: 'Perfil'
      }}
    >
      <div className="flex-grow flex flex-col items-center justify-center py-6 ">
        <div className="w-full max-w-3xl text-center space-y-4 mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-main tracking-tight">Selecione seu Perfil para Iniciar</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Escolha a categoria que melhor descreve sua relação com o Terreiro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`flex items-start gap-5 p-6 rounded-2xl border-2 transition-all text-left bg-white
                ${selected === p.id ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent hover:border-accent hover:bg-accent/5'}`}
            >
              <div className={`p-3 rounded-xl ${selected === p.id ? 'bg-primary text-white' : 'bg-accent/10 text-accent'}`}>
                <span className="material-symbols-outlined text-[32px]">{p.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main mb-1">{p.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && navigate(`/survey/${selected}`)}
          disabled={!selected}
          className="mt-12 w-full max-w-md py-4 rounded-xl bg-primary text-white font-bold tracking-wide shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          Confirmar e Iniciar Pesquisa
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </MainLayout>
  );
};

export default ProfileSelectionView;
