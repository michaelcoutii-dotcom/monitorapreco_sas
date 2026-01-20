import { useState, useEffect } from 'react';
import { getTelegramStatus, generateTelegramCode, unlinkTelegram, toggleTelegramNotifications } from '../api/products';

export default function TelegramSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getTelegramStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load Telegram status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const data = await generateTelegramCode();
      setLinkCode(data);
    } catch (error) {
      alert('Erro ao gerar código');
    } finally {
      setGenerating(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Deseja desvincular sua conta do Telegram?')) return;
    
    try {
      await unlinkTelegram();
      setStatus({ ...status, linked: false, telegramEnabled: false });
      setLinkCode(null);
    } catch (error) {
      alert('Erro ao desvincular');
    }
  };

  const handleToggle = async () => {
    try {
      const result = await toggleTelegramNotifications(!status.telegramEnabled);
      setStatus({ ...status, telegramEnabled: result.telegramEnabled });
    } catch (error) {
      alert('Erro ao alterar configuração');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!status?.enabled) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📱</span>
          <h3 className="text-lg font-semibold text-white">Telegram</h3>
        </div>
        <p className="text-slate-400 text-sm">
          Integração com Telegram não está configurada no servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📱</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Telegram</h3>
            <p className="text-slate-400 text-sm">
              Receba alertas de preço no Telegram
            </p>
          </div>
        </div>
        
        {status.linked && (
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">✓ Vinculado</span>
          </div>
        )}
      </div>

      {status.linked ? (
        // Conta vinculada
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Notificações</p>
              <p className="text-slate-400 text-sm">
                {status.telegramEnabled 
                  ? 'Você receberá alertas no Telegram' 
                  : 'Notificações desativadas'}
              </p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                status.telegramEnabled ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  status.telegramEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={handleUnlink}
            className="w-full px-4 py-2 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-colors text-sm"
          >
            Desvincular Telegram
          </button>
        </div>
      ) : (
        // Conta não vinculada
        <div className="space-y-4">
          {linkCode ? (
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              {/* Botão principal - abre direto no Telegram */}
              <a
                href={`https://t.me/${linkCode.botUsername}?start=${linkCode.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                Vincular meu Telegram
              </a>
              
              <p className="text-slate-400 text-sm mt-4 mb-2">
                Clique no botão acima e depois toque em <strong className="text-white">"INICIAR"</strong> no Telegram
              </p>
              
              <p className="text-slate-500 text-xs">
                Código: <span className="font-mono">{linkCode.code}</span> • Expira em 10 minutos
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {generating ? '⏳ Gerando...' : '🔗 Vincular Telegram'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
