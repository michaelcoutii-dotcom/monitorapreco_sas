"""
Mercado Livre Price Scraper (Asynchronous)
Uses a persistent Playwright browser instance to efficiently extract product data.

PROTEÇÕES IMPLEMENTADAS:
1. Múltiplos seletores fallback para cada elemento
2. User-Agents rotativos e realistas
3. Delays humanos aleatórios
4. Retry com exponential backoff
5. Detecção de bloqueio/captcha
6. Logs detalhados para diagnóstico
"""
import asyncio
import re
import random
from datetime import datetime
from playwright.async_api import async_playwright, Playwright, Browser, Page, TimeoutError as PlaywrightTimeout

# List of resource types to block for faster scraping
# NOTE: Não bloquear 'image' para poder pegar a URL da imagem do produto
BLOCKED_RESOURCE_TYPES = [
  "stylesheet",
  "font",
  "media",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "imageset",
]

# Retry configuration (otimizado para velocidade)
MAX_RETRIES = 2
INITIAL_RETRY_DELAY = 0.2  # seconds

# Pool de User-Agents realistas (Chrome Windows atualizado - Jan 2026)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
]

# Contador de requisições para estatísticas
class ScraperStats:
    total_requests = 0
    successful_requests = 0
    failed_requests = 0
    blocked_requests = 0
    last_success_time = None
    
    @classmethod
    def log_success(cls):
        cls.total_requests += 1
        cls.successful_requests += 1
        cls.last_success_time = datetime.now()
    
    @classmethod
    def log_failure(cls, blocked=False):
        cls.total_requests += 1
        cls.failed_requests += 1
        if blocked:
            cls.blocked_requests += 1
    
    @classmethod
    def get_stats(cls):
        success_rate = (cls.successful_requests / cls.total_requests * 100) if cls.total_requests > 0 else 0
        return {
            "total": cls.total_requests,
            "successful": cls.successful_requests,
            "failed": cls.failed_requests,
            "blocked": cls.blocked_requests,
            "success_rate": f"{success_rate:.1f}%",
            "last_success": cls.last_success_time.isoformat() if cls.last_success_time else None
        }

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
    async def scrape_mercadolivre(cls, url: str, timeout: int = 6000) -> dict | None:
        """
        Scrapes product data from a Mercado Livre URL using the persistent browser.
        Optimized for MAXIMUM SPEED with minimal timeouts and direct selectors.
        """
        for attempt in range(MAX_RETRIES):
            result = await cls._scrape_attempt(url, timeout, attempt)
            if result is not None:
                return result
            
            # If this wasn't the last attempt, wait before retrying
            if attempt < MAX_RETRIES - 1:
                wait_time = INITIAL_RETRY_DELAY * (2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
                print(f"[INFO] 🔄 Tentativa {attempt + 1} falhou. Aguardando {wait_time}s antes de tentar novamente...")
                await asyncio.sleep(wait_time)
        
        print(f"[ERROR] ❌ Scrape falhou após {MAX_RETRIES} tentativas para {url}")
        return None

    @classmethod
    async def _scrape_attempt(cls, url: str, timeout: int, attempt_num: int) -> dict | None:
        """
        Internal method that performs a single scraping attempt.
        Includes human-like delays and captcha detection.
        """
        if not cls.is_initialized():
            raise RuntimeError("Scraper is not initialized. Call Scraper.initialize() first.")

        context = None
        try:
            # Seleciona User-Agent aleatório para parecer mais humano
            user_agent = random.choice(USER_AGENTS)
            
            # Create a new, isolated browser context for this request
            context = await cls.browser.new_context(
                user_agent=user_agent,
                ignore_https_errors=True,
                viewport={"width": 1920, "height": 1080},
                locale="pt-BR",
            )
            page = await context.new_page()

            # Block unnecessary assets
            await cls._block_unnecessary_requests(page)

            print(f"[INFO] [Tentativa {attempt_num + 1}/{MAX_RETRIES}] Navegando para {url}")
            await page.goto(url, timeout=timeout, wait_until="domcontentloaded")
            
            # DELAY MÍNIMO: 300-500ms (mais rápido, ainda seguro)
            await page.wait_for_timeout(random.randint(300, 500))
            
            # DETECÇÃO DE BLOQUEIO/CAPTCHA - melhorada para evitar falsos positivos
            page_content = await page.content()
            page_title = await page.title()
            
            # Detectar bloqueio REAL baseado no título ou conteúdo específico
            real_block_indicators = [
                "captcha",
                "não é um robô",
                "verify you are human",
                "acesso negado",
                "access denied"
            ]
            
            # Verificação rápida de bloqueio (só no título)
            is_blocked = any(ind.lower() in page_title.lower() for ind in real_block_indicators)
            if is_blocked:
                print(f"[WARN] ⚠️ Bloqueio detectado no título")
                ScraperStats.log_failure(blocked=True)
                return None

            # Extração rápida de preço (seletor único mais comum)
            price = None
            price_element = await page.query_selector(".andes-money-amount__fraction")
            
            if price_element:
                price_int = await price_element.inner_text()
                price_cents_element = await page.query_selector(".andes-money-amount__cents")
                price_cents = await price_cents_element.inner_text() if price_cents_element else "00"
                price = normalize_price(f"{price_int},{price_cents}")

            # Extração rápida de título
            title = None
            title_element = await page.query_selector("h1")
            if title_element:
                title = (await title_element.inner_text()).strip()

            # Extração de imagem - múltiplos seletores para garantir
            image_url = None
            image_selectors = [
                "figure.ui-pdp-gallery__figure img[src*='http']",
                ".ui-pdp-image--gallery img[src*='http']",
                "img.ui-pdp-image[src*='mlstatic']",
                "img[data-zoom][src*='http']",
                "img[src*='mlstatic.com']",
            ]
            
            for selector in image_selectors:
                try:
                    image_element = await page.query_selector(selector)
                    if image_element:
                        src = await image_element.get_attribute("src")
                        # Verificar se é uma URL válida de imagem
                        if src and src.startswith("http") and "mlstatic" in src:
                            image_url = src
                            print(f"[DEBUG] 📷 Imagem encontrada: {image_url[:60]}...")
                            break
                except:
                    continue
            
            # Fallback: tentar pegar qualquer imagem grande do produto
            if not image_url:
                try:
                    all_images = await page.query_selector_all("img[src*='mlstatic']")
                    for img in all_images[:5]:
                        src = await img.get_attribute("src")
                        if src and "http" in src and ("D_NQ" in src or "O_" in src):
                            image_url = src
                            print(f"[DEBUG] 📷 Imagem (fallback): {image_url[:60]}...")
                            break
                except:
                    pass
            
            if not title or price is None:
                print(f"[WARN] Dados incompletos. Título: {title}, Preço: {price}")
                ScraperStats.log_failure()
                return None

            print(f"[OK] ✅ {title[:40]}... - R$ {price:.2f}")
            ScraperStats.log_success()
            return {"title": title, "price": price, "imageUrl": image_url}

        except PlaywrightTimeout:
            print(f"[WARN] [Tentativa {attempt_num + 1}] Timeout ao processar página: {url}")
            ScraperStats.log_failure()
            return None
        except Exception as e:
            print(f"[WARN] [Tentativa {attempt_num + 1}] Falha ao fazer scrape de {url}: {str(e)}")
            ScraperStats.log_failure()
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