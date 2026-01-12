import ProductCard from './ProductCard'

function ProductList({ products, loading, onDelete }) {
  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Carregando produtos...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Nenhum produto monitorado
        </h3>
        <p className="text-gray-500 text-sm">
          Adicione um produto do Mercado Livre para começar a monitorar os preços.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Produtos Monitorados
        </h2>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {products.length} {products.length === 1 ? 'produto' : 'produtos'}
        </span>
      </div>
      
      <div className="grid gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

export default ProductList
