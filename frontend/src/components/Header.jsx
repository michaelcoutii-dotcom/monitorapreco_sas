import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Header({ onRefresh, refreshing, searchTerm, onSearchChange }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    console.log('[INFO] Usuário fazendo logout');
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-2xl backdrop-blur-md bg-opacity-95">
      <div className="container mx-auto px-[clamp(1rem,5vw,2rem)] py-[clamp(0.75rem,2vh,1.25rem)] max-w-7xl">
        
        {/* Layout: Logo + Search + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[clamp(0.75rem,3vw,1.5rem)]">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-[clamp(0.5rem,2vw,1rem)] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="p-[clamp(0.5rem,2vw,0.75rem)] rounded-xl shadow-lg bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 text-[clamp(1.25rem,4vw,1.75rem)]">
              📊
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[clamp(1.25rem,4vw,1.75rem)] font-bold tracking-tight text-white">
                MonitoraPreço
              </h1>
              <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] font-medium text-white/80">
                Rastreie preços
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md lg:mx-4 w-full sm:w-auto">
            <div className="relative group">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[clamp(1rem,2vw,1.25rem)] w-[clamp(1rem,2vw,1.25rem)] text-white/60 group-focus-within:text-white transition-colors"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-10 pr-10 py-[clamp(0.5rem,1.5vh,0.75rem)] rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm text-[clamp(0.875rem,2vw,1rem)] text-white placeholder-white/60 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/30 transition-all duration-200 hover:bg-white/30 hover:border-white/40"
              />
              {searchTerm && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors text-[clamp(0.875rem,2vw,1.125rem)]"
                  title="Limpar"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-[clamp(0.5rem,2vw,0.75rem)] justify-end flex-wrap">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.5rem,1.5vh,0.75rem)] rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] backdrop-blur-sm border border-white/20 hover:border-white/40 whitespace-nowrap min-h-[44px]"
              title="Atualizar"
            >
              {refreshing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Atualizando...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span className="hidden sm:inline">Atualizar</span>
                </>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.5rem,1.5vh,0.75rem)] rounded-xl bg-white/20 hover:bg-white/30 text-white text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold transition-all duration-300 border border-white/20 hover:border-white/40 min-h-[44px]"
              >
                👤 {user?.email?.split('@')[0] || 'Usuário'}
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl py-2 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
