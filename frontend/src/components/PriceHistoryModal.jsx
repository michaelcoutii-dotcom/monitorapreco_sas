import { useState, useEffect } from 'react'

export default function PriceHistoryModal({ product, onClose, open }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!product || !open) {
      setLoading(false)
      return
    }
    const mockHistory = [
      { price: product.currentPrice, date: new Date().toLocaleDateString('pt-BR') },
      ...(product.lastPrice ? [{ price: product.lastPrice, date: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR') }] : [])
    ]
    setHistory(mockHistory)
    setLoading(false)
  }, [product, open])

  if (!open) return null

  if (!product) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <p className="text-gray-600">Produto não encontrado</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  const minPrice = Math.min(...history.map(h => h.price))
  const maxPrice = Math.max(...history.map(h => h.price))
  const avgPrice = (history.reduce((sum, h) => sum + h.price, 0) / history.length).toFixed(2)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Histórico de Preços
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600 font-medium">Menor Preço</p>
                  <p className="text-lg font-bold text-green-700">R$ {minPrice.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Preço Médio</p>
                  <p className="text-lg font-bold text-blue-700">R$ {avgPrice}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Maior Preço</p>
                  <p className="text-lg font-bold text-red-700">R$ {maxPrice.toFixed(2)}</p>
                </div>
              </div>

              {/* History List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Evolução de Preços</h4>
                {history.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{entry.date}</p>
                        <p className="text-xs text-gray-500">Registrado</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      R$ {entry.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
