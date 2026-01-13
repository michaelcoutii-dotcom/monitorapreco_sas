/**
 * Clear all localStorage and sessionStorage
 * Call this on app startup to reset state
 */
export const clearAllStorage = async () => {
  try {
    // Clear localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');

    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');

    // Clear IndexedDB (if used)
    if (window.indexedDB) {
      const dbs = await window.indexedDB.databases?.() || [];
      dbs.forEach(db => {
        window.indexedDB.deleteDatabase(db.name);
      });
      console.log('✅ IndexedDB cleared');
    }
  } catch (e) {
    console.warn('⚠️ Error clearing storage:', e);
  }
};

export const debugAPI_URL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  console.log('🔍 DEBUG API_URL:', {
    'import.meta.env.VITE_API_URL': import.meta.env.VITE_API_URL,
    'fallback': 'http://localhost:8081',
    'actual_used': apiUrl
  });
  return apiUrl;
};
