import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Landing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Se usuário já está logado, redirecionar para dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-50"></div>

      {/* Navigation */}
      <nav className="relative z-10 backdrop-blur-sm border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <img src="/logo_monitora.png" alt="MonitoraPreço" className="h-14 w-14 sm:h-16 sm:w-16 object-contain" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  MonitoraPreço
                </h1>
                <p className="text-xs text-slate-400">Maximize seus lucros</p>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-slate-300 hover:text-white transition-colors font-medium"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-bold transition-all transform hover:scale-105"
              >
                Começar Grátis
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700">
                <span className="sr-only">Abrir menu</span>
                {/* Hamburger Icon */}
                <svg className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                {/* Close Icon */}
                <svg className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white bg-amber-600 hover:bg-amber-700"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="w-full">
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-full">
            <span className="text-amber-400 font-semibold text-sm">🔍 Inteligência Competitiva para E-commerce</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Monitore seus Concorrentes no
            <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Mercado Livre em Tempo Real
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Saiba quando seus concorrentes mudam preços, analise tendências do mercado 
            e tome decisões estratégicas para vender mais.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-105 text-lg"
            >
              🚀 Monitorar Concorrentes Agora
            </button>
            <button 
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-slate-600 text-white font-bold rounded-lg hover:border-amber-500 hover:text-amber-400 transition-all text-lg"
            >
              🎯 Ver Como Funciona
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Teste grátis por 14 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            Por que usar Inteligência Competitiva?
          </h2>
          <p className="text-center text-slate-400 mb-12 text-lg max-w-2xl mx-auto">
            Quem conhece o mercado, vende mais. Veja como podemos te ajudar:
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Espionagem de Concorrentes</h3>
              <p className="text-slate-400">
                Monitore os preços dos seus concorrentes automaticamente. Saiba quando eles baixam ou aumentam preços.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-white mb-3">Alertas Estratégicos</h3>
              <p className="text-slate-400">
                Receba alertas quando um concorrente mudar preço. Reaja rápido e não perca vendas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-3">Análise de Mercado</h3>
              <p className="text-slate-400">
                Visualize tendências de preços em gráficos. Entenda o comportamento do seu nicho.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">Monitore Vários Concorrentes</h3>
              <p className="text-slate-400">
                Adicione quantos concorrentes quiser. Tenha uma visão completa do seu mercado.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-bold text-white mb-3">100% Anônimo</h3>
              <p className="text-slate-400">
                Seus concorrentes nunca sabem que estão sendo monitorados. Operação discreta.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-3">Decisões Baseadas em Dados</h3>
              <p className="text-slate-400">
                Pare de chutar preços. Use dados reais para definir sua estratégia de preços.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">
            Como Funciona
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Crie sua Conta</h3>
                <p className="text-slate-400 text-lg">
                  Cadastro rápido. Email e senha. Pronto em 30 segundos.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Adicione Concorrentes</h3>
                <p className="text-slate-400 text-lg">
                  Cole o link do anúncio do concorrente. Começamos a monitorar imediatamente.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Acompanhe Mudanças</h3>
                <p className="text-slate-400 text-lg">
                  Veja quando eles mudam preços. Receba alertas em tempo real.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Tome Decisões Estratégicas</h3>
                <p className="text-slate-400 text-lg">
                  Com dados do mercado, ajuste seus preços e fique sempre competitivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">
            Quem Usa MonitoraPreço?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Use case 1 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-bold text-white mb-3">Vendedores de E-commerce</h3>
              <p className="text-slate-400 mb-4">
                Monitore os preços dos concorrentes diretos. Saiba quando eles fazem promoções e reaja rápido.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>💪</span>
                <span className="font-semibold">Sempre um passo à frente</span>
              </div>
            </div>

            {/* Use case 2 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-3">Gestores de Precificação</h3>
              <p className="text-slate-400 mb-4">
                Dados históricos para definir preços com base no mercado real. Nada de achismo.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>📈</span>
                <span className="font-semibold">Decisões baseadas em dados</span>
              </div>
            </div>

            {/* Use case 3 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-3">Analistas de Mercado</h3>
              <p className="text-slate-400 mb-4">
                Entenda como o mercado se comporta. Identifique padrões e oportunidades.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>🎯</span>
                <span className="font-semibold">Visão estratégica completa</span>
              </div>
            </div>

            {/* Use case 4 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-white mb-3">Empresários em Crescimento</h3>
              <p className="text-slate-400 mb-4">
                Escale seu negócio conhecendo o mercado. Cresça com inteligência.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>✨</span>
                <span className="font-semibold">Cresça com confiança</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Planos Simples
          </h2>
          <p className="text-slate-400 text-lg mb-12">
            Comece grátis. Pague apenas quando estiver pronto.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition-all">
              <div className="text-3xl font-bold text-white mb-2">Grátis</div>
              <div className="text-slate-400 mb-6">Para começar</div>
              <ul className="space-y-3 text-left text-slate-400 mb-6">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Até 5 produtos</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Alertas básicos</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Suporte por email</li>
              </ul>
              <button className="w-full py-2 border border-slate-600 text-white rounded-lg hover:border-amber-500 transition-all">
                Começar
              </button>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-amber-600/30 to-orange-600/30 border-2 border-amber-500 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                Mais Popular
              </div>
              <div className="text-3xl font-bold text-white mb-2">Pro</div>
              <div className="text-2xl text-amber-400 font-bold mb-6">R$ 29/mês</div>
              <ul className="space-y-3 text-left text-slate-300 mb-6">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Até 50 produtos</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Alertas avançados</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> <span className="text-amber-400 font-medium">Telegram Instantâneo</span></li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> <span className="text-amber-400 font-medium">Analytics Completo</span></li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Histórico de 30 dias</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Suporte prioritário</li>
              </ul>
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-amber-500/50 transition-all"
              >
                Começar Pro
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition-all">
              <div className="text-3xl font-bold text-white mb-2">Enterprise</div>
              <div className="text-slate-400 mb-6">Customizado</div>
              <ul className="space-y-3 text-left text-slate-400 mb-6">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Produtos ilimitados</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> API access</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Webhooks</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Suporte dedicado</li>
              </ul>
              <button className="w-full py-2 border border-slate-600 text-white rounded-lg hover:border-amber-500 transition-all">
                Contatar
              </button>
            </div>
          </div>

          <p className="text-slate-500 text-sm mt-8">
            Todos os planos têm 14 dias grátis. Sem cartão necessário.
          </p>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/50 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para Conhecer seus Concorrentes?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Comece a monitorar agora e tome decisões estratégicas baseadas em dados reais
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-105 text-lg"
            >
              🔍 Monitorar Concorrentes Agora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">MonitoraPreço</h4>
              <p className="text-slate-400 text-sm">O melhor jeito de acompanhar preços no Mercado Livre.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-amber-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-amber-400 transition">Preços</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-400 transition">Como Funciona</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="mailto:contato@monitorapreco.com.br" className="hover:text-amber-400 transition">Contato</a></li>
                <li><a href="#faq" className="hover:text-amber-400 transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/privacy" className="hover:text-amber-400 transition">Política de Privacidade</Link></li>
                <li><Link to="/terms" className="hover:text-amber-400 transition">Termos de Uso</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} MonitoraPreço. Todos os direitos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-amber-400 transition">Privacidade</Link>
              <Link to="/terms" className="hover:text-amber-400 transition">Termos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}