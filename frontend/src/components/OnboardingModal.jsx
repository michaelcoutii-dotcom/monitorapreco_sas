import { useState } from 'react';

/**
 * OnboardingModal - Welcome tutorial for new users
 * Shows step-by-step guide on how to use the app
 */
export default function OnboardingModal({ onClose, userName }) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: '🏆',
            title: `${userName?.split(' ')[0] || 'Olá'}, pronto para dominar o mercado?`,
            description: 'Monitore seus concorrentes e fique sempre um passo à frente. Saiba exatamente quando ajustar seus preços!',
            highlight: 'Vamos te mostrar como vencer a concorrência em 1 minuto!',
            image: (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 mt-4 border border-green-500/30">
                    <div className="flex items-center justify-around text-center">
                        <div>
                            <div className="text-2xl">😟</div>
                            <div className="text-xs text-slate-400 mt-1">Concorrente</div>
                        </div>
                        <div className="text-2xl">→</div>
                        <div>
                            <div className="text-2xl">📉</div>
                            <div className="text-xs text-green-400 mt-1">Baixou preço</div>
                        </div>
                        <div className="text-2xl">→</div>
                        <div>
                            <div className="text-2xl">🔔</div>
                            <div className="text-xs text-amber-400 mt-1">Você sabe!</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            icon: '🎯',
            title: 'Espione a Concorrência',
            description: 'Encontre os produtos dos seus concorrentes no Mercado Livre e copie a URL. Você vai saber toda vez que eles mudarem o preço!',
            highlight: '💡 Dica: Monitore os TOP vendedores do seu nicho',
            image: (
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="bg-slate-800 rounded px-3 py-2 text-xs text-slate-400 font-mono truncate">
                        https://www.mercadolivre.com.br/produto-do-concorrente
                    </div>
                </div>
            )
        },
        {
            icon: '➕',
            title: 'Adicione em Segundos',
            description: 'Cole a URL e pronto! O sistema extrai automaticamente preço, nome e imagem.',
            highlight: 'Adicione quantos produtos quiser e monte sua lista de monitoramento!',
            image: (
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-lg px-4 py-3 text-sm text-slate-400">
                            Cole a URL do concorrente aqui...
                        </div>
                        <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white text-sm font-semibold">
                            ➕ Espionar
                        </div>
                    </div>
                </div>
            )
        },
        {
            icon: '⚡',
            title: 'Monitoramento 24/7',
            description: 'Seus concorrentes são verificados automaticamente a cada 30 minutos. Você nunca mais vai perder uma mudança de preço!',
            highlight: 'Enquanto você dorme, estamos vigiando a concorrência 👀',
            image: (
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4 flex items-center justify-center gap-6">
                    <div className="text-center">
                        <div className="text-3xl mb-1">📉</div>
                        <div className="text-xs text-green-400 font-semibold">Concorrente baixou!</div>
                        <div className="text-[10px] text-slate-500">Hora de reagir</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl mb-1">📈</div>
                        <div className="text-xs text-amber-400 font-semibold">Concorrente subiu!</div>
                        <div className="text-[10px] text-slate-500">Oportunidade!</div>
                    </div>
                </div>
            )
        },
        {
            icon: '🔔',
            title: 'Alertas Instantâneos',
            description: 'Receba notificações assim que detectarmos qualquer mudança:',
            highlight: null,
            image: (
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📧</span>
                        <div>
                            <p className="text-sm text-white font-medium">Email na hora</p>
                            <p className="text-xs text-slate-400">Saiba antes de todo mundo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✈️</span>
                        <div>
                            <p className="text-sm text-white font-medium">Telegram Instantâneo</p>
                            <p className="text-xs text-slate-400">Alertas direto no celular</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <p className="text-sm text-white font-medium">Sininho no app</p>
                            <p className="text-xs text-slate-400">Histórico de todas as mudanças</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            icon: '🚀',
            title: 'Hora de Dominar!',
            description: 'Comece agora mesmo a monitorar seus concorrentes e tome decisões mais inteligentes.',
            highlight: 'Quem tem informação, tem vantagem!',
            image: (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg p-6 mt-4 text-center border border-amber-500/30">
                    <div className="text-4xl mb-3">💰</div>
                    <p className="text-amber-400 font-semibold text-lg">
                        Venda mais. Lucre mais.
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                        Fique sempre à frente da concorrência
                    </p>
                    <div className="mt-4 pt-4 border-t border-amber-500/20">
                        <p className="text-xs text-slate-500">💡 Dica: Confira o <span className="text-amber-400 font-medium">Analytics</span> para ver gráficos e tendências dos seus produtos!</p>
                    </div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Progress Bar */}
                <div className="h-1 bg-slate-700">
                    <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    {/* Icon */}
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                            <span className="text-5xl">{step.icon}</span>
                        </div>
                    </div>

                    {/* Text */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {step.title}
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            {step.description}
                        </p>
                        {step.highlight && (
                            <p className="text-amber-400 text-sm mt-3 font-medium">
                                {step.highlight}
                            </p>
                        )}
                    </div>

                    {/* Image/Visual */}
                    {step.image}

                    {/* Step indicator */}
                    <div className="flex justify-center gap-2 mt-6">
                        {steps.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    idx === currentStep 
                                        ? 'w-6 bg-amber-500' 
                                        : idx < currentStep
                                            ? 'bg-amber-500/50'
                                            : 'bg-slate-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 sm:px-8 py-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between">
                    <div>
                        {currentStep > 0 ? (
                            <button
                                onClick={handlePrev}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                ← Voltar
                            </button>
                        ) : (
                            <button
                                onClick={handleSkip}
                                className="px-4 py-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                            >
                                Pular tutorial
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                    >
                        {isLastStep ? 'Começar a Espionar! 🎯' : 'Próximo →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
