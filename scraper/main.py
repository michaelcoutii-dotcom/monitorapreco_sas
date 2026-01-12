"""
Mercado Livre Scraper API
FastAPI wrapper for the scraping function.

Run with:
    uvicorn main:app --reload

Or:
    C:/Users/Michael/Desktop/sas_mercado_livre/.venv/Scripts/python.exe -m uvicorn main:app --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional

from scraper import scrape_mercadolivre


# ========================================
# Pydantic Models (Request/Response Contract)
# ========================================

class ScrapeRequest(BaseModel):
    """Request model for the /scrape endpoint."""
    url: str
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "url": "https://www.mercadolivre.com.br/produto-exemplo"
                }
            ]
        }
    }


class ScrapeResponse(BaseModel):
    """Response model for successful scraping."""
    title: str
    price: float
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "Cadeira Escritório Ergonômica",
                    "price": 3700.63
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """Response model for errors."""
    error: str
    detail: Optional[str] = None


# ========================================
# FastAPI App Setup
# ========================================

app = FastAPI(
    title="Mercado Livre Scraper API",
    description="API para extrair título e preço de produtos do Mercado Livre",
    version="1.0.0"
)

# CORS Middleware - Allow all origins (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# Endpoints
# ========================================

@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Mercado Livre Scraper API",
        "version": "1.0.0"
    }


@app.post("/scrape", response_model=ScrapeResponse, responses={422: {"model": ErrorResponse}})
def scrape_product(request: ScrapeRequest):
    """
    Scrape a Mercado Livre product page.
    
    - **url**: Full URL of the Mercado Livre product page
    
    Returns the product title and current price.
    """
    # Validate URL contains mercadolivre
    if "mercadolivre" not in request.url and "mercadolibre" not in request.url:
        raise HTTPException(
            status_code=422,
            detail="URL must be from Mercado Livre (mercadolivre.com.br or mercadolibre.com)"
        )
    
    # Call the scraper
    result = scrape_mercadolivre(request.url)
    
    # Handle scraping failure
    if result is None:
        raise HTTPException(
            status_code=422,
            detail="Failed to scrape product data. The page may be unavailable or the selectors may have changed."
        )
    
    return ScrapeResponse(
        title=result["title"],
        price=result["price"]
    )


# ========================================
# Run directly (alternative to uvicorn command)
# ========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
