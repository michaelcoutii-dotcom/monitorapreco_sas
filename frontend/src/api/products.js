/**
 * API service functions for interacting with the product endpoints of the backend.
 */

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
 * Fetches all products for the logged-in user.
 * @returns {Promise<any[]>} A promise that resolves to an array of products.
 */
export const getProducts = async () => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found.');
    }

    const response = await fetch(`${getApiUrl()}/api/products`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

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
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found.');
    }

    const response = await fetch(`${getApiUrl()}/api/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add product and could not parse error response.' }));
        throw new Error(errorData.message || 'Failed to add product.');
    }

    return response.json();
};

/**
 * Deletes a product by its ID.
 * @param {number} productId - The ID of the product to delete.
 * @returns {Promise<void>} A promise that resolves when the product is deleted.
 */
export const deleteProduct = async (productId) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found.');
    }

    const response = await fetch(`${getApiUrl()}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
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
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found.');
    }

    const response = await fetch(`${getApiUrl()}/api/products/refresh`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
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

    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found.');
    }

    const response = await fetch(`${getApiUrl()}/api/products/${productId}/history`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch price history.');
    }

    return response.json();
};
