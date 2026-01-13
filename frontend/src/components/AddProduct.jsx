import { useState } from 'react'

function AddProduct({ onAdd, adding }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const validateUrl = (urlString) => {
    if (!urlString.trim()) {
      return 'Cole a URL do produto'
    }

    // Check if it's a valid URL format
    try {
      new URL(urlString)
    } catch {
      return 'URL inválida. Use um endereço completo'
    }

    // Check if it's from Mercado Livre
    if (!urlString.includes('mercadolivre.com') && !urlString.includes('mercadolibre.com')) {
      return 'URL deve ser do Mercado Livre (mercadolivre.com.br ou mercadolibre.com)'
    }

    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateUrl(url)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    const result = await onAdd(url)
    
    if (result.success) {
      setUrl('')
    }
  }

  const handleUrlChange = (e) => {
    setUrl(e.target.value)
    setError('') // Clear error when user starts typing
  }

  const handlePaste = async (e) => {
    const pastedText = e.clipboardData.getData('text')
    const urlError = validateUrl(pastedText)
    if (!urlError) {
      setUrl(pastedText)
      setError('')
    }
  }

  return (
    <div className="rounded-2xl shadow-lg p-6 mb-8 transition-all duration-300 bg-white border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-green-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          Adicionar Novo Produto
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              onPaste={handlePaste}
              placeholder="Cole a URL do produto (ex: https://www.mercadolivre.com.br/...)"
              disabled={adding}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white active:scale-95"
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
          <div className="flex items-start gap-3 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            ✅ Certifique-se que o Backend está rodando em <strong>http://localhost:8081</strong> e o Scraper Python em <strong>http://localhost:8000</strong>
          </span>
        </div>
      </form>
    </div>
  )
}

export default AddProduct
