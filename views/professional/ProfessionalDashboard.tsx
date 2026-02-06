import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getProfessionalByUserId, getProfessionalMetrics, Professional, ServiceCategory } from '../../services/professional';

const ProfessionalDashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [professional, setProfessional] = useState<(Professional & { category: ServiceCategory }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            checkProfile();
        }
    }, [user]);

    const checkProfile = async () => {
        try {
            if (!user) return;
            const data = await getProfessionalByUserId(user.id);
            setProfessional(data);

            if (data) {
                const metricsData = await getProfessionalMetrics(data.id);
                setMetrics(metricsData || []);
            }
        } catch (error) {
            console.error('Error fetching professional profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout variant="app">
                <div className="flex justify-center p-20">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </MainLayout>
        );
    }

    if (!professional) {
        return (
            <MainLayout variant="app" subtitle="Área do Profissional">
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <div className="inline-flex size-24 rounded-full bg-primary/10 text-primary items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl">work</span>
                    </div>
                    <h1 className="text-3xl font-black text-text-main mb-4">Divulgue seus serviços para a comunidade!</h1>
                    <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">
                        Cadastre-se na Rede de Profissionais do Axé e seja encontrado por ilês e irmãos de todo o Brasil.
                    </p>
                    <Link to="/cadastro-profissional">
                        <button className="px-8 py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all hover:-translate-y-1">
                            Criar meu Perfil Profissional
                        </button>
                    </Link>
                </div>
            </MainLayout>
        );
    }

    // Calculate metrics
    const views = metrics.filter(m => m.interaction_type === 'profile_view').length;
    const whatsappClicks = metrics.filter(m => m.interaction_type === 'whatsapp').length;
    const totalContacts = metrics.filter(m => ['whatsapp', 'email', 'instagram'].includes(m.interaction_type)).length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'expired': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'pending': return 'Pendente (Aguardando Pagamento/Aprovação)';
            case 'expired': return 'Expirado';
            case 'suspended': return 'Suspenso';
            default: return status;
        }
    };

    return (
        <MainLayout variant="app" subtitle="Painel do Profissional">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black text-text-main">Axé, {professional.name.split(' ')[0]}!</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${getStatusColor(professional.subscription_status)}`}>
                                {getStatusLabel(professional.subscription_status)}
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium">Gerencie seu perfil e acompanhe seus resultados.</p>
                    </div>


                    <div className="flex gap-4">
                        <Link to={`/servicos/${professional.id}`} target="_blank">
                            <button className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                Ver Perfil Público
                            </button>
                        </Link>
                        <Link to="/assinatura">
                            <button className="px-4 py-2 border border-amber-200 text-amber-600 rounded-lg font-bold text-sm hover:bg-amber-50 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">card_membership</span>
                                Minha Assinatura
                            </button>
                        </Link>
                        <Link to="/meus-servicos">
                            <button className="px-4 py-2 bg-text-main text-white rounded-lg font-bold text-sm hover:bg-black transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">design_services</span>
                                Meus Serviços
                            </button>
                        </Link>
                        <Link to="/cadastro-profissional">
                            <button className="px-4 py-2 bg-text-main text-white rounded-lg font-bold text-sm hover:bg-black transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Editar Perfil
                            </button>
                        </Link>
                        <button
                            onClick={async () => {
                                try {
                                    await signOut();
                                    navigate('/');
                                } catch (error) {
                                    console.error('Logout error:', error);
                                }
                            }}
                            className="px-4 py-2 border border-red-200 text-red-500 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Sair
                        </button>
                    </div>
                </div>

                {professional.subscription_status === 'pending' && (
                    <div className="mb-12 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                        <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-amber-900 text-lg mb-1">Assinatura Pendente</h3>
                            <p className="text-amber-700/80 text-sm">
                                Para aparecer na busca, realize o pagamento da sua assinatura.
                                Envie o comprovante para o suporte ou aguarde a ativação manual.
                            </p>
                        </div>
                        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap">
                            Realizar Pagamento
                        </button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                            <span className="material-symbols-outlined">visibility</span>
                            <span className="text-xs font-black uppercase tracking-widest">Visualizações do Perfil</span>
                        </div>
                        <div className="text-4xl font-black text-text-main">{views}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 text-green-500 mb-2">
                            <span className="material-symbols-outlined">chat</span>
                            <span className="text-xs font-black uppercase tracking-widest">Cliques no WhatsApp</span>
                        </div>
                        <div className="text-4xl font-black text-text-main">{whatsappClicks}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 text-blue-500 mb-2">
                            <span className="material-symbols-outlined">ads_click</span>
                            <span className="text-xs font-black uppercase tracking-widest">Contatos Totais</span>
                        </div>
                        <div className="text-4xl font-black text-text-main">{totalContacts}</div>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="bg-gradient-to-r from-primary/5 to-transparent p-8 rounded-[32px] border border-primary/10">
                    <h3 className="font-black text-text-main text-lg mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                        Dica para conseguir mais clientes
                    </h3>
                    <p className="text-text-secondary leading-relaxed max-w-2xl">
                        Mantenha seu perfil sempre atualizado. Adicione uma foto de rosto clara e simpática,
                        e descreva seus serviços com detalhes. Perfis com descrição completa recebem
                        até 3x mais contatos.
                    </p>
                </div>
            </div>
        </MainLayout>
    );
};

export default ProfessionalDashboard;
