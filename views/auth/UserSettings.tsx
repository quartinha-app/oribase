import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../../services/admin';
import { supabase } from '../../services/supabase';
import AdminLayout from '../../layouts/AdminLayout';
import LeaderLayout from '../../layouts/LeaderLayout';
import MainLayout from '../../layouts/MainLayout';
import ImageUpload from '../../components/forms/ImageUpload';

const UserSettings: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [jobRole, setJobRole] = useState(profile?.job_role || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [email, setEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setJobRole(profile.job_role || '');
            setBio(profile.bio || '');
        }
        if (user) setEmail(user.email || '');
    }, [profile, user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(user.id, {
                full_name: fullName,
                job_role: jobRole,
                bio: bio
            });
            await refreshProfile();
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const updates: any = {};
            if (email !== user?.email) updates.email = email;
            if (newPassword) updates.password = newPassword;

            if (Object.keys(updates).length === 0) {
                setMessage({ type: 'error', text: 'Nenhuma alteração detectada para credenciais.' });
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.updateUser(updates);
            if (error) throw error;

            setMessage({ type: 'success', text: 'Credenciais atualizadas! Se mudou o e-mail, verifique sua caixa de entrada.' });
            setNewPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar credenciais: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (url: string) => {
        if (!user) return;
        try {
            await updateProfile(user.id, { avatar_url: url });
            await refreshProfile();
            setMessage({ type: 'success', text: 'Avatar atualizado!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar avatar: ' + err.message });
        }
    };

    const Layout = profile?.role === 'admin' ? AdminLayout : (profile?.role === 'lider_terreiro' ? LeaderLayout : MainLayout);

    return (
        <Layout>
            <div className="max-w-4xl mx-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">Meus Ajustes</h1>
                    <p className="text-gray-500">Gerencie suas informações pessoais e credenciais de acesso.</p>
                </header>

                {message && (
                    <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span className="material-symbols-outlined">
                            {message.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <p className="font-bold text-sm">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Avatar */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Foto de Perfil</h3>
                            <ImageUpload
                                value={profile?.avatar_url || ''}
                                onChange={handleAvatarChange}
                                folder="avatars"
                                label=""
                            />
                        </div>
                    </div>

                    {/* Main Forms */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Profile Info */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <h3 className="text-xl font-black text-text-main uppercase">Dados Pessoais</h3>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm"
                                        placeholder="Seu nome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Cargo / Função (Público)</label>
                                    <input
                                        type="text"
                                        value={jobRole}
                                        onChange={e => setJobRole(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm"
                                        placeholder="Ex: Zelador de Santo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Mini Bio (Público)</label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        rows={4}
                                        className="w-full border-gray-200 rounded-2xl p-4 text-sm"
                                        placeholder="Breve descrição sobre sua atuação..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    Salvar Alterações
                                </button>
                            </form>
                        </div>

                        {/* Auth Credentials */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <h3 className="text-xl font-black text-text-main uppercase">Segurança</h3>
                            </div>

                            <form onSubmit={handleUpdateCredentials} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">E-mail</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm"
                                        placeholder="Deixe em branco para não alterar"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    Atualizar Credenciais
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default UserSettings;
