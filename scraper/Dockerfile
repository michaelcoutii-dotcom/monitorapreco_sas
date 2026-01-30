# Python Scraper API - Dockerfile (Optimized for Railway - LOW MEMORY)
# Using slim Python image + Chromium as optional dependency

FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Environment variables for low memory usage
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/app/browsers
ENV MALLOC_ARENA_MAX=2
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Install system dependencies for Chromium only (much smaller than full Playwright image)
# NOTE: Chromium dependencies são necessários mesmo com install opcional
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Chromium dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    # Fonts for proper rendering
    fonts-liberation \
    # Utilities
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /tmp/* /var/tmp/*

# Copy requirements first (better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install ONLY Chromium browser (saves ~1.5GB compared to all browsers)
# Using system deps that were already installed above
RUN playwright install chromium \
    && rm -rf /root/.cache /tmp/*

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8000/health || exit 1

# Run the application with limited workers for memory efficiency
# Single worker to minimize memory footprint on Railway free tier
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-max-requests", "1000"]
