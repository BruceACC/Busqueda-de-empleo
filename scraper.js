/* ═══════════════════════════════════════════════
   SCRAPER - Búsqueda automática de vacantes
   Usa JSearch API (RapidAPI) para buscar empleos
   reales basándose en las habilidades del usuario
   ═══════════════════════════════════════════════ */

const axios = require('axios');

// ── Configuración de búsqueda ──
const SEARCH_CONFIG = {
  // Prefijos de rol para las búsquedas
  rolePrefixes: [
    'practicante',
    'practicante pre profesional',
    'junior',
    'trainee',
    'intern'
  ],

  // Términos de área para combinar con skills
  areaTerms: [
    'desarrollo software',
    'tecnología',
    'datos',
    'BI',
    'analítica',
    'sistemas',
    'programador',
    'developer',
    'QA',
    'DevOps'
  ],

  // Ubicación por defecto
  defaultLocation: 'Lima, Peru',

  // Skills clave que generan búsquedas individuales
  keySkillsForSearch: [
    'SQL', 'Python', 'Java', 'React', 'Angular',
    'FastAPI', 'Spring Boot', 'Flutter', 'Node.js', 'Docker'
  ]
};

/**
 * Genera las queries de búsqueda basadas en las skills del usuario
 * @param {string[]} userSkills - Habilidades del usuario
 * @param {string} location - Ubicación de búsqueda
 * @returns {string[]} - Lista de queries únicas
 */
function generateSearchQueries(userSkills, location = SEARCH_CONFIG.defaultLocation) {
  const queries = [];
  const addQuery = (q, country, remote) => {
    if (!queries.find(x => x.query === q && x.country === country && x.remote === remote)) {
      queries.push({ query: q, country, remote });
    }
  };

  // 1. Búsquedas por skill individual (las más importantes del usuario)
  const importantSkills = userSkills.filter(skill =>
    SEARCH_CONFIG.keySkillsForSearch.some(ks =>
      ks.toLowerCase() === skill.toLowerCase()
    )
  );

  for (const skill of importantSkills.slice(0, 5)) {
    addQuery(`${skill} en ${location}`, 'pe', false);
    addQuery(`junior ${skill} en ${location}`, 'pe', false);
    addQuery(`junior ${skill} remote`, '', true);
  }

  // 2. Búsquedas por área + rol
  for (const area of SEARCH_CONFIG.areaTerms.slice(0, 3)) {
    addQuery(`junior ${area} en ${location}`, 'pe', false);
    addQuery(`junior ${area} remote`, '', true);
  }

  // 3. Búsquedas genéricas
  addQuery(`desarrollador en ${location}`, 'pe', false);
  addQuery(`junior developer en ${location}`, 'pe', false);
  addQuery(`junior developer remote`, '', true);

  return queries;
}

/**
 * Busca vacantes usando JSearch API
 * @param {string} query - Query de búsqueda
 * @param {string} apiKey - RapidAPI key
 * @param {number} page - Número de página
 * @returns {Promise<Object[]>} - Lista de vacantes normalizadas
 */
async function searchJobs(config, apiKey, page = 1) {
  const { query, country, remote } = config;
  try {
    const params = {
      query: query,
      page: page.toString(),
      num_pages: '1',
      date_posted: 'month' // Solo del último mes
    };
    if (country) params.country = country;
    if (remote) params.remote_jobs_only = 'true';

    const response = await axios.get('https://jsearch.p.rapidapi.com/search-v2', {
      params: params,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com'
      },
      timeout: 15000
    });

    if (!response.data || !response.data.data) {
      return [];
    }
    
    // /search-v2 returns jobs inside response.data.data.jobs
    const jobsArray = Array.isArray(response.data.data) 
      ? response.data.data 
      : (response.data.data.jobs || []);

    return jobsArray.map(job => normalizeJob(job));
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        console.warn(`[JSearch] Rate limit alcanzado para query: "${query}"`);
      } else if (status === 403) {
        console.error('[JSearch] API Key inválida o sin suscripción');
      } else {
        console.error(`[JSearch] Error ${status} para query: "${query}"`);
      }
    } else {
      console.error(`[JSearch] Error de conexión: ${error.message}`);
    }
    return [];
  }
}

