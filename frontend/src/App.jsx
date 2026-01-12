import { useState, useEffect } from 'react'
import './App.css'
import ProductList from './components/ProductList'
import AddProduct from './components/AddProduct'
import Header from './components/Header'

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Erro ao carregar produtos')
      const data = await response.json()
      setProducts(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new product
  const addProduct = async (url) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao adicionar produto')
      }
      
      await fetchProducts()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Delete product
  const deleteProduct = async (id) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      await fetchProducts()
    } catch (err) {
      console.error('Erro ao remover produto:', err)
    }
  }

  // Refresh prices manually
  const refreshPrices = async () => {
    try {
      setLoading(true)
      await fetch('/api/products/refresh', { method: 'POST' })
      // Wait a bit for scraping to complete
      setTimeout(fetchProducts, 3000)
    } catch (err) {
      setError('Erro ao atualizar preços')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onRefresh={refreshPrices} loading={loading} />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <AddProduct onAdd={addProduct} />
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <ProductList 
          products={products} 
          loading={loading} 
          onDelete={deleteProduct}
        />
      </main>
    </div>
  )
}

export default App
