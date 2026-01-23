import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function Header({ onRefresh, refreshing, searchTerm, onSearchChange, onShowProductHistory }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogout = () => {
    console.log('[INFO] Usuário fazendo logout');
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 to-slate-800 shadow-2xl backdrop-blur-md border-b border-slate-700/50">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-7xl">
        
        {/* Layout: Logo + Search + Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <img src="/logo_monitora.png" alt="MonitoraPreço" className="h-10 w-10 sm:h-14 sm:w-14 object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                MonitoraPreço
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Maximize seus lucros
              </p>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400"
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
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Limpar"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Search Button - Mobile */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 transition-all border border-slate-600"
              title="Buscar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notification Bell */}
            <NotificationBell onShowProductHistory={onShowProductHistory} />

            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 sm:px-4 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-semibold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-slate-600 hover:border-slate-500 whitespace-nowrap"
              title="Atualizar"
            >
              {refreshing ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
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
                className="p-2 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all border border-amber-400/50 hover:border-amber-300 flex items-center gap-1 sm:gap-2"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center text-xs sm:text-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase() || '👤'}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user?.fullName?.split(' ')[0] || 'Usuário'}
                </span>
                <svg className={`hidden sm:block w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <>
                  {/* Overlay para fechar menu */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl py-2 z-50 border border-slate-700">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="font-semibold text-white truncate">{user?.fullName || 'Usuário'}</p>
                      <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                    </div>
                    
                    {/* Menu Options */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-3"
                      >
                        <span>⚙️</span>
                        <span>Configurações</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings#password');
                        }}
                        className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-3"
                      >
                        <span>🔐</span>
                        <span>Alterar Senha</span>
                      </button>
                    </div>
                    
                    {/* Logout */}
                    <div className="border-t border-slate-700 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
                      >
                        <span>🚪</span>
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden mt-3 pb-1">
            <div className="relative">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400"
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
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                autoFocus
              />
              {searchTerm && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Limpar"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
