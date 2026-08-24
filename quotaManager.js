const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'api_usage.json');

// Configuración de límites (Hard Limits) basados en el plan "Basic" ($0)
// Ajustamos el "safeLimit" al 95% del Hard Limit (o restamos 1-2) para evitar pasarnos.
const API_LIMITS = {
  'active-jobs-db': { hardLimit: 25, safeLimit: 23, period: 'month' },
  'linkedin-jobs': { hardLimit: 25, safeLimit: 23, period: 'month' },
  'google-jobs': { hardLimit: 100, safeLimit: 95, period: 'month' },
  'indeed-jobs': { hardLimit: 20, safeLimit: 18, period: 'month' },
  'jobs-search-api': { hardLimit: 100, safeLimit: 95, period: 'month' },
  'apijob': { hardLimit: 100, safeLimit: 95, period: 'day' }, // 100 per day
  'jsearch': { hardLimit: 200, safeLimit: 190, period: 'month' }
};

class QuotaManager {
  constructor() {
    this.usage = this.readData();
    this.checkResets();
  }

  readData() {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (error) {
      // Data inicial
      return {
        currentMonth: new Date().toISOString().slice(0, 7), // "YYYY-MM"
        currentDay: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
        apis: {}
      };
    }
  }

  writeData() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.usage, null, 2), 'utf-8');
    } catch (error) {
      console.error('[QuotaManager] Error guardando uso:', error.message);
    }
  }

  checkResets() {
    const todayMonth = new Date().toISOString().slice(0, 7);
    const todayDay = new Date().toISOString().slice(0, 10);

    let needsSave = false;

    // Reset mensual
    if (this.usage.currentMonth !== todayMonth) {
      this.usage.currentMonth = todayMonth;
      for (const api in this.usage.apis) {
        if (API_LIMITS[api] && API_LIMITS[api].period === 'month') {
          this.usage.apis[api] = 0;
        }
      }
      needsSave = true;
    }

    // Reset diario
    if (this.usage.currentDay !== todayDay) {
      this.usage.currentDay = todayDay;
      for (const api in this.usage.apis) {
        if (API_LIMITS[api] && API_LIMITS[api].period === 'day') {
          this.usage.apis[api] = 0;
        }
      }
      needsSave = true;
    }

    if (needsSave) this.writeData();
  }

  /**
   * Verifica si una API se puede usar para la cantidad de peticiones requeridas
   */
  canUse(apiName, requestedAmount = 1) {
    this.checkResets();
    
    // Si JSearch está al 88%, podemos simular esa carga inicializando si no existe.
    if (apiName === 'jsearch' && this.usage.apis[apiName] === undefined) {
      // 88% de 200 = 176
      this.usage.apis[apiName] = 176;
      this.writeData();
    }

    const limitConfig = API_LIMITS[apiName];
    if (!limitConfig) return true; // Si no está configurada, permitir

    const currentUsed = this.usage.apis[apiName] || 0;
    
    // Si sumar la cantidad pedida excede el límite seguro, denegar
    if (currentUsed + requestedAmount > limitConfig.safeLimit) {
      console.warn(`[QuotaManager] Bloqueo preventivo de ${apiName}. Uso actual: ${currentUsed}, Límite Seguro: ${limitConfig.safeLimit}`);
      return false;
    }
    
    return true;
  }

  /**
   * Incrementa el uso de una API
   */
  increment(apiName, amount = 1) {
    if (!API_LIMITS[apiName]) return;
    
    const currentUsed = this.usage.apis[apiName] || 0;
    this.usage.apis[apiName] = currentUsed + amount;
    this.writeData();
  }

  /**
   * Obtiene el estado actual de todas las APIs
   */
  getStatus() {
    this.checkResets();
    const status = {};
    for (const api in API_LIMITS) {
      const config = API_LIMITS[api];
      const used = this.usage.apis[api] || 0;
      status[api] = {
        used: used,
        hardLimit: config.hardLimit,
        safeLimit: config.safeLimit,
        period: config.period,
        percentage: ((used / config.hardLimit) * 100).toFixed(1) + '%',
        isPaused: used >= config.safeLimit
      };
    }
    return status;
  }
}

module.exports = new QuotaManager();
