import { useState } from 'react';

export default function NotificationPreferences({ product, onClose, onSave }) {
  const [notifyOnDrop, setNotifyOnDrop] = useState(
    product.notifyOnPriceDrop !== false
  );
  const [notifyOnIncrease, setNotifyOnIncrease] = useState(
    product.notifyOnPriceIncrease !== false
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/products/${product.id}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          notifyOnPriceDrop: notifyOnDrop,
          notifyOnPriceIncrease: notifyOnIncrease,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar preferências');
      }

      const updatedProduct = await response.json();
      onSave(updatedProduct);
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err);
      setError(err.message || 'Erro ao atualizar preferências');
    } finally {
      setLoading(false);
    }
  };

  const bothDisabled = !notifyOnDrop && !notifyOnIncrease;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.488 5.951 1.488a1 1 0 001.169-1.409l-7-14z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">
              Preferências de Notificação
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 font-medium">
              Produto: <span className="font-semibold text-gray-900">{product.name}</span>
            </p>
          </div>

          {/* Queda de Preço */}
          <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🔻</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Queda de Preço</p>
                <p className="text-xs text-gray-600">Notificar quando preço diminuir</p>
              </div>
            </div>
            <button
              onClick={() => setNotifyOnDrop(!notifyOnDrop)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifyOnDrop ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                  notifyOnDrop ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Aumento de Preço */}
          <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Aumento de Preço</p>
                <p className="text-xs text-gray-600">Notificar quando preço aumentar</p>
              </div>
            </div>
            <button
              onClick={() => setNotifyOnIncrease(!notifyOnIncrease)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifyOnIncrease ? 'bg-red-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                  notifyOnIncrease ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Warning */}
          {bothDisabled && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800">
                Nenhuma notificação ativa. Você não receberá emails sobre mudanças de preço.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Status Summary */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {notifyOnDrop && notifyOnIncrease
                ? '✅ Receberá notificações para ambas as situações'
                : notifyOnDrop
                ? '✅ Receberá apenas notificações de queda de preço'
                : notifyOnIncrease
                ? '✅ Receberá apenas notificações de aumento de preço'
                : '⚠️ Sem notificações ativas'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
