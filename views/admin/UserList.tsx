import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, registerUserByAdmin, updateProfile } from '../../services/admin';
import { Profile, UserRole } from '../../types';
import AdminLayout from '../../layouts/AdminLayout';
import SidePanel from '../../components/layout/SidePanel';

const UserList: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'admin' as UserRole,
        jobRole: '',
        bio: '',
        showOnLanding: false
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            // Filter to show only "Staff" roles
            const staffRoles: UserRole[] = ['admin', 'pesquisador'];
            setUsers(data.filter(u => staffRoles.includes(u.role)));
        } catch (e) {
            console.error(e);
            alert('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRoleChange = async (id: string, newRole: UserRole) => {
        try {
            await updateProfile(id, { role: newRole });
            loadData();
            alert('Permissão atualizada!');
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar permissão');
        }
    };

    const handleToggleShowOnLanding = async (id: string, currentStatus: boolean) => {
        try {
            await updateProfile(id, { show_on_landing: !currentStatus });
            loadData();
            alert('Status de visualização atualizado!');
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar status');
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUser) {
                await updateProfile(editingUser.id, {
                    full_name: formData.fullName,
                    role: formData.role,
                    job_role: formData.jobRole,
                    bio: formData.bio,
                    show_on_landing: formData.showOnLanding
                });
                alert('Usuário atualizado!');
            } else {
                await registerUserByAdmin(
                    formData.email,
                    formData.password,
                    formData.fullName,
                    formData.role
                );
                alert('Usuário cadastrado com sucesso!');
            }
            handleClosePanel();
            loadData();
        } catch (e: any) {
            console.error(e);
            alert('Erro ao salvar usuário: ' + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditUser = (user: Profile) => {
        setEditingUser(user);
        setFormData({
            email: '', // Email usually not editable via this simple profile update
            password: '',
            fullName: user.full_name || '',
            role: user.role,
            jobRole: user.job_role || '',
            bio: user.bio || '',
            showOnLanding: !!user.show_on_landing
        });
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setEditingUser(null);
        setFormData({ email: '', password: '', fullName: '', role: 'admin', jobRole: '', bio: '', showOnLanding: false });
    };

    const roles: UserRole[] = ['admin', 'pesquisador'];

    return (
        <AdminLayout>
            <div className="p-6 lg:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-text-main uppercase tracking-tight">Gestão de Usuários</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Controle de acessos e permissões da plataforma</p>
                    </div>
                    <button
                        onClick={() => setIsPanelOpen(true)}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        Novo Usuário
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-gray-50 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Usuário</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Cadastro</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Permissão</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">No Time</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-gray-100 border-2 border-white shadow-sm overflow-hidden shrink-0">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} className="w-full h-full object-cover" alt={u.full_name || ''} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <span className="material-symbols-outlined text-2xl">person</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-text-main text-sm uppercase tracking-tight">{u.full_name || 'Sem Nome'}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{u.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                {new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                                className="bg-gray-100 border-none rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 focus:ring-2 ring-primary/20 outline-none transition-all cursor-pointer hover:bg-gray-200"
                                            >
                                                {roles.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <button
                                                onClick={() => handleToggleShowOnLanding(u.id, !!u.show_on_landing)}
                                                className={`size-10 rounded-xl flex items-center justify-center mx-auto transition-all ${u.show_on_landing ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-300'}`}
                                                title={u.show_on_landing ? "Remover da Landing Page" : "Mostrar na Landing Page"}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {u.show_on_landing ? 'visibility' : 'visibility_off'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                title="Editar Perfil"
                                            >
                                                <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <SidePanel
                    isOpen={isPanelOpen}
                    onClose={handleClosePanel}
                    title={editingUser ? "Editar Usuário" : "Novo Usuário"}
                >
                    <form onSubmit={handleSaveUser} className="space-y-8">
                        <div className="space-y-5">
                            {!editingUser && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">E-mail</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main"
                                            placeholder="exemplo@email.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Senha Provisória</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main"
                                            placeholder="Mínimo 6 caracteres"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main"
                                    placeholder="Nome do usuário"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Função / Permissão</label>
                                <select
                                    className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main appearance-none"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    {roles.map(r => (
                                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 space-y-5">
                                <div className="flex items-center gap-3 p-5 bg-gray-50/50 rounded-[20px] border border-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={formData.showOnLanding}
                                        onChange={e => setFormData({ ...formData, showOnLanding: e.target.checked })}
                                        className="size-5 rounded-lg border-gray-300 text-primary focus:ring-primary outline-none"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-text-main tracking-widest leading-none">Exibir no Time (Landing Page)</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">Habilita a visualização pública da bio e cargo</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Cargo / Função</label>
                                    <input
                                        type="text"
                                        className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main"
                                        placeholder="Ex: Coordenador"
                                        value={formData.jobRole}
                                        onChange={e => setFormData({ ...formData, jobRole: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Mini Bio</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border-gray-100 bg-gray-50/50 p-4 rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all font-bold text-text-main"
                                        placeholder="Breve descrição..."
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary text-white py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                            >
                                {submitting ? 'Processando...' : (editingUser ? 'Salvar Alterações' : 'Criar Usuário')}
                            </button>

                            {editingUser && (
                                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-6 bg-gray-50 p-4 rounded-2xl leading-relaxed">
                                    Nota: Por segurança, e-mail e senha só podem ser alterados pelo próprio usuário em seus ajustes pessoais.
                                </p>
                            )}
                        </div>
                    </form>
                </SidePanel>
            </div>
        </AdminLayout>
    );
};

export default UserList;
