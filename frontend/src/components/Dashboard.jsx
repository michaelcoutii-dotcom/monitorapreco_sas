import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getProducts, addProduct as apiAddProduct, deleteProduct as apiDeleteProduct, refreshPrices as apiRefreshPrices } from '../api/products';

import Header from './Header';
import AddProduct from './AddProduct';
import ProductList from './ProductList';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import PriceHistoryModal from './PriceHistoryModal';
import useToasts from '../hooks/useToasts';

export default function Dashboard() {
    const queryClient = useQueryClient();
    const { toasts, addToast, removeToast } = useToasts();

    // State for UI controls
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: '' });
    const [priceHistoryModal, setPriceHistoryModal] = useState({ open: false, product: null });

    // --- React Query ---

    // Query for fetching products
    const { data: products = [], isLoading: isLoadingProducts, isError: isFetchError } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Mutation for adding a product
    const { mutate: addProduct, isPending: isAddingProduct } = useMutation({
        mutationFn: apiAddProduct,
        onSuccess: (newProduct) => {
            addToast(`✅ "${newProduct.name}" adicionado com sucesso!`, 'success');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            addToast(`❌ ${error.message}`, 'error');
        },
    });

    // Mutation for deleting a product
    const { mutate: deleteProduct } = useMutation({
        mutationFn: apiDeleteProduct,
        onSuccess: (_, variables) => {
            // `variables` is the productId passed to the mutate function
            const productName = products.find(p => p.id === variables)?.name || 'Produto';
            addToast(`✅ "${productName}" removido com sucesso.`, 'success');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            addToast(`❌ ${error.message}`, 'error');
        },
        onSettled: () => {
            setConfirmModal({ open: false, productId: null, productName: '' });
        }
    });

    // Mutation for refreshing prices
    const { mutate: refreshPrices, isPending: isRefreshing } = useMutation({
        mutationFn: apiRefreshPrices,
        onSuccess: () => {
            addToast('🔄 Preços sendo atualizados em segundo plano...', 'info');
            // Wait a bit for the backend to process, then refetch
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['products'] });
            }, 5000);
        },
        onError: (error) => {
            addToast(`❌ ${error.message}`, 'error');
        }
    });


    // --- Event Handlers ---

    const handleAddProduct = (url) => {
        try {
            new URL(url);
            addToast('⏳ Adicionando produto... Isso pode levar alguns segundos.', 'info');
            addProduct(url);
            return { success: true };
        } catch {
            addToast('URL inválida. Use um endereço completo (https://...)', 'error');
            return { success: false };
        }
    };

    const handleDeleteClick = (id, name) => {
        setConfirmModal({ open: true, productId: id, productName: name });
    };

    const confirmDelete = () => {
        if (confirmModal.productId) {
            deleteProduct(confirmModal.productId);
        }
    };

    // --- Derived State (Filtering and Sorting) ---

    const filteredAndSortedProducts = useMemo(() => {
        return products
            .filter(product => {
                if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
                if (filterBy === 'priceDropped' && !(product.lastPrice && product.currentPrice < product.lastPrice)) {
                    return false;
                }
                if (filterBy === 'priceUp' && !(product.lastPrice && product.currentPrice > product.lastPrice)) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'price':
                        return a.currentPrice - b.currentPrice;
                    case 'priceDesc':
                        return b.currentPrice - a.currentPrice;
                    case 'priceChange':
                        const changeA = a.lastPrice ? ((a.currentPrice - a.lastPrice) / a.lastPrice) : 0;
                        const changeB = b.lastPrice ? ((b.currentPrice - b.lastPrice) / b.lastPrice) : 0;
                        return changeA - changeB;
                    default:
                        return 0;
                }
            });
    }, [products, searchTerm, filterBy, sortBy]);


    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                onRefresh={refreshPrices}
                refreshing={isRefreshing}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />
            <main className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
                <div className="container mx-auto px-4 py-10 max-w-7xl">
                    <AddProduct onAdd={handleAddProduct} adding={isAddingProduct} />
                    
                    {isFetchError && (
                         <div className="rounded-2xl shadow-lg p-8 text-center bg-red-50 text-red-700">
                           <h3 className="text-xl font-semibold mb-2">❌ Erro ao Carregar Produtos</h3>
                           <p>Não foi possível buscar os dados. Verifique a conexão com o servidor.</p>
                         </div>
                    )}

                    <ProductList
                        products={filteredAndSortedProducts}
                        totalProducts={products.length}
                        loading={isLoadingProducts}
                        onDelete={handleDeleteClick}
                        onShowHistory={(product) => setPriceHistoryModal({ open: true, product })}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        filterBy={filterBy}
                        onFilterChange={setFilterBy}
                    />
                </div>
            </main>

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

            <ConfirmModal
                open={confirmModal.open}
                title="Remover Produto"
                message={`Tem certeza que deseja remover "${confirmModal.productName}"?`}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmModal({ open: false, productId: null, productName: '' })}
            />

            <PriceHistoryModal
                open={priceHistoryModal.open}
                product={priceHistoryModal.product}
                onClose={() => setPriceHistoryModal({ open: false, product: null })}
            />
        </div>
    );
}