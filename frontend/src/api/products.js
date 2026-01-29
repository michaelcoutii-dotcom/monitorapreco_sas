/**
 * API service functions for interacting with the product endpoints of the backend.
 */

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8081';

const getAuthToken = () => {
    try {
        // O token é armazenado diretamente na chave 'token'
        return localStorage.getItem('token');
    } catch (error) {
        console.error("Failed to get auth token from localStorage", error);
        return null;
    }
};

/**
 * Handle unauthorized responses (expired JWT)
 * Clears storage and redirects to login
 */
const handleUnauthorized = () => {
    console.warn('🔒 Token expirado ou inválido - redirecionando para login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Dispatch custom event so AuthContext can react
    window.dispatchEvent(new CustomEvent('auth:logout'));
    // Redirect to login
    if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
    }
};

/**
 * Wrapper for fetch that handles 401 errors
 */
const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
        handleUnauthorized();
        throw new Error('No authentication token found.');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });

    // Handle expired token
    if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    return response;
};

/**
 * Fetches all products for the logged-in user.
 * @returns {Promise<any[]>} A promise that resolves to an array of products.
 */
export const getProducts = async () => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/products`);

    if (!response.ok) {
        throw new Error('Failed to fetch products.');
    }

    return response.json();
};

/**
 * Adds a new product by URL.
 * @param {string} url - The URL of the product to add.
 * @returns {Promise<any>} A promise that resolves to the newly added product.
 */
export const addProduct = async (url) => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add product.' }));
        
        // Create custom error with additional data for email verification limit
        const error = new Error(errorData.message || errorData.error || 'Failed to add product.');
        error.code = errorData.code;
        error.limit = errorData.limit;
        error.currentCount = errorData.currentCount;
        throw error;
    }

    return response.json();
};

/**
 * Deletes a product by its ID.
 * @param {number} productId - The ID of the product to delete.
 * @returns {Promise<void>} A promise that resolves when the product is deleted.
 */
export const deleteProduct = async (productId) => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/products/${productId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('Failed to delete product.');
    }
};

/**
 * Triggers a background refresh of all product prices.
 * @returns {Promise<any>} A promise that resolves with the backend response.
 */
export const refreshPrices = async () => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/products/refresh`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error('Failed to trigger price refresh.');
    }

    return response.json();
};

/**
 * Fetches the price history for a specific product.
 * @param {number} productId - The ID of the product.
 * @returns {Promise<any[]>} A promise that resolves to the price history.
 */
export const getPriceHistory = async (productId) => {
    if (!productId) return Promise.resolve([]);

    const response = await fetchWithAuth(`${getApiUrl()}/api/products/${productId}/history`);

    if (!response.ok) {
        throw new Error('Failed to fetch price history.');
    }

    return response.json();
};

/**
 * Fetches price analytics for the authenticated user.
 * @param {number} days - Number of days to analyze (default 30).
 * @returns {Promise<any>} A promise that resolves to analytics data.
 */
export const getAnalytics = async (days = 30) => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/products/analytics?days=${days}`);

    if (!response.ok) {
        throw new Error('Failed to fetch analytics.');
    }

    return response.json();
};

/**
 * Cleans up duplicate price history entries.
 * @returns {Promise<any>} A promise that resolves to cleanup result.
 */
export const cleanupHistory = async () => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/products/cleanup-history`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error('Failed to cleanup history.');
    }

    return response.json();
};

// ========================================
// Telegram API
// ========================================

/**
 * Get Telegram integration status.
 */
export const getTelegramStatus = async () => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/telegram/status`);

    if (!response.ok) throw new Error('Failed to get Telegram status.');
    return response.json();
};

/**
 * Generate a code to link Telegram account.
 */
export const generateTelegramCode = async () => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/telegram/generate-code`, {
        method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to generate Telegram code.');
    return response.json();
};

/**
 * Unlink Telegram account.
 */
export const unlinkTelegram = async () => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/telegram/unlink`, {
        method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to unlink Telegram.');
    return response.json();
};

/**
 * Toggle Telegram notifications.
 */
export const toggleTelegramNotifications = async (enabled) => {
    const response = await fetchWithAuth(`${getApiUrl()}/api/telegram/toggle`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
    });

    if (!response.ok) throw new Error('Failed to toggle Telegram notifications.');
    return response.json();
};
