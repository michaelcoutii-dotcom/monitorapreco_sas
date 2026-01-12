import { useTheme } from '../App'

function PriceHistoryModal({ open, product, onClose }) {
  const { darkMode } = useTheme()

  if (!open || !product) return null

  const priceHistory = product.priceHistory || []
  
  // Calculate chart data
  const maxPrice = Math.max(...priceHistory.map(h => h.price), product.currentPrice)
  const minPrice = Math.min(...priceHistory.map(h => h.price), product.currentPrice)
  const priceRange = maxPrice - minPrice || 1

  // Add current price to history for display
  const allPrices = [...priceHistory, { price: product.currentPrice, recordedAt: new Date().toISOString() }]
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  }

  // Generate SVG path for line chart
  const generatePath = () => {
    if (allPrices.length < 2) return ''
    
    const width = 400
    const height = 150
    const padding = 20
    
    const points = allPrices.map((item, index) => {
      const x = padding + (index / (allPrices.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((item.price - minPrice) / priceRange) * (height - 2 * padding)
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }

  // Generate area path
  const generateArea = () => {
    if (allPrices.length < 2) return ''
    
    const width = 400
    const height = 150
    const padding = 20
    
    const points = allPrices.map((item, index) => {
      const x = padding + (index / (allPrices.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((item.price - minPrice) / priceRange) * (height - 2 * padding)
      return `${x},${y}`
    })
    
    const firstX = padding
    const lastX = padding + ((allPrices.length - 1) / (allPrices.length - 1)) * (width - 2 * padding)
    const bottomY = height - padding
    
    return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all duration-200 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Histórico de Preços
              </h3>
              <p className={`text-sm line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Current Price Card */}
          <div className={`flex items-center justify-between p-4 rounded-xl mb-6 ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Preço Atual</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatPrice(product.currentPrice)}
              </p>
            </div>
            {product.lastPrice && (
              <div className="text-right">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Preço Anterior</p>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatPrice(product.lastPrice)}
                </p>
              </div>
            )}
          </div>

          {/* Chart */}
          {allPrices.length >= 2 ? (
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
              <svg viewBox="0 0 400 150" className="w-full h-auto">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line
                    key={i}
                    x1="20"
                    y1={20 + i * 27.5}
                    x2="380"
                    y2={20 + i * 27.5}
                    stroke={darkMode ? '#374151' : '#e5e7eb'}
                    strokeWidth="1"
                  />
                ))}
                
                {/* Area */}
                <path
                  d={generateArea()}
                  fill={darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}
                />
                
                {/* Line */}
                <path
                  d={generatePath()}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Points */}
                {allPrices.map((item, index) => {
                  const x = 20 + (index / (allPrices.length - 1)) * 360
                  const y = 130 - ((item.price - minPrice) / priceRange) * 110
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#3b82f6"
                      stroke={darkMode ? '#1f2937' : 'white'}
                      strokeWidth="2"
                    />
                  )
                })}
              </svg>
              
              {/* Price labels */}
              <div className="flex justify-between mt-2">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Min: {formatPrice(minPrice)}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Max: {formatPrice(maxPrice)}
                </span>
              </div>
            </div>
          ) : (
            <div className={`text-center py-8 rounded-xl ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Sem dados suficientes para o gráfico
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                O histórico será atualizado automaticamente
              </p>
            </div>
          )}

          {/* History Table */}
          {allPrices.length > 0 && (
            <div className="mt-6">
              <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Histórico Detalhado
              </h4>
              <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full">
                    <thead className={`sticky top-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`text-left px-4 py-2 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Data
                        </th>
                        <th className={`text-right px-4 py-2 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Preço
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {allPrices.slice().reverse().map((item, index) => (
                        <tr key={index} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                          <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {formatDate(item.recordedAt)}
                          </td>
                          <td className={`px-4 py-2 text-sm text-right font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default PriceHistoryModal