/**
 * Normaliza un job de JSearch al formato de nuestra app
 */
function normalizeJob(job) {
  return {
    id: `jsearch_${job.job_id || Date.now() + Math.random().toString(36).substr(2, 9)}`,
    company: job.employer_name || 'Empresa no especificada',
    title: job.job_title || 'Puesto no especificado',
    area: detectArea(job.job_title, job.job_description),
    description: cleanDescription(job.job_description || ''),
    skills: extractSkills(job.job_description || '', job.job_title || ''),
    url: job.job_apply_link || job.job_google_link || '',
    source: detectSource(job),
    logo: job.employer_logo || null,
    location: job.job_city
      ? `${job.job_city}, ${job.job_country}`
      : job.job_country || 'No especificada',
    employmentType: translateEmploymentType(job.job_employment_type),
    postedDate: job.job_posted_at_datetime_utc || null,
    status: 'pending',
    dateAdded: new Date().toISOString().split('T')[0],
    dateApplied: null,
    matchScore: 0 // Se calcula después
  };
}

/**
 * Detecta el área basándose en el título y descripción
 */
function detectArea(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();

  const areaMap = [
    { keywords: ['business intelligence', ' bi ', 'bi ', 'power bi', 'tableau', 'reportería', 'dashboard'], area: 'Business Intelligence' },
    { keywords: ['data scien', 'machine learning', 'ml ', 'deep learning', 'ciencia de datos'], area: 'Data Science' },
    { keywords: ['data analy', 'analítica', 'analytics', 'análisis de datos', 'analista de datos'], area: 'Data Analytics' },
    { keywords: ['frontend', 'front-end', 'front end', 'react', 'angular', 'vue'], area: 'Desarrollo Frontend' },
    { keywords: ['backend', 'back-end', 'back end', 'api', 'microservicio'], area: 'Desarrollo Backend' },
    { keywords: ['full stack', 'fullstack', 'full-stack'], area: 'Desarrollo Full Stack' },
    { keywords: ['qa', 'quality', 'testing', 'pruebas', 'automatización de pruebas', 'selenium'], area: 'QA / Testing' },
    { keywords: ['devops', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'ci/cd'], area: 'DevOps / Cloud' },
    { keywords: ['ciberseguridad', 'seguridad', 'security', 'soc', 'pentesting'], area: 'Ciberseguridad' },
    { keywords: ['ux', 'ui', 'diseño', 'user experience', 'figma'], area: 'UX / UI' },
    { keywords: ['producto', 'product manager', 'product owner', 'scrum master'], area: 'Producto Digital' },
    { keywords: ['soporte', 'helpdesk', 'mesa de ayuda', 'support'], area: 'Soporte Técnico' },
    { keywords: ['consultoría', 'consulting', 'consultora'], area: 'Consultoría' },
    { keywords: ['transformación digital', 'automatización', 'rpa', 'innovación'], area: 'Transformación Digital' },
    { keywords: ['base de datos', 'database', 'dba', 'sql server', 'oracle'], area: 'Base de Datos' },
    { keywords: ['desarrollo', 'developer', 'programador', 'software', 'ingeniero', 'java', 'python', '.net', 'node'], area: 'Desarrollo de Software' },
  ];

  for (const { keywords, area } of areaMap) {
    if (keywords.some(kw => text.includes(kw))) {
      return area;
    }
  }

  return 'Tecnología / TI';
}

/**
 * Extrae skills mencionados en la descripción
 */
