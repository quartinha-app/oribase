import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const ResetPasswordView: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if we have a recovery session
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                // If no session, they might have landed here without a valid recovery link
                // However, onAuthStateChange or just let them try to update
            }
        };
        checkSession();
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background-light flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-[440px] bg-white p-8 rounded-2xl shadow-xl text-center space-y-6">
                    <div className="inline-flex items-center justify-center size-16 bg-green-100 text-green-600 rounded-full">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main">Senha Atualizada!</h1>
                    <p className="text-text-secondary">Sua senha foi alterada com sucesso. Redirecionando para o login...</p>
                    <Link to="/login" className="block text-primary font-bold hover:underline">Ir para o Login agora</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light flex flex-col justify-center items-center p-8">
            <div className="w-full max-w-[440px] space-y-8">
                <div className="text-center">
                    <Link to="/" className="inline-flex mb-6 hover:scale-110 transition-transform">
                        <img src="/favicon_oribase.png" className="size-16 object-contain" alt="OríBase" />
                    </Link>
                    <h1 className="text-3xl font-extrabold text-text-main">Nova Senha</h1>
                    <p className="text-text-secondary mt-2">Defina sua nova senha de acesso.</p>
                </div>

                <form onSubmit={handleResetPassword} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-text-main">Nova Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-3"
                            placeholder="Min. 6 caracteres"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-text-main">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-3"
                            placeholder="Repita a nova senha"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordView;
