import { useState } from 'react'
import PriceHistoryModal from './PriceHistoryModal'
import NotificationPreferences from './NotificationPreferences'

export default function ProductCard({ product, onDelete, onShowHistory, onUpdateProduct }) {
  const [showHistory, setShowHistory] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Check if product is still loading (PENDING status)
  const isPending = product.status === 'PENDING'
  const isError = product.status === 'ERROR'

  const priceChange = product.lastPrice 
    ? ((product.currentPrice - product.lastPrice) / product.lastPrice * 100).toFixed(1)
    : 0
  const isPriceDropped = priceChange < 0
  const isPriceUp = priceChange > 0

  // Placeholder image when product doesn't have imageUrl or it fails to load
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f1f5f9' width='300' height='200'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E📦 Sem imagem%3C/text%3E%3C/svg%3E"

  // Special card for PENDING products
  if (isPending) {
    return (
      <div className="rounded-2xl shadow-lg bg-white border-2 border-amber-300 overflow-hidden animate-pulse">
        {/* Loading Image Placeholder */}
        <div className="aspect-[16/10] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-2 animate-bounce">⏳</div>
            <p className="text-amber-600 font-semibold text-sm">Carregando...</p>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-600 line-clamp-2 mb-3">
            {product.name || 'Buscando informações do produto...'}
          </h3>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 text-amber-700">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs font-medium">Obtendo preço...</span>
            </div>
          </div>

          {/* Delete button only */}
          <button
            onClick={() => onDelete(product.id, product.name)}
            className="w-full py-2 px-4 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            🗑️ Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Special card for ERROR products
  if (isError) {
    return (
      <div className="rounded-2xl shadow-lg bg-white border-2 border-red-300 overflow-hidden">
        {/* Error Image Placeholder */}
        <div className="aspect-[16/10] bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-2">❌</div>
            <p className="text-red-600 font-semibold text-sm">Erro ao carregar</p>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-600 line-clamp-2 mb-3">
            {product.name}
          </h3>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-red-600">
              Não foi possível obter os dados deste produto. Verifique se a URL está correta.
            </p>
          </div>

          {/* Delete button only */}
          <button
            onClick={() => onDelete(product.id, product.name)}
            className="w-full py-2 px-4 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            🗑️ Remover
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl shadow-lg hover:shadow-2xl bg-white border border-slate-200 overflow-hidden transition-all duration-300 hover:border-amber-300 hover:-translate-y-1 group">
        
        {/* Product Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {/* Image with lazy loading */}
          <a 
            href={product.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            {/* Skeleton loader while image loads */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
            )}
            
            <img
              src={imageError || !product.imageUrl ? placeholderImage : product.imageUrl}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <span className="text-white text-sm font-semibold flex items-center gap-2">
                🔗 Ver no Mercado Livre
              </span>
            </div>
          </a>

          {/* Price Drop Badge - positioned on image */}
          {isPriceDropped && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
              🔥 -{Math.abs(priceChange)}%
            </div>
          )}

          {/* Price Up Badge */}
          {isPriceUp && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              📈 +{Math.abs(priceChange)}%
            </div>
          )}
          
          {/* Promotional Discount Badge - shows if product has active promotion and no price change */}
          {!isPriceDropped && !isPriceUp && product.discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
              🏷️ {product.discountPercent}% OFF
            </div>
          )}

          {/* Delete Button - positioned on image */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(product.id, product.name)
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-red-500 text-slate-600 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110 active:scale-95"
            title="Remover produto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Card Content */}
        <div className="p-4">
          
          {/* Product Name */}
          <a 
            href={product.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block mb-3"
          >
            <h3 className="text-sm font-bold text-slate-800 hover:text-amber-600 line-clamp-2 transition-colors leading-snug">
              {product.name}
            </h3>
          </a>

          {/* Price Section */}
          <div className={`mb-4 p-3 rounded-xl transition-all duration-300 ${
            isPriceDropped 
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200' 
              : isPriceUp
                ? 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200'
          }`}>
            {/* Current Price - Main */}
            <div className="flex items-baseline justify-between">
              <div>
                {/* Preço Atual (sempre mostra) */}
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Preço Atual
                </span>
                <div className={`text-2xl font-bold ${
                  isPriceDropped 
                    ? 'text-emerald-600' 
                    : isPriceUp 
                      ? 'text-red-600'
                      : 'text-slate-800'
                }`}>
                  R$ {product.currentPrice?.toFixed(2) || '0.00'}
                </div>
                
                {/* Se tem desconto, mostra preço com desconto calculado embaixo */}
                {product.discountPercent > 0 && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 rounded-lg p-2">
                    <span className="text-sm text-slate-600">Com desconto:</span>
                    <span className="text-lg font-bold text-emerald-600">
                      R$ {(product.currentPrice * (1 - product.discountPercent / 100)).toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-1 rounded-full">
                      🏷️ {product.discountPercent}% OFF
                    </span>
                  </div>
                )}
              </div>
              
              {/* Price Change Indicator */}
              {product.lastPrice && (
                <div className={`text-right ${
                  isPriceDropped ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  <span className="text-2xl">{isPriceDropped ? '📉' : '📈'}</span>
                  <div className="text-xs font-bold">
                    {isPriceDropped ? '-' : '+'}{Math.abs(priceChange)}%
                  </div>
                </div>
              )}
            </div>
            
            {/* Previous Price */}
            {product.lastPrice && product.lastPrice !== product.currentPrice && (
              <div className="mt-2 pt-2 border-t border-slate-200/50 text-xs text-slate-500">
                <span className="font-medium">Antes:</span>{' '}
                <span className="line-through">R$ {product.lastPrice.toFixed(2)}</span>
                <span className={`ml-2 font-semibold ${isPriceDropped ? 'text-emerald-600' : 'text-red-600'}`}>
                  ({isPriceDropped ? '💰 economia' : '⚠️ aumento'} de R$ {Math.abs(product.currentPrice - product.lastPrice).toFixed(2)})
                </span>
              </div>
            )}
            
            {/* Stable Price Message */}
            {product.lastPrice && product.lastPrice === product.currentPrice && (
              <div className="mt-2 pt-2 border-t border-slate-200/50 text-xs text-slate-400">
                <span>✓ Preço estável desde última verificação</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {/* History Button */}
            <button
              onClick={() => setShowHistory(true)}
              className="py-2.5 px-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-1"
              title="Ver histórico de preços"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Histórico</span>
            </button>

            {/* Notification Button */}
            <button
              onClick={() => setShowPreferences(true)}
              className="py-2.5 px-2 rounded-lg text-xs font-bold bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
              title="Configurar alertas"
            >
              <span>🔔</span>
              <span className="hidden sm:inline">Alertas</span>
            </button>

            {/* Visit Button */}
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-2 rounded-lg text-xs font-bold bg-white border-2 border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
              title="Ver anúncio do concorrente"
            >
              <span>🔗</span>
              <span className="hidden sm:inline">Ver Anúncio</span>
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

