"""
Mercado Livre Product API
API para buscar dados de produtos do Mercado Livre.

MODOS DE OPERAÇÃO (em ordem de prioridade):
1. API Pública ML (padrão) - Rápido, sem bloqueios, gratuito
2. Scraping (fallback) - Quando a API falha
"""

from contextlib import asynccontextmanager
import asyncio
import sys
import os
import httpx

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from cache import scrape_cache
from config import CACHE_ENABLED, get_config_summary

# Importar API do ML como método principal (sem bloqueios!)
try:
    from ml_api import get_product_info, MLApiStats, fetch_product_public
    ML_API_AVAILABLE = True
    print("[INFO] ✅ ML API disponível (inclui modo público sem auth)", flush=True)
except ImportError as e:
    ML_API_AVAILABLE = False
    print(f"[WARN] ML API não disponível: {e}", flush=True)

# Importar scraper como fallback
try:
    from scraper import Scraper, ScraperStats
    SCRAPER_AVAILABLE = True
except ImportError:
    SCRAPER_AVAILABLE = False
    print("[ERRO] Scraper não disponível!", flush=True)


# ========================================
# Application Lifecycle (Lifespan)
# ========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the FastAPI application.
    """
    print("[INFO] Application startup...", flush=True)
    
    # Inicializar scraper
    if SCRAPER_AVAILABLE:
        print("[INFO] Inicializando scraper Playwright...", flush=True)
        try:
            await Scraper.initialize()
            print("[INFO] ✅ Scraper inicializado com sucesso!", flush=True)
        except Exception as e:
            print(f"[WARN] ⚠️ Falha ao inicializar scraper: {e}", flush=True)
    
    yield  # The application is now running
    
    print("[INFO] Application shutdown...", flush=True)
    if SCRAPER_AVAILABLE:
        try:
            await Scraper.close()
            print("[INFO] Scraper fechado.", flush=True)
        except:
            pass


# ========================================
# FastAPI App Setup
# ========================================

app = FastAPI(
    title="Mercado Livre Product API",
    description="API para buscar dados de produtos do Mercado Livre usando a API oficial.",
    version="3.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# Pydantic Models
# ========================================

class ScrapeRequest(BaseModel):
    url: str

class ScrapeResponse(BaseModel):
    title: str
    price: float
    imageUrl: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


def clean_mercadolivre_url(url: str) -> str:
    """
    Limpa a URL do Mercado Livre:
    - Remove parâmetros de tracking desnecessários
    - Corrige URLs duplicadas
    """
    from urllib.parse import urlparse, parse_qs, urlencode
    
    # Detectar URL duplicada (se tiver http duas vezes)
    if url.count('https://') > 1 or url.count('http://') > 1:
        parts = url.split('https://')
        if len(parts) > 2:
            url = 'https://' + parts[1].split('https://')[0]
        parts = url.split('http://')
        if len(parts) > 2:
            url = 'http://' + parts[1].split('http://')[0]
    
    # Remover fragmento (tudo depois de #)
    if '#' in url:
        url = url.split('#')[0]
    
    # Parse a URL
    parsed = urlparse(url)
    
    # Manter apenas parâmetros essenciais
    essential_params = ['searchVariation', 'pdp_filters']
    query_params = parse_qs(parsed.query)
    filtered_params = {k: v[0] for k, v in query_params.items() if k in essential_params}
    
    # Reconstruir URL limpa
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if filtered_params:
        clean_url += '?' + urlencode(filtered_params)
    
    return clean_url


# ========================================
# Endpoints
# ========================================

@app.get("/")
async def root():
    """Health check endpoint."""
    config = get_config_summary()
    return {
        "status": "online",
        "service": "Mercado Livre Scraper API",
        "version": "3.1.0",
        "mode": "ML API (primary) + Playwright Scraper (fallback)",
        "ml_api_available": ML_API_AVAILABLE,
        "scraper_available": SCRAPER_AVAILABLE,
        "config": config
    }


@app.get("/stats")
async def get_stats():
    """
    Retorna estatísticas de uso.
    """
    cache_stats = scrape_cache.stats()
    
    ml_api_stats = None
    if ML_API_AVAILABLE:
        ml_api_stats = MLApiStats.get_stats()
    
    scraper_stats = None
    if SCRAPER_AVAILABLE:
        scraper_stats = ScraperStats.get_stats()
    
    return {
        "cache": cache_stats,
        "ml_api": ml_api_stats,
        "scraper": scraper_stats
    }


@app.get("/health")
async def health_check():
    """
    Health check detalhado.
    """
    return {
        "healthy": ML_API_AVAILABLE or SCRAPER_AVAILABLE,
        "mode": "ML API (primary) + Playwright Scraper (fallback)",
        "ml_api_available": ML_API_AVAILABLE,
        "scraper_available": SCRAPER_AVAILABLE
    }


@app.post("/scrape", response_model=ScrapeResponse, responses={422: {"model": ErrorResponse}})
async def scrape_product(request: ScrapeRequest):
    """
    Busca dados de um produto do Mercado Livre.
    
    Fluxo:
    1. Verifica cache primeiro
    2. Tenta API oficial do ML (mais confiável, sem bloqueios)
    3. Fallback: scraping com Playwright
    """
    if "mercadolivre" not in request.url and "mercadolibre" not in request.url:
        raise HTTPException(
            status_code=422,
            detail="URL must be from Mercado Livre (mercadolivre.com.br or mercadolibre.com)"
        )
    
    # Limpar URL
    clean_url = clean_mercadolivre_url(request.url)
    print(f"[INFO] URL: {clean_url[:80]}...", flush=True)
    
    # 1. Verificar cache primeiro
    if CACHE_ENABLED:
        cached = scrape_cache.get(clean_url)
        if cached:
            print(f"[CACHE] ✅ Hit: {clean_url[:50]}...", flush=True)
            return ScrapeResponse(**cached)
    
    # 2. PRIORIDADE: Usar API oficial do ML (sem bloqueios!)
    if ML_API_AVAILABLE:
        print(f"[ML_API] 🔍 Buscando via API oficial...", flush=True)
        try:
            result = await get_product_info(clean_url)
            if result:
                print(f"[ML_API] ✅ Sucesso! {result.get('title', '')[:40]}...", flush=True)
                if CACHE_ENABLED:
                    scrape_cache.set(clean_url, result)
                return ScrapeResponse(**result)
            else:
                print(f"[ML_API] ⚠️ API não retornou dados, tentando scraper...", flush=True)
        except Exception as e:
            print(f"[ML_API] ❌ Erro: {e}", flush=True)
    
    # 3. Fallback: Usar scraping com Playwright
    if SCRAPER_AVAILABLE:
        print(f"[SCRAPER] 🔍 Buscando via Playwright (fallback)...", flush=True)
        try:
            result = await Scraper.scrape_mercadolivre(clean_url)
            if result:
                print(f"[SCRAPER] 📷 ImageURL: {result.get('imageUrl', 'NENHUMA')[:80] if result.get('imageUrl') else 'NENHUMA'}...", flush=True)
                if CACHE_ENABLED:
                    scrape_cache.set(clean_url, result)
                return ScrapeResponse(**result)
        except Exception as e:
            print(f"[SCRAPER] ❌ Erro: {e}", flush=True)
    
    # Todos os métodos falharam
    raise HTTPException(
        status_code=422,
        detail="Não foi possível obter os dados do produto. Verifique se a URL está correta."
    )


# ========================================
# Cache Management Endpoints
# ========================================

@app.get("/cache/stats")
async def get_cache_stats():
    """Retorna estatísticas do cache."""
    return scrape_cache.stats()


@app.delete("/cache/clear")
async def clear_cache():
    """Limpa todo o cache."""
    scrape_cache.clear()
    return {"message": "Cache limpo com sucesso"}


# ========================================
# Run directly for testing
# ========================================

def run_server():
    """
    Runs the Uvicorn server programmatically.
    """
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, lifespan="on")


if __name__ == "__main__":
    run_server()
