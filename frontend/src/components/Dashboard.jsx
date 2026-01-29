import { useState, useMemo, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getProducts, addProduct as apiAddProduct, deleteProduct as apiDeleteProduct, refreshPrices as apiRefreshPrices } from '../api/products';

import Header from './Header';
import AddProduct from './AddProduct';
import ProductList from './ProductList';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import PriceHistoryModal from './PriceHistoryModal';
import OnboardingModal from './OnboardingModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import TelegramSettings from './TelegramSettings';
import useToasts from '../hooks/useToasts';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
    const queryClient = useQueryClient();
    const { toasts, addToast, removeToast } = useToasts();
    const { user } = useContext(AuthContext);

    // State for UI controls
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: '' });
    const [priceHistoryModal, setPriceHistoryModal] = useState({ open: false, product: null });
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [emailVerificationModal, setEmailVerificationModal] = useState({ open: false, limit: 4 });
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showTelegramSettings, setShowTelegramSettings] = useState(false);

    // Check if user is new and should see onboarding
    useEffect(() => {
        const onboardingComplete = localStorage.getItem('onboardingComplete');
        if (!onboardingComplete) {
            // Small delay to let the page load first
            const timer = setTimeout(() => {
                setShowOnboarding(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('onboardingComplete', 'true');
    };

    // --- React Query ---

    // Query for fetching products
    const { data: products = [], isLoading: isLoadingProducts, isError: isFetchError } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts,
        staleTime: 1000 * 30, // 30 seconds (faster refresh for pending products)
        refetchInterval: (query) => {
            // Auto-refresh every 3 seconds if there are pending products
            const data = query.state.data || [];
            const hasPending = data.some(p => p.status === 'PENDING');
            return hasPending ? 3000 : false;
        },
    });

    // Update last update time when products are fetched
    useEffect(() => {
        if (products.length > 0) {
            const now = new Date();
            setLastUpdateTime(now);
        }
    }, [products]);

    // Mutation for adding a product
    const { mutate: addProduct, isPending: isAddingProduct } = useMutation({
        mutationFn: apiAddProduct,
        onSuccess: (newProduct) => {
            // Product is added instantly with PENDING status
            if (newProduct.status === 'PENDING') {
                addToast(`⏳ Produto adicionado! Obtendo preço...`, 'info');
            } else {
                addToast(`✅ "${newProduct.name}" adicionado com sucesso!`, 'success');
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            // Check if it's email verification limit error
            if (error.code === 'EMAIL_NOT_VERIFIED') {
                setEmailVerificationModal({ open: true, limit: error.limit || 2 });
            } else {
                addToast(`❌ ${error.message}`, 'error');
            }
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

    // Handle manual refresh - update time immediately and then trigger refresh
    const handleRefreshClick = () => {
        // Update the time immediately for visual feedback
        setLastUpdateTime(new Date());
        // Then trigger the actual refresh
        refreshPrices();
    };

    // Format last update time
    const formatUpdateTime = () => {
        if (!lastUpdateTime) return '';
        const hours = String(lastUpdateTime.getHours()).padStart(2, '0');
        const minutes = String(lastUpdateTime.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Header
                onRefresh={refreshPrices}
                refreshing={isRefreshing}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onShowProductHistory={(product) => setPriceHistoryModal({ open: true, product })}
            />
            <main className="min-h-[calc(100vh-80px)]">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
                    
                    {/* Stats Bar */}
                    <div className="mb-4 sm:mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                        {/* Total Products */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xl sm:text-2xl">📦</span>
                                <div>
                                    <p className="text-slate-400 text-[10px] sm:text-xs font-medium">Total Produtos</p>
                                    <p className="text-white font-bold text-lg sm:text-xl">{products.length}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Price Drops */}
                        <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xl sm:text-2xl">📉</span>
                                <div>
                                    <p className="text-slate-400 text-[10px] sm:text-xs font-medium">Preços em Queda</p>
                                    <p className="text-emerald-400 font-bold text-lg sm:text-xl">
                                        {products.filter(p => p.lastPrice && p.currentPrice < p.lastPrice).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Price Ups */}
                        <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xl sm:text-2xl">📈</span>
                                <div>
                                    <p className="text-slate-400 text-[10px] sm:text-xs font-medium">Preços Subindo</p>
                                    <p className="text-red-400 font-bold text-lg sm:text-xl">
                                        {products.filter(p => p.lastPrice && p.currentPrice > p.lastPrice).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Last Update */}
                        <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xl sm:text-2xl">🕐</span>
                                <div>
                                    <p className="text-slate-400 text-[10px] sm:text-xs font-medium">Última Atualização</p>
                                    <p className="text-amber-400 font-bold text-lg sm:text-xl">
                                        {lastUpdateTime ? formatUpdateTime() : '--:--'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Button */}
                    <div className="mb-4 sm:mb-6 grid md:grid-cols-2 gap-2 sm:gap-4">
                        <button
                            onClick={() => setShowAnalytics(true)}
                            className="p-3 sm:p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between hover:from-purple-500/20 hover:to-blue-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm sm:text-base">
                                    📊
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-semibold text-sm sm:text-base">Analytics</p>
                                    <p className="text-slate-400 text-xs sm:text-sm">Estatísticas de preços</p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        
                        <button
                            onClick={() => setShowTelegramSettings(true)}
                            className="p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between hover:from-blue-500/20 hover:to-cyan-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm sm:text-base">
                                    📱
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-semibold text-sm sm:text-base">Telegram</p>
                                    <p className="text-slate-400 text-xs sm:text-sm">Alertas instantâneos</p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Update Bar */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm sm:text-base">
                                🔄
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm sm:text-base">Atualização de Preços</p>
                                <p className="text-slate-400 text-xs sm:text-sm">
                                    {isRefreshing 
                                        ? 'Buscando preços no Mercado Livre...' 
                                        : 'Clique para buscar os preços mais recentes'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleRefreshClick}
                            disabled={isRefreshing}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 text-sm sm:text-base"
                        >
                            {isRefreshing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Atualizando...
                                </>
                            ) : (
                                <>🔄 Atualizar Agora</>
                            )}
                        </button>
                    </div>

                    <AddProduct onAdd={handleAddProduct} adding={isAddingProduct} />
                    
                    {isFetchError && (
                         <div className="rounded-2xl shadow-lg p-8 text-center bg-red-500/10 border border-red-500/30 text-red-400">
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

            {/* Email Verification Modal */}
            {emailVerificationModal.open && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                                <span className="text-5xl">✉️</span>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Limite Atingido
                            </h2>
                            
                            <p className="text-slate-400 mb-4">
                                O plano <strong className="text-amber-400">Gratuito</strong> permite monitorar até <strong className="text-amber-400">{emailVerificationModal.limit} produtos</strong>.
                            </p>
                            
                            <p className="text-slate-300 mb-6">
                                Verifique seu email para ativar sua conta e em breve teremos planos com mais recursos! 🚀
                            </p>

                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/settings"
                                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all text-center"
                                >
                                    Verificar Email →
                                </Link>
                                
                                <button
                                    onClick={() => setEmailVerificationModal({ open: false, limit: 4 })}
                                    className="w-full px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Onboarding Modal for new users */}
            {showOnboarding && (
                <OnboardingModal 
                    onClose={handleCloseOnboarding}
                    userName={user?.fullName}
                />
            )}

            {/* Analytics Dashboard Modal */}
            {showAnalytics && (
                <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
            )}

            {/* Telegram Settings Modal */}
            {showTelegramSettings && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <h3 className="text-xl font-bold text-white">⚙️ Configurações do Telegram</h3>
                            <button 
                                onClick={() => setShowTelegramSettings(false)} 
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <TelegramSettings />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}