import ProductCard from './ProductCard'

function ProductList({ 
  products, 
  totalProducts,
  loading, 
  onDelete, 
  onShowHistory,
  onUpdateProduct,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange 
}) {

  const SkeletonCard = () => (
    <div className="rounded-2xl p-[clamp(0.75rem,2vw,1rem)] bg-white">
      <div className="flex gap-[clamp(0.75rem,2vw,1rem)]">
        <div className="w-24 h-24 rounded-xl bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-[0.75rem]">
          <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
          <div className="h-6 w-1/3 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-1/4 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-[1rem]">
        <div className="h-12 w-full rounded-xl bg-gray-200 animate-pulse" />
        <div className="grid gap-[clamp(0.75rem,2vw,1rem)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (totalProducts === 0) {
    return (
      <div className="rounded-2xl shadow-lg p-[clamp(1.5rem,5vw,3rem)] text-center bg-white">
        <div className="inline-flex p-[clamp(0.75rem,2vw,1rem)] rounded-full mb-[1rem] bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[clamp(1.5rem,5vw,3rem)] w-[clamp(1.5rem,5vw,3rem)] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-[clamp(1.125rem,2.5vw,1.5rem)] font-semibold mb-[0.5rem] text-gray-800">
          📦 Nenhum produto monitorado
        </h3>
        <p className="mb-[1.5rem] text-[clamp(0.875rem,1.5vw,1rem)] text-gray-500 leading-relaxed">
          Adicione um produto do Mercado Livre para começar<br />
          a monitorar os preços automaticamente.
        </p>
        <div className="inline-flex items-center gap-[0.5rem] px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.5rem,1.5vh,0.75rem)] rounded-xl text-[clamp(0.75rem,1.5vw,0.875rem)] bg-gray-100 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ⏰ Preços verificados a cada 30 minutos
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="rounded-2xl shadow-lg p-[clamp(0.75rem,2vw,1rem)] mb-[clamp(1rem,3vw,1.5rem)] bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[clamp(0.75rem,2vw,1rem)]">
          
          {/* Info Section */}
          <div className="flex items-center gap-[clamp(0.5rem,2vw,0.75rem)]">
            <div className="p-[clamp(0.5rem,1.5vw,0.75rem)] rounded-xl bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-[clamp(1rem,2vw,1.25rem)] w-[clamp(1rem,2vw,1.25rem)] text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-[clamp(1rem,1.5vw,1.125rem)] text-gray-800">
                📊 {products.length === totalProducts ? 'Produtos' : 'Resultados'}
              </h2>
              <p className="text-[clamp(0.625rem,1vw,0.75rem)] text-gray-500">
                {products.length} de {totalProducts} {totalProducts === 1 ? 'produto' : 'produtos'}
              </p>
            </div>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-[clamp(0.5rem,2vw,0.75rem)]">
            {/* Filter Dropdown */}
            <select
              value={filterBy}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.5rem,1.5vh,0.75rem)] rounded-xl text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium border-2 bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors min-h-[44px]"
            >
              <option value="all">📋 Todos</option>
              <option value="priceDropped">📉 Preço caiu</option>
              <option value="priceUp">📈 Preço subiu</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.5rem,1.5vh,0.75rem)] rounded-xl text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium border-2 bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors min-h-[44px]"
            >
              <option value="name">🔤 Nome A-Z</option>
              <option value="price">💰 Menor preço</option>
              <option value="priceDesc">💎 Maior preço</option>
              <option value="priceChange">📊 Maior desconto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid or Empty State */}
      {products.length === 0 ? (
        <div className="rounded-2xl shadow-lg p-[clamp(2rem,5vw,3rem)] text-center bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[clamp(2rem,5vw,3rem)] w-[clamp(2rem,5vw,3rem)] mx-auto mb-[0.75rem] text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-[clamp(0.875rem,1.5vw,1rem)] text-gray-500">
            🔍 Nenhum produto encontrado com esses filtros
          </p>
        </div>
      ) : (
        <div className="grid gap-[clamp(0.75rem,2vw,1rem)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onDelete={onDelete}
              onShowHistory={onShowHistory}
              onUpdateProduct={onUpdateProduct}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductList
