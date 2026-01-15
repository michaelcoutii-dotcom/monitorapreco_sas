import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Landing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Se usuário já está logado, redirecionar para dashboard
  if (user) {
    navigate('/');
    return null;
  }

  const features = [
    {
      icon: '⚡',
      title: 'Monitoramento em Tempo Real',
      description: 'Receba alertas instantâneos sempre que os preços dos seus produtos mudam no Mercado Livre.'
    },
    {
      icon: '📊',
      title: 'Histórico e Análise',
      description: 'Visualize gráficos detalhados e identifique tendências para melhorar sua estratégia de preços.'
    },
    {
      icon: '🔔',
      title: 'Alertas Personalizados',
      description: 'Configure notificações por queda percentual ou valor em R$. Você decide quando quer ser alertado.'
    },
    {
      icon: '📧',
      title: 'Notificações por Email',
      description: 'Receba relatórios resumidos com mudanças de preços. Fique informado mesmo quando estiver offline.'
    },
    {
      icon: '📱',
      title: 'Acesso em Qualquer Lugar',
      description: 'Interface responsiva que funciona perfeitamente em desktop, tablet e celular.'
    },
    {
      icon: '🔒',
      title: 'Segurança de Dados',
      description: 'Seus dados são protegidos com autenticação JWT e criptografia de nível empresarial.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-50"></div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-6 backdrop-blur-sm border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="text-4xl">📊</div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Price Monitor
            </h1>
            <p className="text-xs text-slate-400">Maximize seus lucros</p>
          </div>
        </div>
        <div className="flex gap-4">
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
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="w-full">
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-full">
            <span className="text-amber-400 font-semibold text-sm">✨ Micro SaaS para Vendedores Inteligentes</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Rastreie Preços do
            <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Mercado Livre em Tempo Real
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Monitore seus produtos, receba alertas instantâneos e maximize seus lucros. 
            Sem complicações, sem limite de produtos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-105 text-lg"
            >
              🚀 Começar Agora (Grátis)
            </button>
            <button 
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-slate-600 text-white font-bold rounded-lg hover:border-amber-500 hover:text-amber-400 transition-all text-lg"
            >
              📖 Saiba Mais
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Suporte 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            Por que MonitoraPreço?
          </h2>
          <p className="text-center text-slate-400 mb-12 text-lg max-w-2xl mx-auto">
            Construído especialmente para vendedores que querem crescer no Mercado Livre
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Monitoramento em Tempo Real</h3>
              <p className="text-slate-400">
                Verificamos o preço dos seus produtos automaticamente. Sem ficar refrescando manualmente.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-white mb-3">Alertas Inteligentes</h3>
              <p className="text-slate-400">
                Receba notificações instantâneas quando o preço mudar. Destaques em queda de 5% ou mais.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-3">Análise de Preços</h3>
              <p className="text-slate-400">
                Visualize histórico de preços em gráficos. Entenda tendências e padrões do mercado.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">Sem Limite de Produtos</h3>
              <p className="text-slate-400">
                Monitore quantos produtos quiser. Quanto mais, melhor sua estratégia de precificação.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-bold text-white mb-3">Seus Dados Seguros</h3>
              <p className="text-slate-400">
                Criptografia SSL, sem compartilhamento de dados. Sua privacidade é prioridade.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-3">Configurações Personalizadas</h3>
              <p className="text-slate-400">
                Escolha quais tipos de alerta você quer receber. Você controla tudo.
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
                  Rápido e simples. Apenas email e senha. Nada de burocracias.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Adicione seus Produtos</h3>
                <p className="text-slate-400 text-lg">
                  Cole o link do Mercado Livre. Instantaneamente começamos a monitorar.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Receba Alertas</h3>
                <p className="text-slate-400 text-lg">
                  Quando preço mudar, você fica sabendo. No seu email, no seu tempo.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Lucre Mais</h3>
                <p className="text-slate-400 text-lg">
                  Com dados em mão, você ajusta preços inteligentemente e vende mais.
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
              <h3 className="text-xl font-bold text-white mb-3">Vendedores de Eletrônicos</h3>
              <p className="text-slate-400 mb-4">
                Monitore concorrentes e ajuste seus preços estrategicamente. Ganhe mais vendas com preços competitivos.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>📈</span>
                <span className="font-semibold">Até 23% mais lucro</span>
              </div>
            </div>

            {/* Use case 2 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
              <div className="text-4xl mb-4">👗</div>
              <h3 className="text-xl font-bold text-white mb-3">Lojistas de Moda</h3>
              <p className="text-slate-400 mb-4">
                Acompanhe tendências de preços por tamanho e cor. Venda mais rápido com preços dinâmicos.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>⚡</span>
                <span className="font-semibold">Vende 3x mais rápido</span>
              </div>
            </div>

            {/* Use case 3 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-white mb-3">Vendedores de Games</h3>
              <p className="text-slate-400 mb-4">
                Preços mudam constantemente. Com MonitoraPreço, você nunca perde uma oportunidade.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>🎯</span>
                <span className="font-semibold">Sempre competitivo</span>
              </div>
            </div>

            {/* Use case 4 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-white mb-3">Revendedores Diversos</h3>
              <p className="text-slate-400 mb-4">
                Qualquer segmento se beneficia. Mais dados = melhores decisões = mais lucro.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span>✨</span>
                <span className="font-semibold">Simples e eficaz</span>
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
              Pronto para Aumentar seus Lucros?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Junte-se a centenas de vendedores que já usam MonitoraPreço
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-105 text-lg"
            >
              🚀 Começar Grátis Agora
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
                <li><a href="#" className="hover:text-amber-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-amber-400 transition">Sobre</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-amber-400 transition">Privacidade</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Termos</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm">
            <p>&copy; 2026 MonitoraPreço. Todos os direitos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-amber-400 transition">Twitter</a>
              <a href="#" className="hover:text-amber-400 transition">LinkedIn</a>
              <a href="#" className="hover:text-amber-400 transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