function extractSkills(description, title) {
  const text = `${title} ${description}`.toLowerCase();

  const skillPatterns = [
    // Lenguajes de programación
    'python', 'java', 'javascript', 'typescript', 'c#', 'c\\+\\+', 'php', 'ruby',
    'go', 'golang', 'rust', 'kotlin', 'swift', 'scala', 'r ', 'dart',
    // Bases de datos
    'sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'sql server', 'redis',
    'dynamodb', 'firebase',
    // Frontend & Mobile
    'html', 'css', 'react', 'angular', 'vue', 'next\\.js', 'nextjs',
    'tailwind', 'bootstrap', 'sass', 'flutter',
    // Backend
    'node\\.js', 'nodejs', 'express', 'spring boot', 'spring', 'django', 'flask', 'fastapi',
    '.net', 'laravel',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform',
    'jenkins', 'ci/cd', 'linux', 'git',
    // Data
    'power bi', 'tableau', 'excel', 'office', 'pandas', 'numpy', 'spark',
    'hadoop', 'airflow', 'etl',
    // Metodologías
    'scrum', 'agile', 'kanban', 'jira',
    // Otros
    'rest api', 'graphql', 'microservicios', 'selenium', 'figma',
  ];

  const found = new Set();

  for (const pattern of skillPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    if (regex.test(text)) {
      // Normalize skill name
      let skillName = pattern
        .replace(/\\\+/g, '+')
        .replace(/\\\./g, '.')
        .replace(/\\b/g, '')
        .trim();

      // Capitalize properly
      const capitalMap = {
        'python': 'Python', 'java': 'Java', 'javascript': 'JavaScript',
        'typescript': 'TypeScript', 'c#': 'C#', 'c++': 'C++', 'php': 'PHP',
        'ruby': 'Ruby', 'go': 'Go', 'golang': 'Go', 'rust': 'Rust',
        'kotlin': 'Kotlin', 'swift': 'Swift', 'scala': 'Scala', 'r ': 'R',
        'dart': 'Dart',
        'sql': 'SQL', 'mysql': 'MySQL', 'postgresql': 'PostgreSQL',
        'mongodb': 'MongoDB', 'oracle': 'Oracle', 'sql server': 'SQL Server',
        'redis': 'Redis', 'dynamodb': 'DynamoDB', 'firebase': 'Firebase',
        'html': 'HTML', 'css': 'CSS', 'react': 'React', 'angular': 'Angular',
        'vue': 'Vue', 'next.js': 'Next.js', 'nextjs': 'Next.js',
        'tailwind': 'Tailwind', 'bootstrap': 'Bootstrap', 'sass': 'Sass',
        'flutter': 'Flutter',
        'node.js': 'Node.js', 'nodejs': 'Node.js', 'express': 'Express',
        'spring boot': 'Spring Boot', 'spring': 'Spring', 'django': 'Django', 'flask': 'Flask',
        'fastapi': 'FastAPI', '.net': '.NET', 'laravel': 'Laravel',
        'aws': 'AWS', 'azure': 'Azure', 'gcp': 'GCP',
        'google cloud': 'Google Cloud', 'docker': 'Docker',
        'kubernetes': 'Kubernetes', 'terraform': 'Terraform',
        'jenkins': 'Jenkins', 'ci/cd': 'CI/CD', 'linux': 'Linux', 'git': 'Git',
        'power bi': 'Power BI', 'tableau': 'Tableau', 'excel': 'Excel',
        'office': 'Office', 'pandas': 'Pandas', 'numpy': 'NumPy',
        'spark': 'Spark', 'hadoop': 'Hadoop', 'airflow': 'Airflow', 'etl': 'ETL',
        'scrum': 'Scrum', 'agile': 'Agile', 'kanban': 'Kanban', 'jira': 'Jira',
        'rest api': 'REST API', 'graphql': 'GraphQL',
        'microservicios': 'Microservicios', 'selenium': 'Selenium', 'figma': 'Figma',
      };

      skillName = capitalMap[skillName.toLowerCase()] || skillName;
      if (skillName && skillName !== 'R') { // Avoid false positives with 'R'
        found.add(skillName);
      }
    }
  }

  return [...found];
}

/**
 * Calcula el porcentaje de coincidencia con las skills del usuario
 */
