import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../services/supabase';
import { Terreiro, AdminDashboardStats } from '../../types';
import { getAdminDashboardStats } from '../../services/admin';

const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'blue';
  loading?: boolean;
}> = ({ title, value, subtitle, icon, color, loading }) => {
  const colors = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`size-12 rounded-2xl flex items-center justify-center border ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {loading && <div className="size-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />}
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">{title}</h4>
        <div className="text-3xl font-black text-text-main tracking-tight uppercase">
          {loading ? '...' : value}
        </div>
        {subtitle && !loading && (
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [pendingTerreiros, setPendingTerreiros] = useState<Terreiro[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, pendingData] = await Promise.all([
        getAdminDashboardStats(),
        supabase
          .from('terreiros')
          .select('*, profiles(full_name)')
          .eq('verification_status', 'pending')
      ]);

      if (statsData) setStats(statsData);
      if (pendingData.data) setPendingTerreiros(pendingData.data as any);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyTerreiro = async (id: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('terreiros')
      .update({ verification_status: status, is_visible: status === 'verified' })
      .eq('id', id);

    if (!error) {
      alert(`Terreiro ${status === 'verified' ? 'aprovado' : 'rejeitado'}!`);
      loadData();
    } else {
      console.error(error);
      alert('Erro ao atualizar status.');
    }
  };

  return (
    <AdminLayout>
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-4">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">grid_view</span>
          </div>
          <h1 className="text-xl font-black text-text-main uppercase tracking-tight">Visão Geral</h1>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
      </header>

      <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-text-main uppercase tracking-tight mb-2">Bem-vindo, Administrador</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Painel de controle e monitoramento da plataforma.</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Atualizar Dados
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Terreiros Mapeados"
            value={stats?.terreiros.total || 0}
            subtitle={`${stats?.terreiros.verified || 0} Casas Verificadas`}
            icon="temple_buddhist"
            color="primary"
            loading={loading && !stats}
          />
          <StatsCard
            title="Rede de Profissionais"
            value={stats?.professionals.total || 0}
            subtitle={`${stats?.professionals.active || 0} Fornecedores Ativos`}
            icon="work"
            color="secondary"
            loading={loading && !stats}
          />
          <StatsCard
            title="Diagnóstico Axé"
            value={stats?.diagnostic.totalResponses || 0}
            subtitle={`${stats?.diagnostic.activeCampaigns || 0} Pesquisas Ativas`}
            icon="analytics"
            color="accent"
            loading={loading && !stats}
          />
          <StatsCard
            title="Total de Usuários"
            value={stats?.users.total || 0}
            subtitle={`${stats?.users.byRole.lider_terreiro || 0} Líderes de Axé`}
            icon="group"
            color="blue"
            loading={loading && !stats}
          />
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main List: Verification Queue */}
          <div className="lg:col-span-2 space-y-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Fila de Verificação</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações pendentes de terreiros</p>
              </div>
              <div className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                {pendingTerreiros.length} Pendentes
              </div>
            </div>

            {loading && !pendingTerreiros.length ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-3xl animate-pulse" />)}
              </div>
            ) : pendingTerreiros.length === 0 ? (
              <div className="p-10 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-200 mb-4">check_circle</span>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Tudo limpo! Não há terreiros pendentes.</p>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Terreiro</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest hidden md:table-cell">Responsável</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingTerreiros.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-black text-text-main text-sm uppercase mb-0.5">{t.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.city}/{t.state}</div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-gray-500 hidden md:table-cell">
                          {(t as any).profiles?.full_name || 'N/A'}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => verifyTerreiro(t.id, 'verified')}
                              className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-100 border border-green-100 transition-all"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => verifyTerreiro(t.id, 'rejected')}
                              className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 border border-red-100 transition-all"
                            >
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Access Sidebar / Extra Stats */}
          <div className="space-y-6 text-left">
            <div>
              <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Composição da Rede</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Segmentação de perfis</p>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              {[
                { label: 'Líderes de Terreiro', value: stats?.users.byRole.lider_terreiro || 0, color: 'bg-primary' },
                { label: 'Médiuns / Filhos', value: stats?.users.byRole.medium || 0, color: 'bg-secondary' },
                { label: 'Fornecedores', value: stats?.users.byRole.fornecedor || 0, color: 'bg-accent' },
                { label: 'Consulentes / Outros', value: stats?.users.byRole.consulente || 0, color: 'bg-blue-500' },
              ].map(item => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-text-main">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${stats?.users.total ? (item.value / stats.users.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
