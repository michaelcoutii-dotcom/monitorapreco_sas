"""
Sistema de Cache Simples para Scraper
Evita requisições repetidas para a mesma URL em curto período
"""
import time
import threading
from typing import Optional, Dict, Any
from datetime import datetime

class SimpleCache:
    """Cache em memória com TTL"""
    
    def __init__(self, ttl_seconds: int = 3600):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
    
    def _normalize_url(self, url: str) -> str:
        """Normaliza URL para usar como chave"""
        # Remove parâmetros de tracking, mantém só o essencial
        if '#' in url:
            url = url.split('#')[0]
        return url.lower().strip()
    
    def get(self, url: str) -> Optional[Dict[str, Any]]:
        """Retorna dados cacheados se ainda válidos"""
        key = self._normalize_url(url)
        
        with self._lock:
            if key not in self._cache:
                return None
            
            entry = self._cache[key]
            
            # Verificar se expirou
            if time.time() - entry['timestamp'] > self._ttl:
                del self._cache[key]
                return None
            
            print(f"[CACHE] ✅ Hit para: {url[:50]}...")
            return entry['data']
    
    def set(self, url: str, data: Dict[str, Any]):
        """Armazena dados no cache"""
        key = self._normalize_url(url)
        with self._lock:
            self._cache[key] = {
                'data': data,
                'timestamp': time.time(),
                'cached_at': datetime.now().isoformat()
            }
        print(f"[CACHE] 💾 Armazenado: {url[:50]}...")
    
    def clear(self):
        """Limpa todo o cache"""
        with self._lock:
            self._cache.clear()
        print("[CACHE] 🗑️ Cache limpo")
    
    def stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache"""
        now = time.time()
        valid_entries = sum(1 for e in self._cache.values() if now - e['timestamp'] <= self._ttl)
        
        return {
            "total_entries": len(self._cache),
            "valid_entries": valid_entries,
            "expired_entries": len(self._cache) - valid_entries,
            "ttl_seconds": self._ttl
        }


# Importar TTL da configuração
from config import CACHE_TTL_SECONDS

# Instância global do cache
scrape_cache = SimpleCache(ttl_seconds=CACHE_TTL_SECONDS)