function calculateMatchScore(jobSkills, userSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;

  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const matched = jobSkills.filter(skill =>
    userSkillsLower.includes(skill.toLowerCase())
  );

  return Math.round((matched.length / jobSkills.length) * 100);
}

/**
 * Limpia la descripción del HTML/texto largo
 */
function cleanDescription(desc) {
  if (!desc) return '';

  // Remove HTML tags
  let clean = desc.replace(/<[^>]*>/g, ' ');
  // Remove multiple spaces
  clean = clean.replace(/\s+/g, ' ').trim();
  // Limit length
  if (clean.length > 500) {
    clean = clean.substring(0, 500) + '...';
  }
  return clean;
}

/**
 * Detecta la fuente del empleo
 */
function detectSource(job) {
  const publisher = (job.job_publisher || '').toLowerCase();
  if (publisher.includes('linkedin')) return 'LinkedIn';
  if (publisher.includes('indeed')) return 'Indeed';
  if (publisher.includes('computrabajo')) return 'CompuTrabajo';
  if (publisher.includes('bumeran')) return 'Bumeran';
  if (publisher.includes('glassdoor')) return 'Glassdoor';
  return job.job_publisher || 'Web';
}

/**
 * Traduce el tipo de empleo
 */
function translateEmploymentType(type) {
  const map = {
    'FULLTIME': 'Tiempo completo',
    'PARTTIME': 'Medio tiempo',
    'CONTRACTOR': 'Contrato',
    'INTERN': 'Prácticas',
    'TEMPORARY': 'Temporal'
  };
  return map[type] || type || 'No especificado';
}

/**
 * Búsqueda principal: ejecuta múltiples queries y deduplica resultados
 * @param {string[]} userSkills - Skills del usuario
 * @param {string} apiKey - RapidAPI key
 * @param {string} location - Ubicación
 * @param {string} customQuery - Query personalizado (opcional)
 * @returns {Promise<Object>} - { results, queriesUsed, errors }
 */
async function searchAllJobs(userSkills, apiKey, location, customQuery = null) {
  const results = [];
  const errors = [];
  let queriesUsed = [];

  if (customQuery) {
    // Si hay query personalizado, buscar tanto local como remoto
    queriesUsed = [
      { query: `${customQuery} en ${location}`, country: 'pe', remote: false },
      { query: `${customQuery} remote`, country: '', remote: true }
    ];
  } else {
    // Generar queries automáticamente
    queriesUsed = generateSearchQueries(userSkills, location);
  }

  console.log(`[Scraper] Ejecutando ${queriesUsed.length} búsquedas...`);

  // Ejecutar búsquedas con delay entre cada una para no exceder rate limits
  for (let i = 0; i < queriesUsed.length; i++) {
    const config = queriesUsed[i];
    console.log(`[Scraper] (${i + 1}/${queriesUsed.length}) Buscando: "${config.query}" (Remoto: ${config.remote})`);

    try {
      const jobs = await searchJobs(config, apiKey);
      results.push(...jobs);

      // Delay entre búsquedas (1 segundo)
      if (i < queriesUsed.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      errors.push({ query: config.query, error: error.message });
    }
  }

  // Deduplicar por título + empresa
  const seen = new Map();
  const unique = [];

  for (const job of results) {
    const key = `${job.company.toLowerCase()}_${job.title.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      // Calcular match score
      job.matchScore = calculateMatchScore(job.skills, userSkills);
      unique.push(job);
    }
  }

  // Ordenar por match score (mayor primero)
  unique.sort((a, b) => b.matchScore - a.matchScore);

  console.log(`[Scraper] Encontradas ${unique.length} vacantes únicas de ${results.length} resultados totales`);

  return {
    results: unique,
    queriesUsed: queriesUsed.map(q => q.query),
    totalRaw: results.length,
    totalUnique: unique.length,
    errors
  };
}

module.exports = {
  searchAllJobs,
  searchJobs,
  generateSearchQueries,
  calculateMatchScore,
  extractSkills,
  detectArea
};
