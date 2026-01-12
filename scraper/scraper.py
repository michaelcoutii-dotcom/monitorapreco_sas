"""
Mercado Livre Price Scraper
Uses Playwright to extract product title and price from a given URL.
"""

import re
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout


def normalize_price(price_str: str) -> float | None:
    """
    Normalize a Brazilian price string to a float.
    
    Examples:
        "R$ 1.234,56" -> 1234.56
        "1.234,56" -> 1234.56
        "R$1234,56" -> 1234.56
    
    Returns None if conversion fails.
    """
    if not price_str:
        return None
    
    try:
        # Remove currency symbol and whitespace
        cleaned = price_str.replace("R$", "").strip()
        
        # Remove thousand separators (dots in Brazilian format)
        cleaned = cleaned.replace(".", "")
        
        # Convert decimal separator (comma to dot)
        cleaned = cleaned.replace(",", ".")
        
        # Remove any remaining non-numeric characters except dot
        cleaned = re.sub(r"[^\d.]", "", cleaned)
        
        return float(cleaned)
    except (ValueError, AttributeError):
        return None


def scrape_mercadolivre(url: str) -> dict | None:
    """
    Scrape product title and price from a Mercado Livre product page.
    
    Args:
        url: The full URL of the Mercado Livre product page.
        
    Returns:
        A dictionary with 'title' and 'price' keys, or None if scraping fails.
        
    Example:
        >>> result = scrape_mercadolivre("https://www.mercadolivre.com.br/produto-exemplo")
        >>> print(result)
        {'title': 'Product Name', 'price': 1234.56}
    """
    browser = None
    
    try:
        # Initialize Playwright
        playwright = sync_playwright().start()
        
        # Launch browser in headless mode
        browser = playwright.chromium.launch(headless=True)
        
        # Create a new browser context with a realistic user agent
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        # Create a new page
        page = context.new_page()
        
        # Navigate to the URL with timeout (30 seconds)
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        
        # Wait a moment for dynamic content to load
        page.wait_for_timeout(2000)
        
        # ========================================
        # ⚠️ ATENÇÃO: SELETORES CSS
        # Os seletores abaixo podem mudar.
        # Abra o Mercado Livre → F12 → Inspecione
        # o título e preço e ajuste se necessário.
        # ========================================
        
        # Extract product title
        # Selector: h1 tag with class containing "ui-pdp-title"
        title_element = page.query_selector("h1.ui-pdp-title")
        if not title_element:
            # Fallback selector
            title_element = page.query_selector("h1")
        
        title = title_element.inner_text().strip() if title_element else None
        
        # Extract product price
        # Selector: Price container with fraction part
        # Mercado Livre splits price into integer and cents
        price_int_element = page.query_selector(".andes-money-amount__fraction")
        price_cents_element = page.query_selector(".andes-money-amount__cents")
        
        price = None
        if price_int_element:
            price_int = price_int_element.inner_text().strip()
            price_cents = price_cents_element.inner_text().strip() if price_cents_element else "00"
            
            # Combine integer and cents parts
            price_str = f"{price_int},{price_cents}"
            price = normalize_price(price_str)
        
        # Validate that we got both title and price
        if not title or price is None:
            print(f"[WARN] Could not extract all data. Title: {title}, Price: {price}")
            return None
        
        return {
            "title": title,
            "price": price
        }
        
    except PlaywrightTimeout:
        print(f"[ERROR] Timeout while loading page: {url}")
        return None
    except Exception as e:
        print(f"[ERROR] Failed to scrape {url}: {str(e)}")
        return None
    finally:
        # Ensure browser is always closed
        if browser:
            browser.close()
            playwright.stop()


# ========================================
# TEST BLOCK - Run this file directly to test
# ========================================
if __name__ == "__main__":
    # Example URL - replace with a real Mercado Livre product URL
    test_url = "https://www.mercadolivre.com.br/cadeira-escritorio-ergonmica-sensetup-cosy-t03-preto-mesh-reclinavel-com-apoio-de-bracos-3d/p/MLB24578456?pdp_filters=item_id:MLB4325236683#is_advertising=true&searchVariation=MLB24578456&backend_model=search-backend&position=1&search_layout=grid&type=pad&tracking_id=aaa1abae-f179-4fe7-a3a8-0e0c24a268d3&ad_domain=VQCATCORE_LST&ad_position=1&ad_click_id=MTkxMDVmM2UtYWI1OC00NjlhLTk3MmYtMjVlZDFmYWExM2Ez"
    
    print("=" * 50)
    print("Testing Mercado Livre Scraper")
    print("=" * 50)
    print(f"URL: {test_url}")
    print("-" * 50)
    
    result = scrape_mercadolivre(test_url)
    
    if result:
        print(f"✅ Success!")
        print(f"   Title: {result['title']}")
        print(f"   Price: R$ {result['price']:.2f}")
    else:
        print("❌ Failed to scrape product data")
    
    print("=" * 50)
