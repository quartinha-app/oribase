import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { IMAGES } from '../../constants';
import { supabase } from '../../services/supabase';

const RegisterView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'lider_terreiro' | 'fornecedor'>('lider_terreiro');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    // Pre-select role from URL parameter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const roleParam = params.get('role');
        if (roleParam === 'fornecedor') {
            setRole('fornecedor');
        }
    }, [location]);

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 6) score++;
        if (pass.length > 10) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const strengthScore = calculateStrength(password);
    const getStrengthLabel = (score: number) => {
        if (score < 2) return { label: 'Fraca', color: 'text-red-500', bg: 'bg-red-500' };
        if (score < 4) return { label: 'Média', color: 'text-amber-500', bg: 'bg-amber-500' };
        return { label: 'Forte', color: 'text-green-500', bg: 'bg-green-500' };
    };
    const strength = getStrengthLabel(strengthScore);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!acceptTerms) {
            setError('Você precisa aceitar os Termos de Uso.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (strengthScore < 2) {
            setError('A senha é muito fraca. Tente uma senha mais forte.');
            setLoading(false);
            return;
        }

        try {
            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (authError) throw authError;

            if (user) {
                if (role === 'fornecedor') {
                    navigate('/area-profissional');
                } else if (role === 'lider_terreiro') {
                    navigate('/leader-dashboard');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white">
            <div className="hidden lg:flex w-1/2 relative bg-[#e6e2df] overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-90 scale-105" style={{ backgroundImage: `url(/login_banner.png)` }}></div>
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div className="relative z-20 p-12 flex flex-col justify-center items-center h-full text-white text-center">
                    <p className="text-4xl font-light italic leading-relaxed max-w-lg">"Juntos fortalecemos nossa comunidade e preservamos nossas raízes."</p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background-light overflow-y-auto">
                <div className="w-full max-w-[440px] space-y-8 my-auto">
                    <div className="text-center">
                        <Link to="/" className="inline-flex mb-6 hover:scale-110 transition-transform">
                            <img src="/favicon_oribase.png" className="size-16 object-contain" alt="OríBase" />
                        </Link>
                        <h1 className="text-3xl font-extrabold text-text-main">Criar Conta</h1>
                        <p className="text-text-secondary mt-2">Junte-se à plataforma gratuitamente.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-text-main">Nome Completo</label>
                            <input
                                type="text"
                                required
                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-3"
                                placeholder="Seu nome"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-text-main">E-mail</label>
                            <input
                                type="email"
                                required
                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-3"
                                placeholder="exemplo@axe.org.br"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-text-main">Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-3 pr-10"
                                    placeholder="********"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                            {password && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${strength.bg} transition-all duration-300`}
                                            style={{ width: `${(strengthScore / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold ${strength.color}`}>{strength.label}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-text-main">Confirmar Senha</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-3 pr-10"
                                    placeholder="********"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <select
                                className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary focus:border-primary px-3"
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                            >
                                <option value="lider_terreiro">Liderança de Terreiro</option>
                                <option value="fornecedor">Profissional / Fornecedor</option>
                            </select>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                required
                                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                checked={acceptTerms}
                                onChange={e => setAcceptTerms(e.target.checked)}
                            />
                            <label htmlFor="acceptTerms" className="text-sm text-text-secondary leading-tight">
                                Li e concordo com os <Link to="/legal?type=terms" target="_blank" className="text-primary font-bold hover:underline">Termos de Uso</Link> e <Link to="/legal?type=privacy" target="_blank" className="text-primary font-bold hover:underline">Política de Privacidade</Link>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? 'Criando...' : 'Cadastrar'} <span className="material-symbols-outlined">person_add</span>
                        </button>
                    </form>

                    <p className="text-center text-sm text-text-secondary">
                        Já tem conta? <Link to="/login" className="text-primary font-bold hover:underline">Fazer Login</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
