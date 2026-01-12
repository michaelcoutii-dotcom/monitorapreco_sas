import { useState } from 'react'
import { useTheme } from '../App'

function AddProduct({ onAdd, adding }) {
  const { darkMode } = useTheme()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('Cole a URL do produto')
      return
    }
    
    if (!url.includes('mercadolivre') && !url.includes('mercadolibre')) {
      setError('URL deve ser do Mercado Livre')
      return
    }

    setError('')
    const result = await onAdd(url)
    
    if (result.success) {
      setUrl('')
    }
  }

  return (
    <div className={`rounded-2xl shadow-lg p-6 mb-8 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-100'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Adicionar Novo Produto
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError('')
              }}
              placeholder="Cole a URL do produto do Mercado Livre..."
              className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400/20' 
                  : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20'
              } ${error ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white"
          >
            {adding ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Adicionando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Monitorar</span>
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </form>
      
      <p className={`text-xs mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        💡 Cole a URL completa do produto que deseja monitorar. Ex: https://www.mercadolivre.com.br/produto...
      </p>
    </div>
  )
}

export default AddProduct
