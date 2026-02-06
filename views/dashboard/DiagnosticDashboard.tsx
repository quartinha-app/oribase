
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { IMAGES } from '../../constants';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const dataRadar = [
  { subject: 'Planejamento', A: 50, fullMark: 100 },
  { subject: 'Fluxo de Caixa', A: 30, fullMark: 100 },
  { subject: 'Sustentabilidade', A: 60, fullMark: 100 },
  { subject: 'Legalização', A: 40, fullMark: 100 },
  { subject: 'Gestão', A: 45, fullMark: 100 },
  { subject: 'Patrimônio', A: 55, fullMark: 100 },
  { subject: 'Transparência', A: 35, fullMark: 100 },
];

const dataBar = [
  { name: 'Pequeno Porte', value: 32 },
  { name: 'Médio Porte', value: 58 },
  { name: 'Grande Porte', value: 74 },
];

import MainLayout from '../../layouts/MainLayout';
import { useEffect } from 'react';

const DiagnosticDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Safety redirection for specialized roles
  useEffect(() => {
    if (!loading && user && profile) {
      const role = profile.role;
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'lider_terreiro') navigate('/leader-dashboard', { replace: true });
      else if (role === 'fornecedor') navigate('/area-profissional', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const navbarLinks = [
    { label: 'Mapa de Terreiros', to: '/map' },
    { label: 'Metodologia', href: '#' },
    { label: 'Relatórios', href: '#' },
  ];

  const actionButtons = (
    <>
      <button className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold">
        <span className="material-symbols-outlined text-[20px]">download</span>
        Relatório PDF
      </button>
      {user ? (
        <button
          onClick={() => {
            const role = profile?.role;
            if (role === 'admin') navigate('/admin');
            else if (role === 'lider_terreiro') navigate('/leader-dashboard');
            else if (role === 'fornecedor') navigate('/area-profissional');
            else navigate('/dashboard');
          }}
          className="bg-primary px-4 py-2 text-sm font-bold text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Meu Painel
        </button>
      ) : (
        <Link to="/login" className="bg-primary px-4 py-2 text-sm font-bold text-white rounded-lg hover:bg-primary-dark transition-colors">
          Acessar Conta
        </Link>
      )}
    </>
  );

  return (
    <MainLayout
      navbarProps={{
        variant: 'app',
        subtitle: 'Painel de Resultados',
        links: navbarLinks,
        actionButtons: actionButtons
      }}
    >

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent border border-accent/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Dados Atualizados: Jan 2025
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-main">Diagnóstico Financeiro</h2>
          <p className="text-lg text-gray-500 max-w-2xl">
            Análise detalhada da maturidade de gestão de 340 terreiros mapeados em território nacional.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Média Nacional', val: '45', sub: '+5% vs 2024', color: 'text-green-600', bg: 'bg-primary/5', icon: 'analytics' },
          { label: 'Respondentes', val: '1,250', sub: 'Líderes religiosos', color: 'text-gray-500', bg: 'bg-accent/5', icon: 'groups' },
          { label: 'Abrangência', val: '18', sub: 'Estados brasileiros', color: 'text-gray-500', bg: 'bg-blue-500/5', icon: 'location_on' },
          { label: 'Principal Desafio', val: 'Fiscal', sub: '68% citaram regularização', color: 'text-white', bg: 'bg-primary', icon: 'warning' },
        ].map((kpi, idx) => (
          <div key={idx} className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gray-100 ${idx === 3 ? kpi.bg + ' text-white' : 'bg-white'}`}>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className={`flex items-center gap-2 mb-2 ${idx === 3 ? 'text-white/80' : 'text-gray-500'}`}>
                <span className="material-symbols-outlined text-[20px]">{kpi.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{kpi.label}</span>
              </div>
              <div>
                <div className="text-4xl font-extrabold tracking-tight">{kpi.val}{idx === 0 && <span className="text-2xl opacity-50">/100</span>}</div>
                <p className={`mt-2 text-sm font-medium ${idx === 3 ? 'text-white/90' : kpi.color}`}>{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-text-main mb-6">Dimensões de Maturidade</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataRadar}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" stroke="#374151" fontSize={12} tick={{ fontWeight: 600 }} />
                <Radar
                  name="Atual"
                  dataKey="A"
                  stroke="#d95c26"
                  strokeWidth={2}
                  fill="#d95c26"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-text-main mb-4">Resultados por Porte</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataBar} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={80} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {dataBar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#d95c26' : index === 1 ? '#D4B483' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Insights Rápidos</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3"><span className="material-symbols-outlined text-green-600 text-sm">check_circle</span> Terreiros com CNPJ pontuam 2.5x mais.</li>
                <li className="flex gap-3"><span className="material-symbols-outlined text-accent text-sm">lightbulb</span> Planejamento é o maior potencial.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-text-main p-6 text-white bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <h3 className="text-lg font-bold">Faça o Diagnóstico</h3>
            <p className="text-sm text-gray-300 mt-1 mb-6">Descubra o nível de maturidade do seu terreiro.</p>
            <Link to="/select-profile" className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent text-white font-bold py-2.5 hover:bg-opacity-90">
              Começar Agora
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DiagnosticDashboard;
