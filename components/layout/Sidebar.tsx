import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IMAGES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        alert("Você saiu do sistema com sucesso.");
        navigate('/');
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r flex flex-col p-6 space-y-8
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-auto md:flex
      `}>
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="size-10 flex items-center justify-center">
                            <img src="/favicon_oribase.png" className="w-8 h-8 object-contain" alt="OríBase" />
                        </div>
                        <div>
                            <h2 className="font-black text-text-main leading-none uppercase tracking-tighter">Orí<span className="text-secondary italic">Base</span></h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{profile?.role === 'admin' ? 'Administração' : 'Painel da Casa'}</p>
                        </div>
                    </Link>
                    <button onClick={onClose} className="md:hidden text-gray-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
                    {profile?.role === 'admin' ? (
                        <>
                            <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Geral</p>
                            <Link to="/admin" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">dashboard</span>
                                <span className="text-sm font-bold">Visão Geral</span>
                            </Link>
                            <Link to="/admin/terreiro-types" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">category</span>
                                <span className="text-sm font-bold">Tipos de Terreiro</span>
                            </Link>
                            <Link to="/admin/campaigns" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">campaign</span>
                                <span className="text-sm font-bold">Campanhas</span>
                            </Link>
                            <Link to="/admin/news" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">newspaper</span>
                                <span className="text-sm font-bold">Notícias</span>
                            </Link>
                            <Link to="/admin/content" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">article</span>
                                <span className="text-sm font-bold">Conteúdo</span>
                            </Link>
                            <Link to="/admin/partners" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">handshake</span>
                                <span className="text-sm font-bold">Parceiros</span>
                            </Link>
                            <Link to="/admin/terreiros" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">map</span>
                                <span className="text-sm font-bold">Terreiros</span>
                            </Link>
                            <Link to="/admin/users" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">group</span>
                                <span className="text-sm font-bold">Usuários</span>
                            </Link>

                            <div className="h-px bg-gray-100 my-4 mx-3" />
                            <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Profissionais</p>
                            <Link to="/admin/professionals" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">work</span>
                                <span className="text-sm font-bold">Rede Profissional</span>
                            </Link>
                            <Link to="/admin/categories" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors">category</span>
                                <span className="text-sm font-bold">Categorias</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Minha Casa</p>
                            <Link to="/leader-dashboard" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-secondary transition-colors">home</span>
                                <span className="text-sm font-bold">Dados da Casa</span>
                            </Link>

                            <div className="h-px bg-gray-100 my-4 mx-3" />
                            <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rede e Pesquisas</p>
                            <Link to="/pesquisas" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-secondary transition-colors">campaign</span>
                                <span className="text-sm font-bold">Visualizar Pesquisas</span>
                            </Link>
                            <Link to="/servicos" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                                <span className="material-symbols-outlined group-hover:text-secondary transition-colors">work</span>
                                <span className="text-sm font-bold">Lista de Profissionais</span>
                            </Link>
                        </>
                    )}

                    <div className="h-px bg-gray-100 my-4 mx-3" />
                    <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Configurações</p>
                    <Link to="/ajustes" className="flex items-center gap-3 p-3 text-text-secondary hover:bg-gray-50 rounded-2xl transition-all group">
                        <span className="material-symbols-outlined group-hover:text-secondary transition-colors">settings</span>
                        <span className="text-sm font-bold">Meus Ajustes</span>
                    </Link>
                </nav>

                <div className="pt-6 border-t">
                    <div className="flex items-center gap-3">
                        <img
                            src={profile?.avatar_url || IMAGES.AVATAR_FEMALE}
                            className="size-10 rounded-full border object-cover"
                            alt="User"
                        />
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-text-main truncate">
                                {profile?.full_name || 'Usuário'}
                            </p>
                            <button
                                onClick={handleLogout}
                                className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
