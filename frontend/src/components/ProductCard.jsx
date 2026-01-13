import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import PriceHistoryModal from './PriceHistoryModal'

export default function ProductCard({ product, onDelete, onShowHistory }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const priceChange = product.lastPrice 
    ? ((product.currentPrice - product.lastPrice) / product.lastPrice * 100).toFixed(1)
    : 0
  const priceChangeColor = priceChange < 0 ? 'text-green-600' : 'text-red-600'
  const priceChangeIcon = priceChange < 0 ? '📉' : '📈'

  return (
    <>
      <div className="rounded-2xl shadow-lg p-5 bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <a 
              href={product.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 transition-colors"
            >
              {product.name}
            </a>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-2 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
            title="Deletar produto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Price Info */}
        <div className="mb-4 p-3 rounded-xl bg-gray-50">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Preço Atual</span>
            <span className="text-2xl font-bold text-gray-900">
              R$ {product.currentPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
          {product.lastPrice && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Último preço: R$ {product.lastPrice.toFixed(2)}</span>
              <span className={`font-semibold ${priceChangeColor}`}>
                {priceChangeIcon} {Math.abs(priceChange)}%
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            📊 Histórico
          </button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-center"
          >
            🔗 Visitar
          </a>
        </div>
      </div>

      {/* Modals */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Deletar Produto?"
          message={`Tem certeza que deseja deletar "${product.name}"?`}
          onConfirm={() => {
            onDelete(product.id)
            setShowDeleteConfirm(false)
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showHistory && (
        <PriceHistoryModal
          open={showHistory}
          product={product}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  )
}
