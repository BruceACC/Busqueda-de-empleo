# 🔍 Agenda de Postulaciones (Búsqueda Automática de Empleos)

Un sistema de gestión y búsqueda automática de ofertas laborales, diseñado para profesionales de tecnología y áreas afines. 

Esta aplicación no solo te permite guardar de forma manual las empresas a las que postulas, sino que funciona como un **agente automatizado** que busca oportunidades de empleo en internet (a nivel local y posiciones 100% remotas internacionales) y te muestra su nivel de coincidencia con tu currículum.

---

## 🚀 Características Principales

1. **Búsqueda Automática Dual**: 
   - Busca empleos locales en Perú (Híbridos, Remotos o Presenciales).
   - Busca oportunidades internacionales que sean **estrictamente remotas**.
2. **Dashboard de Coincidencias**: 
   - Analiza la descripción de las vacantes obtenidas y te muestra un "Match Score" (Porcentaje de coincidencia) basado en las habilidades que configures.
3. **Filtro Avanzado de Experiencia**: 
   - El sistema lee las ofertas con Inteligencia Artificial/Regex y extrae los años de experiencia requeridos para que puedas filtrarlos (ej: "Sin experiencia" o "Min: 1 año").
4. **Base de Datos en JSON Local**: 
   - No necesitas instalar MySQL o MongoDB. Todo se guarda de forma segura en un archivo local (`vacancies.json`), manteniendo tu información privada.
5. **Gestor de Estados**:
   - Organiza tus oportunidades en estados ("Pendiente", "Postulado") para hacer un seguimiento real de tus procesos de selección.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 Puro (Animaciones Glassmorphism) y Vanilla JavaScript.
- **Backend**: Node.js, Express.js.
- **Integraciones**: [JSearch API (vía RapidAPI)](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) para extraer las ofertas de LinkedIn, Glassdoor, Indeed, etc.

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

1. Ve a [RapidAPI JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) y regístrate con tu cuenta (el plan Basic es gratuito).
2. Copia tu `X-RapidAPI-Key`.
3. Crea tu archivo `.env` guiándote del archivo `.env.example`:

```env
# Tu API Key de RapidAPI (JSearch API)
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
* **`/data`**: Contiene `vacancies.json`, el archivo que funciona como base de datos. Aquí se guardan las habilidades de tu CV y las vacantes.
* **`server.js`**: El corazón del backend en Express. Se encarga de guardar y leer los datos de `vacancies.json` y de servir la web.
* **`scraper.js`**: El algoritmo principal de búsqueda. Construye los parámetros de la JSearch API basándose en tu perfil, ejecuta las peticiones e interactúa con los resultados.

---

## 💡 ¿Cómo modificar o extender el proyecto?

- **Agregar más habilidades o palabras clave**: Puedes editar tus habilidades directamente desde el botón "✏️ Editar" en la web (apartado *Mis Habilidades*). El scraper tomará estas habilidades para realizar búsquedas optimizadas.
- **Modificar la lógica de Experiencia**: La extracción de años de experiencia se encuentra en `app.js` mediante la función `extractExperience()`. Utiliza Expresiones Regulares (Regex) para analizar la descripción.
- **Cambiar las ciudades de búsqueda**: Por defecto, la app usa "Lima, Peru" para la búsqueda local. Si deseas cambiar el país de origen de la búsqueda local, debes modificar el campo `location` en el Frontend y el parámetro `country` en el algoritmo de `scraper.js`.

---
*Este proyecto fue construido como una herramienta integral para acelerar y automatizar el proceso de búsqueda laboral y postulación técnica.*
