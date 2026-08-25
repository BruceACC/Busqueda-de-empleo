# 🔍 Agenda de Postulaciones (Búsqueda Automática de Empleos con IA)

Un sistema de gestión y búsqueda automática de ofertas laborales, diseñado para profesionales de tecnología y áreas afines. 

Esta aplicación funciona como un **agente automatizado** que busca oportunidades de empleo a lo largo de internet. Busca tanto a nivel local (Perú) como remoto a nivel global (España, Colombia, México, EE.UU., etc.). Además, cuenta con un potente motor de **Inteligencia Artificial local (Ollama)** y **Web Scraping (Puppeteer)** para leer a fondo los enlaces de los trabajos, categorizar el "Seniority" (desde Practicante hasta Gerente) y extraer exactamente lo que piden.

---

## 🚀 Características Principales

1. **Agregador Multi-API Masivo (20+ Fuentes)**: 
   - Busca en más de 20 plataformas de empleo simultáneamente (JSearch, LinkedIn, Glassdoor, Indeed Daily, Indeed nórdicos, Jobicy, Techmap, Upwork, ByteBricks, etc.) usando una sola `RAPIDAPI_KEY`.
2. **Gestor de Cuotas Inteligente & Mezcla Aleatoria**: 
   - Protege los límites gratuitos (*Hard Limits*) de tus APIs. Cada vez que buscas, el sistema **mezcla al azar** los países de búsqueda para no estancarse en una sola región y aprovechar al máximo tu cuota gratuita (mensual y diaria).
3. **Búsqueda Remota Global**: 
   - Genera automáticamente consultas de trabajos remotos para España, Colombia, Chile, México, Canadá, USA, Brasil y Argentina, además de tu país local.
4. **Verificación Profunda con Inteligencia Artificial**: 
   - Mediante `Puppeteer`, la aplicación entra al enlace de la vacante, lee todo el texto real de la página y usa **Ollama** (ej. modelo `gemma4:e4b` u otros) para reescribir los datos, extraer el salario, las habilidades clave y confirmar si necesitas o no experiencia real.
5. **Detección de Seniority Automática**: 
   - Clasifica todas las vacantes en niveles (0: Practicante, 1: Junior, 2: Semi-Senior, 3: Senior, 4: Lead, 5: Gerente) para que puedas filtrar la lista y postular solo a lo que encaja con tu perfil actual.
6. **Dashboard de Coincidencias**: 
   - Analiza la descripción y te muestra un "Match Score" (Porcentaje de coincidencia) basado en las habilidades que configures.
7. **Base de Datos en JSON Local**: 
   - Sin instalaciones complejas de MySQL/MongoDB. Todo se guarda seguro en un archivo local (`vacancies.json`).

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 (Animaciones Glassmorphism) y Vanilla JavaScript.
- **Backend**: Node.js, Express.js.
- **Inteligencia Artificial & Scraping**: `Ollama` (Local LLM API) y `Puppeteer` (Headless Browser).
- **Integraciones**: [RapidAPI](https://rapidapi.com/) para conectar más de 20 proveedores de empleo.

---

## ⚙️ Instalación y Configuración

Si acabas de clonar el repositorio y quieres ejecutarlo en tu computadora, sigue estos pasos cuidadosamente:

### 1. Requisitos Previos
- **Node.js**: Debes tener [Node.js](https://nodejs.org/) instalado en tu computadora.
- **Ollama (Para la verificación con IA)**: Si deseas usar la función de "Análisis profundo con IA", debes descargar e instalar [Ollama](https://ollama.ai/). 
  - Tras instalarlo, abre tu terminal y ejecuta `ollama run gemma4:e4b` (o el modelo que prefieras usar) para descargarlo a tu PC y dejarlo corriendo en segundo plano. (Por defecto la app asume que Ollama corre en `http://localhost:11434`).

### 2. Instalar dependencias
Abre tu terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```
*(Esto instalará Express, Axios, Puppeteer y dotenv).*

### 3. Configurar Variables de Entorno (`.env`)
Debes crear un archivo llamado `.env` en la raíz del proyecto. Este archivo contiene la configuración secreta para que la API funcione.

1. Ve a [RapidAPI](https://rapidapi.com/) y regístrate con tu cuenta.
2. Suscríbete al plan Basic ($0.00) de las APIs de empleo que se listan en el archivo `quotaManager.js` (ej. JSearch, Apijob, Jobicy, Techmap, Glassdoor Real-Time, Indeed, etc.).
3. Copia tu única `X-RapidAPI-Key` (es la misma para todas).
4. Crea tu archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Tu API Key de RapidAPI (Master Key)
RAPIDAPI_KEY=tu_clave_secreta_aqui

# Puerto del servidor
PORT=3000
```

### 4. Ejecutar el Proyecto
Para iniciar el servidor, ejecuta:
```bash
npm start
```
*(Si prefieres modo desarrollador con reinicios automáticos, usa `npm run dev`)*.

### 5. Abrir la Aplicación
Una vez que el servidor esté corriendo, abre tu navegador e ingresa a:
👉 `http://localhost:3000`

---

## 📂 Estructura del Proyecto

* **`/public`**: Contiene el frontend de la app (`index.html`, `style.css`, `app.js`). Maneja los filtros, estilos y llamados a la API.
* **`/data`**: Contiene `vacancies.json` (tu base de datos principal) y `api_usage.json` (registro de uso de tus cuotas de RapidAPI para que no te cobren).
* **`server.js`**: El backend en Express. Orquesta los endpoints, crea nuevas vacantes y activa la IA.
* **`quotaManager.js`**: El escudo protector de tu tarjeta de crédito. Controla las 20+ APIs para detenerlas si se acercan a su límite mensual/diario.
* **`scraper.js`**: El motor generador de queries. Baraja países aleatorios y contacta a todos los adaptadores de API.
* **`webScraper.js`**: Utiliza Puppeteer para abrir links en un navegador oculto, saltar bloqueos sencillos y extraer el texto real de la página de empleo.
* **`ollamaService.js`**: Se conecta con tu instalación local de Ollama para pasarle el texto crudo y devolver un JSON estructurado con el Seniority, Habilidades, Salario, etc.

---

## 💡 ¿Cómo modificar o extender el proyecto?

- **Cambiar el modelo de IA**: Ve a `ollamaService.js` y cambia el nombre del modelo (ej. de `gemma4:e4b` a `llama3` o `mistral`) según lo que hayas descargado en tu PC.
- **Agregar más países remotos**: En el archivo `scraper.js`, dentro de la función `generateSearchQueries`, puedes agregar o quitar países de la lista `remoteCountries`.
- **Modificar Cuotas**: Si compras el plan premium de alguna API, ve a `quotaManager.js` y sube el `hardLimit` de esa API. El sistema se ajustará automáticamente.
