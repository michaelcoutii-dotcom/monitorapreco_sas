import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import Header from './components/Header'
import AddProduct from './components/AddProduct'
import ProductList from './components/ProductList'
import Toast from './components/Toast'
import ConfirmModal from './components/ConfirmModal'
import PriceHistoryModal from './components/PriceHistoryModal'

const API_URL = import.meta.env.VITE_API_URL || ''

// Theme Context
const ThemeContext = createContext()
export const useTheme = () => useContext(ThemeContext)

// Toast Context
const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true
  })

  // Products state
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)

  // Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterBy, setFilterBy] = useState('all')

  // Toast state
  const [toasts, setToasts] = useState([])

  // Modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: '' })
  const [priceHistoryModal, setPriceHistoryModal] = useState({ open: false, product: null })

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Toast functions
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`)
      if (!response.ok) throw new Error('Erro ao buscar produtos')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      addToast('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Add product
  const addProduct = async (url) => {
    setAdding(true)
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      if (response.ok) {
        const newProduct = await response.json()
        addToast(`"${newProduct.name}" adicionado com sucesso!`, 'success')
        fetchProducts()
        return { success: true }
      } else {
        throw new Error('Erro ao adicionar')
      }
    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      addToast('Erro ao adicionar produto. Verifique a URL.', 'error')
      return { success: false }
    } finally {
      setAdding(false)
    }
  }

  // Delete product
  const handleDeleteClick = (id, name) => {
    setConfirmModal({ open: true, productId: id, productName: name })
  }

  const confirmDelete = async () => {
    const { productId, productName } = confirmModal
    try {
      await fetch(`${API_URL}/api/products/${productId}`, { method: 'DELETE' })
      addToast(`"${productName}" removido`, 'success')
      fetchProducts()
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
      addToast('Erro ao remover produto', 'error')
    } finally {
      setConfirmModal({ open: false, productId: null, productName: '' })
    }
  }

  // Refresh prices
  const refreshPrices = async () => {
    setRefreshing(true)
    try {
      await fetch(`${API_URL}/api/products/refresh`, { method: 'POST' })
      addToast('Preços atualizados!', 'success')
      setTimeout(() => {
        fetchProducts()
        setRefreshing(false)
      }, 3000)
    } catch (error) {
      console.error('Erro ao atualizar preços:', error)
      addToast('Erro ao atualizar preços', 'error')
      setRefreshing(false)
    }
  }

  // Show price history
  const showPriceHistory = (product) => {
    setPriceHistoryModal({ open: true, product })
  }

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (filterBy === 'priceDropped' && !(product.lastPrice && product.currentPrice < product.lastPrice)) {
        return false
      }
      if (filterBy === 'priceUp' && !(product.lastPrice && product.currentPrice > product.lastPrice)) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return a.currentPrice - b.currentPrice
        case 'priceDesc':
          return b.currentPrice - a.currentPrice
        case 'priceChange':
          const changeA = a.lastPrice ? ((a.currentPrice - a.lastPrice) / a.lastPrice) : 0
          const changeB = b.lastPrice ? ((b.currentPrice - b.lastPrice) / b.lastPrice) : 0
          return changeA - changeB
        default:
          return 0
      }
    })

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <ToastContext.Provider value={{ addToast }}>
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <Header 
            onRefresh={refreshPrices} 
            refreshing={refreshing}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            <AddProduct onAdd={addProduct} adding={adding} />
            <ProductList 
              products={filteredProducts}
              totalProducts={products.length}
              loading={loading} 
              onDelete={handleDeleteClick}
              onShowHistory={showPriceHistory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
            />
          </main>

          {/* Toast Container */}
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
              <Toast 
                key={toast.id} 
                message={toast.message} 
                type={toast.type} 
                onClose={() => removeToast(toast.id)} 
              />
            ))}
          </div>

          {/* Confirm Delete Modal */}
          <ConfirmModal
            open={confirmModal.open}
            title="Remover Produto"
            message={`Tem certeza que deseja remover "${confirmModal.productName}"?`}
            onConfirm={confirmDelete}
            onCancel={() => setConfirmModal({ open: false, productId: null, productName: '' })}
          />

          {/* Price History Modal */}
          <PriceHistoryModal
            open={priceHistoryModal.open}
            product={priceHistoryModal.product}
            onClose={() => setPriceHistoryModal({ open: false, product: null })}
          />
        </div>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App
