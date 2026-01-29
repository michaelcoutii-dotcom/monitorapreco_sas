import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      console.log('[INFO] 🔐 Restaurando sessão do localStorage');
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Listen for forced logout events (e.g., from API when token expires)
  useEffect(() => {
    const handleForcedLogout = () => {
      console.log('[INFO] 🔒 Logout forçado - token expirado');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = (authData) => {
    console.log('[INFO] 🔓 Usuário logado:', authData.email);
    const userData = {
      id: authData.id,
      email: authData.email,
      fullName: authData.fullName,
      emailVerified: authData.emailVerified || false,
    };
    setToken(authData.token);
    setUser(userData);
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    console.log('[INFO] 🔒 Usuário deslogado');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (newData) => {
    console.log('[INFO] 👤 Atualizando dados do usuário');
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
