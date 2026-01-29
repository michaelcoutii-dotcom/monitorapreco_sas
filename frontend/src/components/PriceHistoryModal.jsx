import { useQuery } from '@tanstack/react-query';
import { getPriceHistory } from '../api/products';

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const StatCard = ({ title, value, colorClass }) => (
  <div className={`p-3 rounded-lg border ${colorClass.border} ${colorClass.bg}`}>
    <p className={`text-xs font-medium ${colorClass.text}`}>{title}</p>
    <p className={`text-lg font-bold ${colorClass.textDark}`}>{value}</p>
  </div>
);

export default function PriceHistoryModal({ product, onClose, open }) {
  const { 
    data: history = [], 
    isLoading,
    isError
  } = useQuery({
    queryKey: ['priceHistory', product?.id],
    queryFn: () => getPriceHistory(product.id),
    enabled: !!product && !!open, // Only fetch when the modal is open and has a product
    staleTime: 1000 * 60, // 1 minute
  });

  if (!open) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="p-6 text-center">
          <p className="text-red-600">❌ Erro ao carregar o histórico.</p>
        </div>
      );
    }

    if (history.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-gray-600">🧐 Nenhum histórico de preço encontrado.</p>
        </div>
      );
    }

    const prices = history.map(h => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = (prices.reduce((sum, price) => sum + price, 0) / prices.length);
    
    // Verificar se tem variação de preço
    const hasVariation = minPrice !== maxPrice;

    return (
      <div className="p-6">
        {/* Banner informativo se não tem variação */}
        {!hasVariation && history.length <= 2 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              📊 <strong>Produto recém-adicionado.</strong> As estatísticas serão mais precisas após algumas variações de preço.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard 
            title="Menor Preço" 
            value={`R$ ${minPrice.toFixed(2)}`} 
            colorClass={{ 
              bg: hasVariation ? 'bg-green-50' : 'bg-gray-50', 
              border: hasVariation ? 'border-green-200' : 'border-gray-200', 
              text: hasVariation ? 'text-green-600' : 'text-gray-500', 
              textDark: hasVariation ? 'text-green-700' : 'text-gray-600' 
            }} 
          />
          <StatCard 
            title="Preço Médio" 
            value={`R$ ${avgPrice.toFixed(2)}`} 
            colorClass={{ bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', textDark: 'text-blue-700' }} 
          />
          <StatCard 
            title="Maior Preço" 
            value={`R$ ${maxPrice.toFixed(2)}`} 
            colorClass={{ 
              bg: hasVariation ? 'bg-red-50' : 'bg-gray-50', 
              border: hasVariation ? 'border-red-200' : 'border-gray-200', 
              text: hasVariation ? 'text-red-600' : 'text-gray-500', 
              textDark: hasVariation ? 'text-red-700' : 'text-gray-600' 
            }} 
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">Evolução de Preços</h4>
            <span className="text-xs text-gray-500">{history.length} registro{history.length !== 1 ? 's' : ''}</span>
          </div>
          {history.map((entry, index) => {
            // Calcular variação em relação ao registro anterior
            const prevEntry = history[index + 1]; // Histórico vem ordenado DESC
            const priceChange = prevEntry ? entry.price - prevEntry.price : 0;
            const changePercent = prevEntry ? ((priceChange / prevEntry.price) * 100) : 0;
            
            return (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    priceChange > 0 ? 'bg-red-500' : priceChange < 0 ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <p className="text-sm font-medium text-gray-800">{formatDate(entry.recordedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {priceChange !== 0 && (
                    <span className={`text-xs font-medium ${priceChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {priceChange > 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}%
                    </span>
                  )}
                  <p className="text-lg font-bold text-gray-900">
                    R$ {entry.price.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Histórico de Preços
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {product?.name || 'Carregando...'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto">
          {renderContent()}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}