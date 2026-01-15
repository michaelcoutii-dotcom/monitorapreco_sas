import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      setToast({ type: 'error', message: 'Preencha todos os campos' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setToast({ type: 'error', message: 'Email inválido' });
      return;
    }

    if (password.length < 6) {
      setToast({ type: 'error', message: 'Senha deve ter pelo menos 6 caracteres' });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ type: 'error', message: 'As senhas não coincidem' });
      return;
    }

    setIsLoading(true);

    try {
      console.log('[INFO] Tentando registrar:', email);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha no cadastro');
      }

      console.log('[SUCCESS] Cadastro realizado:', data.email);
      login(data);
      setToast({ type: 'success', message: 'Bem-vindo! Vamos começar!' });
      
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('[ERROR] Erro no cadastro:', error.message);
      setToast({ type: 'error', message: error.message || 'Erro ao cadastrar' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-md relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <span>← Voltar</span>
        </button>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-md rounded-2xl shadow-2xl p-10 border border-slate-700/50">
          <div className="text-center mb-10">
            <div className="inline-block bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl mb-4 hover:scale-110 transition-transform duration-300">
              <span className="text-4xl">✨</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Comece Agora!
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Crie sua conta e monitore preços do Mercado Livre
            </p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 mb-8 space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>100% grátis - sem cartão necessário</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Comece a monitorar em 2 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Aumentar vendas inteligentemente</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="João da Silva"
                required
                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder-slate-500 hover:border-slate-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder-slate-500 hover:border-slate-500 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">Será usado para login e alertas</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder-slate-500 hover:border-slate-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? '���️‍���️' : '���️'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres para segurança</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a mesma senha"
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder-slate-500 hover:border-slate-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? '���️‍���️' : '���️'}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors text-sm">
              <input
                type="checkbox"
                required
                className="rounded bg-slate-700 border-slate-600 text-green-500 focus:ring-green-500/20 cursor-pointer mt-1"
              />
              <span>
                Concordo com os <a href="#" className="text-green-400 hover:text-green-300">Termos de Uso</a> e <a href="#" className="text-green-400 hover:text-green-300">Política de Privacidade</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-green-500/50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando conta...
                </span>
              ) : (
                'Criar Conta Grátis'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-600/50"></div>
            <span className="text-xs text-slate-500">JÁ TEM CONTA?</span>
            <div className="flex-1 h-px bg-slate-600/50"></div>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-sm mb-4">
              Entre com sua conta existente
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 border-2 border-slate-600 hover:border-green-500 text-white hover:text-green-400 font-bold rounded-xl transition-all duration-300 hover:bg-green-500/10"
            >
              Fazer Login
            </button>
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-slate-500 space-y-2">
          <p>Dados criptografados • Sem spam • Cancelável a qualquer momento</p>
        </div>
      </div>
    </div>
  );
}
