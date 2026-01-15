import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('[INFO] ��� Tentando login:', email);
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Email ou senha inválidos');
      }

      console.log('[SUCCESS] ✅ Login realizado:', data.email);
      login(data);
      setToast({ type: 'success', message: 'Bem-vindo de volta! ���' });
      
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('[ERROR] ❌ Erro no login:', error.message);
      setToast({ type: 'error', message: error.message || 'Erro ao fazer login' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-md relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <span>←</span>
          <span>Voltar</span>
        </button>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-md rounded-2xl shadow-2xl p-10 border border-slate-700/50">
          <div className="text-center mb-10">
            <div className="inline-block bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl mb-4 hover:scale-110 transition-transform duration-300">
              <span className="text-4xl">���</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bem-vindo de Volta!
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Entre na sua conta e continue monitorando
            </p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 mb-8 space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✓</span>
              <span>Monitore até 50 produtos simultaneamente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✓</span>
              <span>Receba alertas em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✓</span>
              <span>Aumente seus lucros inteligentemente</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                ��� Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder-slate-500 hover:border-slate-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                ��� Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder-slate-500 hover:border-slate-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? '���️' : '���️‍���️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors">
                <input
                  type="checkbox"
                  className="rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                />
                <span>Manter conectado</span>
              </label>
              <button
                type="button"
                onClick={() => setToast({ type: 'info', message: 'Recuperação de senha em breve!' })}
                className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                Esqueci a senha
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-amber-500/50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </span>
              ) : (
                '��� Entrar na Conta'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-600/50"></div>
            <span className="text-xs text-slate-500">NOVO AQUI?</span>
            <div className="flex-1 h-px bg-slate-600/50"></div>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-sm mb-4">
              Crie sua conta e comece a lucrar mais
            </p>
            <a 
              href="/register"
              className="inline-block w-full py-3 border-2 border-slate-600 hover:border-amber-500 text-white hover:text-amber-400 font-bold rounded-xl transition-all duration-300 hover:bg-amber-500/10"
            >
              ✨ Criar Conta Grátis
            </a>
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-slate-500 space-y-2">
          <p>Sem cartão de crédito necessário</p>
          <p>Acesso imediato • Cancelável a qualquer momento</p>
        </div>
      </div>
    </div>
  );
}
