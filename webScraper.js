const puppeteer = require('puppeteer');

/**
 * Visita una URL y extrae todo el texto visible del body.
 * Retorna un string limpio o null si falla.
 */
async function fetchFullDescription(url) {
  if (!url || !url.startsWith('http')) return null;

  let browser = null;
  try {
    console.log(`[WebScraper] Abriendo navegador para: ${url}`);
    
    // Lanzar puppeteer en modo headless (invisible)
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Simulamos ser un navegador real para evitar bloqueos
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    // Navegar y esperar hasta que la red esté inactiva o un máximo de 15 segundos
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    // Esperar un segundo extra por si hay scripts asíncronos renderizando la descripción
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Extraer todo el texto visible del body
    const text = await page.evaluate(() => {
      // Eliminar elementos que no aportan (navs, footers, scripts, estilos)
      const elementsToRemove = document.querySelectorAll('script, style, noscript, nav, footer, header');
      elementsToRemove.forEach(el => el.remove());
      
      return document.body.innerText;
    });

    // Limpiar el texto: remover espacios múltiples, saltos de línea excesivos
    let cleanText = text.replace(/\s+/g, ' ').trim();

    // Recortar a 4000 caracteres máximo para no exceder los límites de Ollama
    if (cleanText.length > 4000) {
      cleanText = cleanText.substring(0, 4000) + '...';
    }

    console.log(`[WebScraper] Texto extraído (${cleanText.length} caracteres)`);
    return cleanText;
  } catch (error) {
    console.error(`[WebScraper] Error visitando ${url}:`, error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  fetchFullDescription
};
