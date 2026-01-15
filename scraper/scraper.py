"""
Mercado Livre Price Scraper (Asynchronous)
Uses a persistent Playwright browser instance to efficiently extract product data.
"""
import asyncio
import re
from playwright.async_api import async_playwright, Playwright, Browser, Page, TimeoutError as PlaywrightTimeout

# List of resource types to block for faster scraping
BLOCKED_RESOURCE_TYPES = [
  "image",
  "stylesheet",
  "font",
  "media",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "imageset",
]

def normalize_price(price_str: str) -> float | None:
    """Normalize a Brazilian price string to a float."""
    if not price_str:
        return None
    try:
        cleaned = re.sub(r'[^\d,]', '', price_str).replace(",", ".")
        return float(cleaned)
    except (ValueError, AttributeError):
        return None

class Scraper:
    """
    A class to manage a persistent Playwright browser instance for scraping.
    The browser is launched once and reused across multiple scraping requests.
    """
    playwright: Playwright = None
    browser: Browser = None

    @classmethod
    async def initialize(cls):
        """Initializes Playwright and launches a persistent browser instance."""
        if cls.browser and cls.browser.is_connected():
            print("[INFO] Scraper already initialized.")
            return
        
        cls.playwright = await async_playwright().start()
        cls.browser = await cls.playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-first-run",
                "--no-default-browser-check",
            ]
        )
        print("[INFO] Persistent browser instance launched.")

    @classmethod
    async def close(cls):
        """Closes the browser and stops Playwright."""
        if cls.browser and cls.browser.is_connected():
            await cls.browser.close()
        if cls.playwright:
            await cls.playwright.stop()
        print("[INFO] Browser instance closed.")
        
    @classmethod
    def is_initialized(cls) -> bool:
        """Check if the browser is running."""
        return cls.browser is not None and cls.browser.is_connected()

    @staticmethod
    async def _block_unnecessary_requests(page: Page):
        """Set up routing to block non-essential resources."""
        await page.route("**/*", lambda route: route.abort() if route.request.resource_type in BLOCKED_RESOURCE_TYPES else route.continue_())

    @classmethod
    async def scrape_mercadolivre(cls, url: str, timeout: int = 20000) -> dict | None:
        """
        Scrapes product data from a Mercado Livre URL using the persistent browser.
        """
        if not cls.is_initialized():
            raise RuntimeError("Scraper is not initialized. Call Scraper.initialize() first.")

        context = None
        try:
            # Create a new, isolated browser context for this request
            context = await cls.browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ignore_https_errors=True
            )
            page = await context.new_page()

            # Block unnecessary assets
            await cls._block_unnecessary_requests(page)

            print(f"[INFO] Navigating to {url}")
            await page.goto(url, timeout=timeout, wait_until="domcontentloaded")

            # Wait for the main price or title to appear, which is more reliable than a fixed timeout
            await page.wait_for_selector("h1.ui-pdp-title, .andes-money-amount__fraction", timeout=10000)

            # Extract title
            title_element = await page.query_selector("h1.ui-pdp-title")
            title = await title_element.inner_text() if title_element else "Title not found"
            title = title.strip()

            # Extract image URL
            image_url = None
            image_element = await page.query_selector("figure.ui-pdp-gallery__figure img")
            if image_element:
                image_url = await image_element.get_attribute("src")

            # Extract price
            price_int_element = await page.query_selector(".andes-money-amount__fraction")
            price_cents_element = await page.query_selector(".andes-money-amount__cents")
            price = None
            if price_int_element:
                price_int = await price_int_element.inner_text()
                price_cents = await price_cents_element.inner_text() if price_cents_element else "00"
                price_str = f"{price_int},{price_cents}"
                price = normalize_price(price_str)
            
            if not title or price is None:
                print(f"[WARN] Could not extract all data. Title: {title}, Price: {price}")
                return None

            print(f"[INFO] ✅ Scrape successful: {title} - R$ {price:.2f}")
            return {"title": title, "price": price, "imageUrl": image_url}

        except PlaywrightTimeout:
            print(f"[ERROR] Timeout while processing page: {url}")
            return None
        except Exception as e:
            print(f"[ERROR] Failed to scrape {url}: {str(e)}")
            return None
        finally:
            if context:
                await context.close()


# ========================================
# TEST BLOCK - Run this file directly to test
# ========================================
async def main():
    test_url = "https://www.mercadolivre.com.br/cadeira-escritorio-ergonmica-sensetup-cosy-t03-preto-mesh-reclinavel-com-apoio-de-bracos-3d/p/MLB24578456"
    
    print("=" * 50)
    print("Testing Async Mercado Livre Scraper")
    print("=" * 50)
    
    await Scraper.initialize()
    
    print(f"URL: {test_url}")
    print("-" * 50)
    
    result = await Scraper.scrape_mercadolivre(test_url)
    
    if result:
        print("✅ Success!")
        print(f"   Title: {result['title']}")
        print(f"   Price: R$ {result['price']:.2f}")
        print(f"   Image URL: {result['imageUrl']}")
    else:
        print("❌ Failed to scrape product data")
    
    await Scraper.close()
    
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())