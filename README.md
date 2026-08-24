# 🔍 Agenda de Postulaciones (Búsqueda Automática de Empleos)

Un sistema de gestión y búsqueda automática de ofertas laborales, diseñado para profesionales de tecnología y áreas afines. 

Esta aplicación no solo te permite guardar de forma manual las empresas a las que postulas, sino que funciona como un **agente automatizado** que busca oportunidades de empleo en internet (a nivel local y posiciones 100% remotas internacionales) y te muestra su nivel de coincidencia con tu currículum.

---

## 🚀 Características Principales

1. **Agregador Multi-API (7 Fuentes)**: 
   - Busca en 7 plataformas de empleo simultáneamente (JSearch, LinkedIn, Google Jobs, Indeed, Apijob, Active Jobs DB y JOBS SEARCH API) usando una sola `RAPIDAPI_KEY`.
2. **Gestor de Cuotas Inteligente**: 
   - Protege los límites gratuitos (*Hard Limits*) de tus APIs. Cuenta las peticiones diarias y mensuales, deteniendo el tráfico a las APIs que alcanzan su cuota de seguridad para evitar sobrecargos.
3. **Búsqueda Automática Dual**: 
   - Busca empleos locales en Perú (Híbridos, Remotos o Presenciales) y oportunidades internacionales **estrictamente remotas**.
4. **Dashboard de Coincidencias**: 
   - Analiza la descripción de las vacantes obtenidas y te muestra un "Match Score" (Porcentaje de coincidencia) basado en las habilidades que configures.
5. **Filtro Avanzado de Experiencia**: 
   - El sistema lee las ofertas con Inteligencia Artificial/Regex y extrae los años de experiencia requeridos para que puedas filtrarlos (ej: "Sin experiencia" o "Min: 1 año").
6. **Base de Datos en JSON Local**: 
   - No necesitas instalar MySQL o MongoDB. Todo se guarda de forma segura en un archivo local (`vacancies.json`), manteniendo tu información privada.
7. **Gestor de Estados**:
   - Organiza tus oportunidades en estados ("Pendiente", "Postulado") para hacer un seguimiento real de tus procesos de selección.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 Puro (Animaciones Glassmorphism) y Vanilla JavaScript.
- **Backend**: Node.js, Express.js.
- **Integraciones**: [RapidAPI](https://rapidapi.com/) (JSearch, Apijob, Indeed, Google Jobs, LinkedIn Jobs, etc.).

---

## ⚙️ Instalación y Configuración (Para Desarrolladores)

Si acabas de clonar el repositorio y quieres ejecutarlo en tu computadora, sigue estos pasos:

### 1. Instalar dependencias
Abre tu terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 2. Configurar Variables de Entorno (`.env`)
Debes crear un archivo llamado `.env` en la raíz del proyecto. Este archivo contiene la configuración secreta para que la API funcione.

1. Ve a [RapidAPI](https://rapidapi.com/) y regístrate con tu cuenta.
2. Suscríbete al plan Basic (gratuito) de las APIs que desees integrar (ej. JSearch, Apijob, Indeed Jobs, etc.).
3. Copia tu única `X-RapidAPI-Key` (es la misma para todas).
4. Crea tu archivo `.env` guiándote del archivo `.env.example`:

```env
# Tu API Key de RapidAPI (Master Key)
RAPIDAPI_KEY=tu_clave_secreta_aqui

# Puerto del servidor
PORT=3000
```

### 3. Ejecutar el Proyecto
Para iniciar el servidor en modo producción, ejecuta:
```bash
npm start
```

Para iniciar el servidor en modo desarrollador (se reinicia automáticamente si detecta cambios en el código):
```bash
npm run dev
```

### 4. Abrir la Aplicación
Una vez que el servidor esté corriendo, abre tu navegador e ingresa a:
👉 `http://localhost:3000` (o el puerto que hayas configurado).

---

## 📂 Estructura del Proyecto

* **`/public`**: Contiene todo el frontend de la app (`index.html`, `style.css`, `app.js`). Aquí se maneja la interfaz de usuario.
* **`/data`**: Contiene `vacancies.json` (tu base de datos) y `api_usage.json` (registro de uso de tus cuotas de API).
* **`server.js`**: El corazón del backend en Express. Se encarga de guardar y leer los datos y servir la web.
* **`quotaManager.js`**: Gestor de cuotas que administra cuántas peticiones se han hecho a cada API en el mes/día actual para protegerte.
* **`scraper.js`**: El motor principal de búsqueda. Construye los adaptadores para las 7 APIs, distribuye las peticiones respetando los límites e integra los resultados.

---

## 💡 ¿Cómo modificar o extender el proyecto?

- **Agregar más habilidades o palabras clave**: Puedes editar tus habilidades directamente desde el botón "✏️ Editar" en la web (apartado *Mis Habilidades*). El scraper tomará estas habilidades para realizar búsquedas optimizadas.
- **Modificar la lógica de Experiencia**: La extracción de años de experiencia se encuentra en `app.js` mediante la función `extractExperience()`. Utiliza Expresiones Regulares (Regex) para analizar la descripción.
- **Cambiar las ciudades de búsqueda**: Por defecto, la app usa "Lima, Peru" para la búsqueda local. Si deseas cambiar el país de origen de la búsqueda local, debes modificar el campo `location` en el Frontend y el parámetro `country` en el algoritmo de `scraper.js`.

---
*Este proyecto fue construido como una herramienta integral para acelerar y automatizar el proceso de búsqueda laboral y postulación técnica.*
