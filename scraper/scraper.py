"""
Mercado Livre Price Scraper (Asynchronous)
Uses a persistent Playwright browser instance to efficiently extract product data.

-- ATENÇÃO --
Este scraper (Playwright) é um método de fallback e é SENSÍVEL a bloqueios
e CAPTCHAs do Mercado Livre. Para uma operação estável em produção,
é ALTAMENTE RECOMENDADO configurar o método principal via API oficial.
Veja o README.md para mais detalhes sobre como configurar as credenciais da API.
-- ATENÇÃO --

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
import os
from datetime import datetime
from playwright.async_api import async_playwright, Playwright, Browser, Page, TimeoutError as PlaywrightTimeout
from playwright_stealth import stealth_async

# --- Adicionado para persistência de cookies ---
COOKIES_FILE = "cookies.json"
# ---------------------------------------------

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
MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 1  # seconds

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
            print("[INFO] Scraper already initialized.", flush=True)
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
        print("[INFO] Persistent browser instance launched.", flush=True)

    @classmethod
    async def close(cls):
        """Closes the browser and stops Playwright."""
        if cls.browser and cls.browser.is_connected():
            await cls.browser.close()
        if cls.playwright:
            await cls.playwright.stop()
        print("[INFO] Browser instance closed.", flush=True)
        
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
                print(f"[INFO] 🔄 Tentativa {attempt + 1} falhou. Aguardando {wait_time}s antes de tentar novamente...", flush=True)
                await asyncio.sleep(wait_time)
        
        print(f"[ERROR] ❌ Scrape falhou após {MAX_RETRIES} tentativas para {url}", flush=True)
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
            user_agent = random.choice(USER_AGENTS)
            
            # --- Lógica de Cookies ---
            storage_state = COOKIES_FILE if os.path.exists(COOKIES_FILE) else None
            
            context = await cls.browser.new_context(
                user_agent=user_agent,
                ignore_https_errors=True,
                viewport={"width": 1920, "height": 1080},
                locale="pt-BR",
                storage_state=storage_state  # Carrega cookies
            )
            # -------------------------

            page = await context.new_page()
            
            # Aplica patches de stealth para evitar detecção
            await stealth_async(page)

            await cls._block_unnecessary_requests(page)

            print(f"[INFO] [Tentativa {attempt_num + 1}/{MAX_RETRIES}] Navegando para {url}", flush=True)
            await page.goto(url, timeout=timeout, wait_until="domcontentloaded")
            
            await page.wait_for_timeout(random.randint(1500, 2500))
            
            page_content = await page.content()
            page_title = await page.title()
            
            real_block_indicators = [
                "captcha",
                "não é um robô",
                "verify you are human",
                "acesso negado",
                "access denied"
            ]
            
            is_blocked = any(ind.lower() in page_title.lower() for ind in real_block_indicators)
            if is_blocked:
                print(f"[WARN] ⚠️ Bloqueio detectado no título", flush=True)
                ScraperStats.log_failure(blocked=True)
                return None

            await page.wait_for_timeout(500)
            
            page_title = await page.title()
            page_url = page.url
            print(f"[DEBUG] 📄 Título da página: {page_title[:80] if page_title else 'VAZIO'}", flush=True)
            print(f"[DEBUG] 📄 URL final: {page_url[:80]}", flush=True)
            
            try:
                body_text = await page.inner_text("body")
                if body_text:
                    print(f"[DEBUG] 📄 Body (primeiros 200 chars): {body_text[:200].replace(chr(10), ' ')}", flush=True)
            except:
                print("[DEBUG] ⚠️ Não foi possível ler body text", flush=True)
            
            if "error" in page_url.lower() or "captcha" in page_url.lower():
                print(f"[WARN] ⚠️ Página de erro/captcha detectada!", flush=True)
                return None
            
            print("[DEBUG] 🔄 Tentando extração via JavaScript...", flush=True)
            title = None
            price = None
            
            try:
                js_data = await page.evaluate("""
                    () => {
                        let title = null;
                        let price = null;
                        let debug = {
                            jsonLdCount: 0,
                            h1Count: 0,
                            priceElements: 0,
                            pageHtml: document.documentElement.innerHTML.length
                        };
                        
                        debug.jsonLdCount = document.querySelectorAll('script[type="application/ld+json"]').length;
                        debug.h1Count = document.querySelectorAll('h1').length;
                        debug.priceElements = document.querySelectorAll('[class*="price"]').length;
                        
                        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                        for (const script of scripts) {
                            try {
                                const data = JSON.parse(script.textContent);
                                if (data['@type'] === 'Product') {
                                    if (data.name) title = data.name;
                                    if (data.offers) {
                                        const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
                                        if (offers.price) price = parseFloat(offers.price);
                                        else if (offers.lowPrice) price = parseFloat(offers.lowPrice);
                                    }
                                }
                                if (data['@graph']) {
                                    for (const item of data['@graph']) {
                                        if (item['@type'] === 'Product') {
                                            if (item.name) title = item.name;
                                            if (item.offers) {
                                                const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                                                if (offers.price) price = parseFloat(offers.price);
                                                else if (offers.lowPrice) price = parseFloat(offers.lowPrice);
                                            }
                                        }
                                    }
                                }
                            } catch (e) {}
                        }
                        
                        if (!title) {
                            const ogTitle = document.querySelector('meta[property="og:title"]');
                            if (ogTitle) title = ogTitle.content;
                        }
                        if (!price) {
                            const metaPrice = document.querySelector('meta[itemprop="price"]');
                            if (metaPrice) price = parseFloat(metaPrice.content);
                        }
                        
                        if (!title) {
                            const h1 = document.querySelector('h1.ui-pdp-title') || 
                                       document.querySelector('h1[class*="title"]') ||
                                       document.querySelector('.ui-pdp-header__title-container h1') ||
                                       document.querySelector('h1');
                            if (h1) title = h1.innerText?.trim();
                        }
                        
                        if (!price) {
                            const priceSelectors = [
                                '.ui-pdp-price__second-line .andes-money-amount',
                                '.ui-pdp-price .andes-money-amount',
                                '[class*="price"] .andes-money-amount',
                                '.andes-money-amount__fraction',
                                '[class*="price-tag-fraction"]'
                            ];
                            
                            for (const sel of priceSelectors) {
                                const el = document.querySelector(sel);
                                if (el) {
                                    const text = el.innerText || el.textContent;
                                    const cleaned = text.replace(/[^\d.,]/g, '');
                                    if (cleaned) {
                                        if (cleaned.includes(',')) {
                                            const parts = cleaned.split(',');
                                            const intPart = parts[0].replace(/\./g, '');
                                            const decPart = parts[1] || '00';
                                            const val = parseFloat(intPart + '.' + decPart);
                                            if (val > 0 && val < 1000000) {
                                                price = val;
                                                break;
                                            }
                                        } else if (cleaned.includes('.') && cleaned.split('.').length > 2) {
                                            const val = parseFloat(cleaned.replace(/\./g, ''));
                                            if (val > 0 && val < 1000000) {
                                                price = val;
                                                break;
                                            }
                                        } else {
                                            const val = parseFloat(cleaned.replace(/\./g, ''));
                                            if (val > 0 && val < 1000000) {
                                                price = val;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        if (!price) {
                            const ariaPrice = document.querySelector('[aria-label*="reais"]');
                            if (ariaPrice) {
                                const label = ariaPrice.getAttribute('aria-label');
                                const match = label.match(/(\d+(?:[.,]\d+)?)\s*reais/i);
                                if (match) {
                                    price = parseFloat(match[1].replace(',', '.'));
                                }
                            }
                        }
                        
                        return { title, price, debug };
                    }
                """)
                
                if js_data:
                    debug = js_data.get('debug', {})
                    print(f"[DEBUG] 📊 JSON-LD scripts: {debug.get('jsonLdCount', 0)}, H1s: {debug.get('h1Count', 0)}, Price elements: {debug.get('priceElements', 0)}, HTML size: {debug.get('pageHtml', 0)}", flush=True)
                    
                    if js_data.get('title'):
                        title = js_data['title']
                        print(f"[DEBUG] 📝 Título: {title[:50]}...", flush=True)
                    if js_data.get('price'):
                        price = js_data['price']
                        print(f"[DEBUG] 💰 Preço: R$ {price:.2f}", flush=True)
            except Exception as e:
                print(f"[DEBUG] JS extraction failed: {e}", flush=True)
            
            if not title:
                title_selectors = [
                    "h1.ui-pdp-title",
                    "h1[class*='ui-pdp-title']",
                    ".ui-pdp-header__title-container h1",
                    ".ui-pdp-header h1",
                    "h1",
                ]
                for selector in title_selectors:
                    try:
                        title_element = await page.query_selector(selector)
                        if title_element:
                            raw_title = await title_element.inner_text()
                            if raw_title and raw_title.strip() and len(raw_title.strip()) > 5:
                                title = raw_title.strip()
                                print(f"[DEBUG] 📝 Título (CSS): {title[:50]}...", flush=True)
                                break
                    except:
                        continue
            
            if price is None:
                price_selectors = [
                    ".andes-money-amount__fraction",
                    ".ui-pdp-price__second-line .andes-money-amount__fraction",
                    "[class*='price'] .andes-money-amount__fraction",
                ]
                for selector in price_selectors:
                    try:
                        price_element = await page.query_selector(selector)
                        if price_element:
                            price_int = await price_element.inner_text()
                            if price_int and price_int.strip():
                                price_cents = "00"
                                try:
                                    cents_elem = await page.query_selector(".andes-money-amount__cents")
                                    if cents_elem:
                                        price_cents = await cents_elem.inner_text() or "00"
                                except:
                                    pass
                                price = normalize_price(f"{price_int},{price_cents}")
                                if price and price > 0:
                                    print(f"[DEBUG] 💰 Preço (CSS): R$ {price:.2f}", flush=True)
                                    break
                    except:
                        continue

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
                        if src and src.startswith("http") and "mlstatic" in src:
                            image_url = src
                            print(f"[DEBUG] 📷 Imagem encontrada: {image_url[:60]}...", flush=True)
                            break
                except:
                    continue
            
            if not image_url:
                try:
                    all_images = await page.query_selector_all("img[src*='mlstatic']")
                    for img in all_images[:5]:
                        src = await img.get_attribute("src")
                        if src and "http" in src and ("D_NQ" in src or "O_" in src):
                            image_url = src
                            print(f"[DEBUG] 📷 Imagem (fallback): {image_url[:60]}...", flush=True)
                            break
                except:
                    pass
            
            if not title or price is None:
                print(f"[WARN] Dados incompletos. Título: {title}, Preço: {price}", flush=True)
                ScraperStats.log_failure()
                return None

            print(f"[OK] ✅ {title[:40]}... - R$ {price:.2f}", flush=True)
            ScraperStats.log_success()
            return {"title": title, "price": price, "imageUrl": image_url}

        except PlaywrightTimeout:
            print(f"[WARN] [Tentativa {attempt_num + 1}] Timeout ao processar página: {url}", flush=True)
            ScraperStats.log_failure()
            return None
        except Exception as e:
            print(f"[WARN] [Tentativa {attempt_num + 1}] Falha ao fazer scrape de {url}: {str(e)}", flush=True)
            ScraperStats.log_failure()
            return None
        finally:
            if context:
                # --- Salvar cookies para a próxima vez ---
                await context.storage_state(path=COOKIES_FILE)
                # -----------------------------------------
                await context.close()


# ========================================
# TEST BLOCK - Run this file directly to test
# ========================================
async def main():
    test_url = "https://www.mercadolivre.com.br/cadeira-escritorio-ergonmica-sensetup-cosy-t03-preto-mesh-reclinavel-com-apoio-de-bracos-3d/p/MLB24578456"
    
    print("=" * 50, flush=True)
    print("Testing Async Mercado Livre Scraper", flush=True)
    print("=" * 50, flush=True)
    
    await Scraper.initialize()
    
    print(f"URL: {test_url}", flush=True)
    print("-" * 50, flush=True)
    
    result = await Scraper.scrape_mercadolivre(test_url)
    
    if result:
        print("✅ Success!", flush=True)
        print(f"   Title: {result['title']}", flush=True)
        print(f"   Price: R$ {result['price']:.2f}", flush=True)
        print(f"   Image URL: {result['imageUrl']}", flush=True)
    else:
        print("❌ Failed to scrape product data", flush=True)
    
    await Scraper.close()
    
    print("=" * 50, flush=True)

if __name__ == "__main__":
    asyncio.run(main())