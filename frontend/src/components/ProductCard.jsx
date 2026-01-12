import { useState } from 'react'
import { useTheme } from '../App'

function ProductCard({ product, onDelete, onShowHistory }) {
  const { darkMode } = useTheme()
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const { id, name, url, currentPrice, lastPrice, lastCheckedAt, imageUrl } = product
  
  // Check if price dropped
  const hasPriceDrop = lastPrice !== null && currentPrice < lastPrice
  const hasPriceIncrease = lastPrice !== null && currentPrice > lastPrice
  
  // Calculate price difference
  const priceDiff = lastPrice ? Math.abs(currentPrice - lastPrice) : 0
  const percentDiff = lastPrice ? ((priceDiff / lastPrice) * 100).toFixed(1) : 0
  
  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`group rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700/50 hover:border-gray-600' 
        : 'bg-white border border-gray-100 hover:border-gray-200'
    }`}>
      {/* Product Image */}
      <div className={`relative h-48 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        {imageUrl && !imageError ? (
          <>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className={`absolute inset-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}>
                <div className="flex items-center justify-center h-full">
                  <svg className={`w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={name}
              className={`w-full h-full object-contain transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Price Drop Badge */}
        {hasPriceDrop && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
            🔥 BAIXOU {percentDiff}%
          </div>
        )}
        
        {/* Price Increase Badge */}
        {hasPriceIncrease && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg">
            ↑ +{percentDiff}%
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onShowHistory(product)}
            className={`p-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-110 ${
              darkMode 
                ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-200' 
                : 'bg-white/80 hover:bg-white text-gray-700'
            } shadow-lg`}
            title="Ver histórico de preços"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(id)}
            className={`p-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-110 ${
              darkMode 
                ? 'bg-gray-800/80 hover:bg-red-600 text-gray-200 hover:text-white' 
                : 'bg-white/80 hover:bg-red-500 text-gray-700 hover:text-white'
            } shadow-lg`}
            title="Remover produto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Product Name */}
        <h3 className={`font-semibold text-sm line-clamp-2 mb-3 leading-snug ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          {name}
        </h3>
        
        {/* Price Section */}
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            {/* Last Price */}
            {lastPrice && lastPrice !== currentPrice && (
              <div className={`text-sm line-through mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatPrice(lastPrice)}
              </div>
            )}
            
            {/* Current Price */}
            <div className={`text-2xl font-bold ${
              hasPriceDrop 
                ? 'text-green-500' 
                : hasPriceIncrease 
                  ? 'text-red-500' 
                  : darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrice(currentPrice)}
            </div>
          </div>
          
          {/* Savings */}
          {hasPriceDrop && (
            <div className={`text-right ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              <div className="text-xs uppercase font-medium">Economia</div>
              <div className="font-bold">{formatPrice(priceDiff)}</div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`flex items-center justify-between pt-4 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 hover:from-yellow-300 hover:to-amber-400 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span>Ver oferta</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatDate(lastCheckedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
