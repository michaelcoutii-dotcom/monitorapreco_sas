import { useState } from 'react'
import PriceHistoryModal from './PriceHistoryModal'
import NotificationPreferences from './NotificationPreferences'

export default function ProductCard({ product, onDelete, onShowHistory, onUpdateProduct }) {
  const [showHistory, setShowHistory] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  const priceChange = product.lastPrice 
    ? ((product.currentPrice - product.lastPrice) / product.lastPrice * 100).toFixed(1)
    : 0
  const isPriceDropped = priceChange < 0

  return (
    <>
      <div 
        className="rounded-2xl shadow-lg hover:shadow-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:border-indigo-200 hover:-translate-y-1 group"
      >
        {/* Price Drop Alert */}
        {isPriceDropped && (
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.5rem,1.5vh,0.75rem)] text-center font-bold text-[clamp(0.75rem,1.5vw,0.875rem)]">
            🎉 PREÇO CAIU {Math.abs(priceChange)}%
          </div>
        )}

        {/* Card Content */}
        <div className="p-[clamp(1rem,5vw,1.5rem)]">
          
          {/* Product Header with Delete */}
          <div className="flex items-start justify-between mb-[1rem]">
            <div className="flex-1 pr-[0.5rem]">
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[clamp(0.875rem,2vw,1rem)] font-bold text-gray-900 hover:text-indigo-600 line-clamp-2 transition-colors group-hover:text-indigo-500 leading-snug"
              >
                {product.name}
              </a>
            </div>
            <button
              onClick={() => onDelete(product.id, product.name)}
              className="p-[0.5rem] rounded-lg hover:bg-red-50 transition-all duration-300 flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer hover:scale-110 active:scale-95"
              title="Deletar produto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Price Display Section */}
          <div className={`mb-[1.25rem] p-[clamp(0.75rem,2vw,1rem)] rounded-xl transition-all duration-300 ${
            isPriceDropped 
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100'
          }`}>
            {/* Current Price */}
            <div className="mb-[0.75rem]">
              <span className="text-[clamp(0.5rem,1vw,0.625rem)] font-bold text-gray-700 uppercase tracking-widest">
                💰 Preço Atual
              </span>
              <div className="text-[clamp(1.75rem,4vw,2.25rem)] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-[0.25rem]">
                R$ {product.currentPrice?.toFixed(2) || '0.00'}
              </div>
            </div>
            
            {/* Price Change */}
            {product.lastPrice && (
              <div className="flex items-center justify-between text-[clamp(0.75rem,1.5vw,0.875rem)] pt-[0.75rem] border-t border-gray-200">
                <span className="text-gray-700">
                  <span className="font-semibold">Antes:</span> R$ {product.lastPrice.toFixed(2)}
                </span>
                <span className={`font-bold flex items-center gap-[0.25rem] ${
                  isPriceDropped ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {isPriceDropped ? '📉' : '📈'} {Math.abs(priceChange)}%
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-3 gap-[0.75rem]">
            {/* History Button */}
            <button
              onClick={() => setShowHistory(true)}
              className="px-[clamp(0.5rem,2vw,0.75rem)] py-[clamp(0.75rem,2vh,1rem)] rounded-lg text-[clamp(0.625rem,1vw,0.75rem)] font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-[0.25rem] min-h-[44px]"
              title="Ver histórico de preços"
            >
              <span className="text-[1em]">📊</span>
              <span className="hidden sm:inline">Histórico</span>
            </button>

            {/* Notification Button */}
            <button
              onClick={() => setShowPreferences(true)}
              className="px-[clamp(0.5rem,2vw,0.75rem)] py-[clamp(0.75rem,2vh,1rem)] rounded-lg text-[clamp(0.625rem,1vw,0.75rem)] font-bold bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-[0.25rem] min-h-[44px]"
              title="Configurar notificações"
            >
              <span className="text-[1em]">🔔</span>
              <span className="hidden sm:inline">Alertas</span>
            </button>

            {/* Visit Button */}
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-[clamp(0.5rem,2vw,0.75rem)] py-[clamp(0.75rem,2vh,1rem)] rounded-lg text-[clamp(0.625rem,1vw,0.75rem)] font-bold bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-[0.25rem] min-h-[44px]"
              title="Visitar no Mercado Livre"
            >
              <span className="text-[1em]">🔗</span>
              <span className="hidden sm:inline">Visitar</span>
            </a>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showHistory && (
        <PriceHistoryModal
          open={showHistory}
          product={product}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showPreferences && (
        <NotificationPreferences
          product={product}
          onClose={() => setShowPreferences(false)}
          onSave={(updatedProduct) => {
            if (onUpdateProduct) {
              onUpdateProduct(updatedProduct);
            }
            setShowPreferences(false);
          }}
        />
      )}
    </>
  )
}

