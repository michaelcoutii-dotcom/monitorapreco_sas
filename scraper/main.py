"""
Mercado Livre Scraper API (Async)
FastAPI wrapper for the asynchronous scraping function.
"""

from contextlib import asynccontextmanager
import asyncio
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from scraper import Scraper


# ========================================
# Application Lifecycle (Lifespan)
# ========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the FastAPI application.
    """
    print("[INFO] Application startup: Initializing scraper...")
    # Initialize the scraper on startup. This will launch a persistent browser instance.
    await Scraper.initialize()
    print("[INFO] Scraper initialized successfully.")
    
    yield  # The application is now running
    
    print("[INFO] Application shutdown: Closing scraper...")
    # Close the scraper resources (browser) on shutdown.
    await Scraper.close()
    print("[INFO] Scraper closed successfully.")


# ========================================
# FastAPI App Setup
# ========================================

app = FastAPI(
    title="Mercado Livre Scraper API",
    description="Asynchronous API to extract title, price, and image from Mercado Livre products.",
    version="2.0.0",
    lifespan=lifespan  # Use the lifespan context manager
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


# ========================================
# Endpoints
# ========================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Mercado Livre Scraper API",
        "version": "2.0.0",
        "scraper_status": "initialized" if Scraper.is_initialized() else "uninitialized"
    }


@app.post("/scrape", response_model=ScrapeResponse, responses={422: {"model": ErrorResponse}})
async def scrape_product(request: ScrapeRequest):
    """
    Asynchronously scrapes a Mercado Livre product page.
    """
    if "mercadolivre" not in request.url and "mercadolibre" not in request.url:
        raise HTTPException(
            status_code=422,
            detail="URL must be from Mercado Livre (mercadolivre.com.br or mercadolibre.com)"
        )
    
    try:
        # Use the Scraper class to perform the scraping.
        result = await Scraper.scrape_mercadolivre(request.url)
        
        if result is None:
            raise HTTPException(
                status_code=422,
                detail="Failed to scrape product data. The page may be unavailable or selectors need updating."
            )
        
        return ScrapeResponse(**result)

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Scraping timed out. The page took too long to load or process."
        )
    except Exception as e:
        print(f"[ERROR] An unexpected error occurred during scraping: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An internal server error occurred: {e}"
        )

# ========================================
# Run directly for testing
# ========================================

def run_server():
    """
    Runs the Uvicorn server programmatically.
    This function is the target for watchgod.
    """
    import uvicorn
    # reload=False is crucial to avoid the asyncio/Playwright conflict on Windows.
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, lifespan="on")

if __name__ == "__main__":
    # This block allows running the server directly with `python main.py`.
    # The recommended way for auto-reload development is using watchgod:
    # python -m watchgod main.run_server
    run_server()