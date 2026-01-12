import { useState } from 'react'

function ProductCard({ product, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false)
  
  const { id, name, url, currentPrice, lastPrice, lastCheckedAt } = product
  
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
  
  const handleDelete = () => {
    onDelete(id)
    setShowConfirm(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4 sm:p-5">
        {/* Header with name and delete */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-medium text-gray-800 text-sm sm:text-base line-clamp-2 flex-1">
            {name}
          </h3>
          
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
              title="Remover"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
        
        {/* Price Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Current Price */}
            <div className="flex items-center gap-2">
              <span className={`text-2xl sm:text-3xl font-bold ${hasPriceDrop ? 'text-green-600' : hasPriceIncrease ? 'text-red-600' : 'text-gray-800'}`}>
                {formatPrice(currentPrice)}
              </span>
              
              {/* Price Arrow */}
              {hasPriceDrop && (
                <div className="flex items-center text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              )}
              
              {hasPriceIncrease && (
                <div className="flex items-center text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Price Change Badge */}
            {lastPrice && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                hasPriceDrop 
                  ? 'bg-green-100 text-green-800' 
                  : hasPriceIncrease 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {hasPriceDrop ? '-' : hasPriceIncrease ? '+' : ''}{percentDiff}%
              </span>
            )}
          </div>
          
          {/* Last Price */}
          {lastPrice && (
            <div className="text-sm text-gray-500">
              <span>Anterior: </span>
              <span className="line-through">{formatPrice(lastPrice)}</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
          >
            Ver no Mercado Livre
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          
          <span className="text-xs text-gray-400">
            Atualizado: {formatDate(lastCheckedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
