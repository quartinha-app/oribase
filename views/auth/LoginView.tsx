import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IMAGES } from '../../constants';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') navigate('/admin');
      else if (profile.role === 'fornecedor') navigate('/area-profissional');
      else if (profile.role === 'lider_terreiro') navigate('/leader-dashboard');
      else navigate('/dashboard');
    }
  }, [profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Auth state change will handle navigation via useEffect or context
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
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
          <p className="text-4xl font-light italic leading-relaxed max-w-xl drop-shadow-lg">
            "Preservar a história é honrar o presente e construir o futuro."
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background-light">
        <div className="w-full max-w-[440px] space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex mb-6 hover:scale-110 transition-transform">
              <img src="/favicon_oribase.png" className="size-16 object-contain" alt="OríBase" />
            </Link>
            <h1 className="text-3xl font-extrabold text-text-main">Login</h1>
            <p className="text-text-secondary mt-2">Bem-vindo de volta.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

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
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar'} <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Ainda não tem conta? <Link to="/register" className="text-primary font-bold hover:underline">Criar conta</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
