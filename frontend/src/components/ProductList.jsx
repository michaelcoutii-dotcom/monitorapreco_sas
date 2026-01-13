import ProductCard from './ProductCard'

function ProductList({ 
  products, 
  totalProducts,
  loading, 
  onDelete, 
  onShowHistory,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange 
}) {

  const SkeletonCard = () => (
    <div className="rounded-2xl p-4 bg-white">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-xl bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
          <div className="h-6 w-1/3 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-1/4 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-full rounded-xl bg-gray-200 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (totalProducts === 0) {
    return (
      <div className="rounded-2xl shadow-lg p-12 text-center bg-white">
        <div className="inline-flex p-4 rounded-full mb-4 bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          Nenhum produto monitorado
        </h3>
        <p className="mb-6 text-gray-500">
          Adicione um produto do Mercado Livre para começar<br />
          a monitorar os preços automaticamente.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Os preços são verificados a cada 30 minutos
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-2xl shadow-lg p-4 mb-6 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                Produtos Monitorados
              </h2>
              <p className="text-xs text-gray-500">
                {products.length} de {totalProducts} {totalProducts === 1 ? 'produto' : 'produtos'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterBy}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium border-2 bg-gray-50 border-gray-200 text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">📋 Todos</option>
              <option value="priceDropped">📉 Preço caiu</option>
              <option value="priceUp">📈 Preço subiu</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium border-2 bg-gray-50 border-gray-200 text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="name">🔤 Nome A-Z</option>
              <option value="price">💰 Menor preço</option>
              <option value="priceDesc">💎 Maior preço</option>
              <option value="priceChange">📊 Maior desconto</option>
            </select>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl shadow-lg p-8 text-center bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500">
            Nenhum produto encontrado com esses filtros
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onDelete={onDelete}
              onShowHistory={onShowHistory}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductList
