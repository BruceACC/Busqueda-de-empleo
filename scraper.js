const axios = require('axios');
const quotaManager = require('./quotaManager');

// ── Configuración de búsqueda ──
const SEARCH_CONFIG = {
  rolePrefixes: ['practicante', 'junior', 'trainee', 'intern'],
  areaTerms: ['desarrollo software', 'tecnología', 'datos', 'developer', 'QA'],
  defaultLocation: 'Lima, Peru',
  keySkillsForSearch: ['SQL', 'Python', 'Java', 'React', 'Angular', 'Node.js']
};

function generateSearchQueries(userSkills, location = SEARCH_CONFIG.defaultLocation, customQuery = null) {
  if (customQuery) {
    return [
      { query: `${customQuery} en ${location}`, country: 'pe', remote: false },
      { query: `${customQuery} remote`, country: '', remote: true }
    ];
  }
  
  const queries = [];
  const addQuery = (q, country, remote) => {
    if (!queries.find(x => x.query === q && x.country === country && x.remote === remote)) {
      queries.push({ query: q, country, remote });
    }
  };

  const importantSkills = userSkills.filter(skill =>
    SEARCH_CONFIG.keySkillsForSearch.some(ks => ks.toLowerCase() === skill.toLowerCase())
  );

  for (const skill of importantSkills.slice(0, 3)) {
    addQuery(`junior ${skill} en ${location}`, 'pe', false);
    addQuery(`junior ${skill} remote`, '', true);
  }
  addQuery(`desarrollador junior en ${location}`, 'pe', false);
  return queries;
}

// ── Utilidades de Extracción ──

function cleanDescription(desc) {
  if (!desc) return '';
  let clean = desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length > 400) clean = clean.substring(0, 400) + '...';
  return clean;
}

function extractSkills(description, title) {
  const text = `${title} ${description}`.toLowerCase();
  const skillPatterns = [
    'python', 'java', 'javascript', 'typescript', 'c#', 'c\\+\\+', 'php', 'ruby',
    'sql', 'mysql', 'postgresql', 'mongodb', 'oracle',
    'html', 'css', 'react', 'angular', 'vue', 'next\\.js', 'tailwind',
    'node\\.js', 'express', 'spring boot', 'django', 'fastapi', '.net',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git',
    'power bi', 'tableau', 'excel', 'pandas', 'scrum', 'agile'
  ];

  const found = new Set();
  const capitalMap = {
    'python': 'Python', 'java': 'Java', 'javascript': 'JavaScript',
    'typescript': 'TypeScript', 'c#': 'C#', 'c++': 'C++', 'php': 'PHP',
    'sql': 'SQL', 'mysql': 'MySQL', 'postgresql': 'PostgreSQL',
    'mongodb': 'MongoDB', 'html': 'HTML', 'css': 'CSS', 'react': 'React',
    'angular': 'Angular', 'vue': 'Vue', 'next.js': 'Next.js', 'tailwind': 'Tailwind',
    'node.js': 'Node.js', 'express': 'Express', 'spring boot': 'Spring Boot',
    'django': 'Django', 'fastapi': 'FastAPI', '.net': '.NET', 'aws': 'AWS',
    'azure': 'Azure', 'gcp': 'GCP', 'docker': 'Docker', 'kubernetes': 'Kubernetes',
    'git': 'Git', 'power bi': 'Power BI', 'tableau': 'Tableau', 'excel': 'Excel',
    'pandas': 'Pandas', 'scrum': 'Scrum', 'agile': 'Agile'
  };

  for (const pattern of skillPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    if (regex.test(text)) {
      let skillName = pattern.replace(/\\\+/g, '+').replace(/\\\./g, '.').replace(/\\b/g, '').trim();
      skillName = capitalMap[skillName.toLowerCase()] || skillName;
      if (skillName) found.add(skillName);
    }
  }
  return [...found];
}

function detectArea(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('data') || text.includes('analyst') || text.includes('bi ')) return 'Datos / Analítica';
  if (text.includes('front') || text.includes('react') || text.includes('angular')) return 'Desarrollo Frontend';
  if (text.includes('back') || text.includes('api') || text.includes('node')) return 'Desarrollo Backend';
  if (text.includes('qa') || text.includes('test')) return 'QA / Testing';
  return 'Tecnología / TI';
}

function calculateMatchScore(jobSkills, userSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const matched = jobSkills.filter(skill => userSkillsLower.includes(skill.toLowerCase()));
  return Math.round((matched.length / jobSkills.length) * 100);
}

// ── Adaptadores de APIs ──

const apiAdapters = [
  {
    name: 'JSearch',
    quotaKey: 'jsearch',
    queriesPerRun: 2, // Limitamos para conservar cuota
    async fetch(queryConfig, apiKey) {
      const params = { query: queryConfig.query, page: '1', num_pages: '1' };
      if (queryConfig.country) params.country = queryConfig.country;
      if (queryConfig.remote) params.remote_jobs_only = 'true';
      
      const res = await axios.get('https://jsearch.p.rapidapi.com/search-v2', {
        params, headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.jobs || []);
      return jobs.map(j => ({
        id: `jsearch_${j.job_id || Date.now() + Math.random()}`,
        company: j.employer_name || 'Desconocida',
        title: j.job_title || 'Sin Título',
        description: j.job_description || '',
        url: j.job_apply_link || j.job_google_link || '',
        location: j.job_city ? `${j.job_city}, ${j.job_country}` : (j.job_country || 'Remoto'),
        source: 'JSearch / Google Jobs'
      }));
    }
  },
  {
    name: 'Apijob',
    quotaKey: 'apijob',
    queriesPerRun: 5, // Tiene buen límite diario
    async fetch(queryConfig, apiKey) {
      // Usando endpoint simulado genérico para Apijob (Ajustar si el endpoint exacto es diferente)
      const res = await axios.get('https://apijobs-apijobs-default.p.rapidapi.com/api/apijob-job-searching-api', {
        params: { q: queryConfig.query, location: queryConfig.country || 'Peru' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'apijobs-apijobs-default.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.jobs || [];
      return jobs.map(j => ({
        id: `apijob_${j.id || Date.now() + Math.random()}`,
        company: j.company_name || 'Desconocida',
        title: j.title || 'Sin Título',
        description: j.description || '',
        url: j.url || '',
        location: j.location || 'Desconocida',
        source: 'Apijob'
      }));
    }
  },
  {
    name: 'Active Jobs DB',
    quotaKey: 'active-jobs-db',
    queriesPerRun: 1, // Límite estricto de 25/mes
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://active-jobs-db.p.rapidapi.com/active-ats', {
        params: { title: queryConfig.query, location: queryConfig.country || 'Peru', limit: 10 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'active-jobs-db.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || [];
      return jobs.map(j => ({
        id: `active_${j.id || Date.now() + Math.random()}`,
        company: j.company || 'Desconocida',
        title: j.title || 'Sin Título',
        description: j.description || '',
        url: j.url || '',
        location: j.location || 'Desconocida',
        source: 'Active Jobs DB'
      }));
    }
  },
  // Añadir placeholders funcionales para el resto, que retornan [] si fallan
  {
    name: 'LinkedIn Jobs',
    quotaKey: 'linkedin-jobs',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://linkedin-job-search-api.p.rapidapi.com/search-jobs-v2', {
        params: { keywords: queryConfig.query, location: queryConfig.country || 'Peru' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'linkedin-job-search-api.p.rapidapi.com' }, timeout: 10000
      });
      return (res.data?.data || []).map(j => ({
        id: `li_${Date.now() + Math.random()}`,
        company: j.company || 'Desconocida', title: j.title || 'Sin Título',
        description: j.description || '', url: j.url || '', location: j.location || 'Remoto', source: 'LinkedIn'
      }));
    }
  },
  {
    name: 'Google Jobs API',
    quotaKey: 'google-jobs',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://google-jobs-api.p.rapidapi.com/search', {
        params: { query: queryConfig.query },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'google-jobs-api.p.rapidapi.com' }, timeout: 10000
      });
      return (res.data?.jobs || []).map(j => ({
        id: `gj_${Date.now() + Math.random()}`,
        company: j.company_name || 'Desconocida', title: j.title || 'Sin Título',
        description: j.description || '', url: j.url || '', location: j.location || 'Remoto', source: 'Google Jobs'
      }));
    }
  },
  {
    name: 'Indeed Jobs API',
    quotaKey: 'indeed-jobs',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://indeed-jobs-api.p.rapidapi.com/search', {
        params: { q: queryConfig.query, l: queryConfig.country || 'Peru' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'indeed-jobs-api.p.rapidapi.com' }, timeout: 10000
      });
      return (res.data?.jobs || []).map(j => ({
        id: `ind_${Date.now() + Math.random()}`,
        company: j.company || 'Desconocida', title: j.title || 'Sin Título',
        description: j.description || '', url: j.url || '', location: j.location || 'Remoto', source: 'Indeed'
      }));
    }
  },
  {
    name: 'JOBS SEARCH API',
    quotaKey: 'jobs-search-api',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://jobs-search-api.p.rapidapi.com/search', {
        params: { query: queryConfig.query },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'jobs-search-api.p.rapidapi.com' }, timeout: 10000
      });
      return (res.data?.data || []).map(j => ({
        id: `jsapi_${Date.now() + Math.random()}`,
        company: j.company || 'Desconocida', title: j.title || 'Sin Título',
        description: j.description || '', url: j.url || '', location: j.location || 'Remoto', source: 'Jobs Search API'
      }));
    }
  }
];

// ── Búsqueda Principal ──

async function searchAllJobs(userSkills, apiKey, location, customQuery = null) {
  const allQueries = generateSearchQueries(userSkills, location, customQuery);
  console.log(`[Scraper] Se generaron ${allQueries.length} queries base.`);

  const results = [];
  const errors = [];
  const stats = {};

  // Ejecutamos adaptadores en paralelo
  const fetchPromises = apiAdapters.map(async (adapter) => {
    stats[adapter.name] = { attempted: 0, successful: 0, itemsFound: 0 };
    
    // Solo tomamos la cantidad de queries que esta API permite por ejecución para no agotar cuotas
    const queriesForAdapter = allQueries.slice(0, adapter.queriesPerRun);

    for (const query of queriesForAdapter) {
      if (!quotaManager.canUse(adapter.quotaKey)) {
        console.log(`[Scraper] ⚠️ Omitiendo ${adapter.name} por límite de cuota de seguridad.`);
        break; // Límite alcanzado, salir del loop para esta API
      }

      stats[adapter.name].attempted++;
      try {
        console.log(`[Scraper] -> ${adapter.name}: Buscando "${query.query}"...`);
        
        // Petición real
        const jobs = await adapter.fetch(query, apiKey);
        
        // Descontar cuota
        quotaManager.increment(adapter.quotaKey, 1);
        
        stats[adapter.name].successful++;
        
        // Normalización final
        for (const j of jobs) {
          if (!j.title) continue;
          j.area = detectArea(j.title, j.description);
          j.skills = extractSkills(j.description, j.title);
          j.description = cleanDescription(j.description);
          j.matchScore = calculateMatchScore(j.skills, userSkills);
          j.status = 'pending';
          j.dateAdded = new Date().toISOString().split('T')[0];
          results.push(j);
          stats[adapter.name].itemsFound++;
        }
      } catch (error) {
        let errMsg = error.message;
        if (error.response) errMsg = `${error.response.status} - ${error.response.statusText}`;
        console.error(`[Scraper] ❌ Error en ${adapter.name}: ${errMsg}`);
        errors.push({ api: adapter.name, query: query.query, error: errMsg });
        
        // Si hay Rate Limit 429, pausamos esta API en este ciclo
        if (error.response && error.response.status === 429) {
          console.warn(`[Scraper] ⏸️ Rate limit (429) en ${adapter.name}. Deteniendo peticiones para esta API.`);
          break; 
        }
      }
      
      // Pequeño delay entre queries de la misma API para respetar rate limits internos
      await new Promise(r => setTimeout(r, 1000));
    }
  });

  await Promise.allSettled(fetchPromises);

  // Deduplicación global
  const seen = new Map();
  const unique = [];
  for (const job of results) {
    const key = `${job.company.toLowerCase().trim()}_${job.title.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(job);
    }
  }

  unique.sort((a, b) => b.matchScore - a.matchScore);
  
  console.log(`[Scraper] ✨ Búsqueda completada. Total combinados: ${results.length}. Únicos: ${unique.length}`);
  console.log('[Scraper] Estadísticas por API:', stats);

  return {
    results: unique,
    queriesUsed: allQueries.map(q => q.query),
    totalRaw: results.length,
    totalUnique: unique.length,
    stats,
    errors
  };
}

module.exports = {
  searchAllJobs,
  generateSearchQueries,
  calculateMatchScore,
  extractSkills,
  detectArea
};
