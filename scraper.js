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
  const remoteCountries = ['España', 'Colombia', 'Chile', 'México', 'Canadá', 'USA', 'Brasil', 'Argentina'];
  const queries = [];
  
  const addQuery = (q, country, remote) => {
    if (!queries.find(x => x.query === q && x.country === country && x.remote === remote)) {
      queries.push({ query: q, country, remote });
    }
  };

  if (customQuery) {
    addQuery(`${customQuery} en ${location}`, 'Peru', false);
    addQuery(`${customQuery} remote`, '', true);
    for (const c of remoteCountries) {
      addQuery(`${customQuery} remote`, c, true);
    }
    return queries;
  }
  
  const importantSkills = userSkills.filter(skill =>
    SEARCH_CONFIG.keySkillsForSearch.some(ks => ks.toLowerCase() === skill.toLowerCase())
  );

  for (const skill of importantSkills.slice(0, 3)) {
    // Local / Presencial o Remoto en Perú
    addQuery(`junior ${skill} en ${location}`, 'Peru', false);
    addQuery(`junior ${skill} remote`, '', true);
    
    // Remoto en el extranjero
    for (const c of remoteCountries) {
       addQuery(`junior ${skill} remote`, c, true);
    }
  }
  
  // Genérico
  addQuery(`desarrollador junior en ${location}`, 'Peru', false);
  for (const c of remoteCountries) {
    addQuery(`desarrollador junior remote`, c, true);
  }
  
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

function detectExperience(description = '') {
  const text = description.toLowerCase();
  
  // Buscar menciones explícitas de no experiencia
  if (text.includes('sin experiencia') || text.includes('no requiere experiencia') || text.includes('0 años')) {
    return 'Sin experiencia';
  }

  // Buscar patrones como "1 año", "2 años", "+3 años", "1 a 2 años", "1-2 años"
  const expPatterns = [
    /([1-9])\s*a\s*([1-9])\s*año[s]?/i,
    /([1-9])-([1-9])\s*año[s]?/i,
    /([1-9])\s*año[s]?/i,
    /\+([1-9])\s*año[s]?/i,
    /m[íi]nimo\s*([1-9])\s*año[s]?/i
  ];

  let maxYears = 0;
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[1]);
      if (years > maxYears) maxYears = years;
    }
  }

  if (maxYears > 0) {
    return `${maxYears} año${maxYears > 1 ? 's' : ''}`;
  }

  return 'No especificada';
}

function detectSeniority(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('gerente') || text.includes('manager') || text.includes('director') || text.includes('jefe') || text.includes('lead')) return { level: 5, name: 'Gerente / Lead' };
  if (text.match(/\bsenior\b/i) || text.match(/\bsr\.?\b/i) || text.includes('experto')) return { level: 4, name: 'Senior' };
  if (text.match(/\bsemi[-\s]senior\b/i) || text.match(/\bssr\.?\b/i) || text.includes('mid-level')) return { level: 3, name: 'Semi-Senior' };
  if (text.match(/\bjunior\b/i) || text.match(/\bjr\.?\b/i) || text.includes('asistente')) return { level: 2, name: 'Junior' };
  if (text.includes('trainee') || text.includes('entrenamiento')) return { level: 1, name: 'Trainee' };
  if (text.includes('practicante') || text.includes('intern') || text.includes('estudiante') || text.includes('becario')) return { level: 0, name: 'Practicante' };
  
  return { level: -1, name: 'No especificado' };
}

function calculateMatchScore(jobSkills, userSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const matched = jobSkills.filter(skill => userSkillsLower.includes(skill.toLowerCase()));
  return Math.round((matched.length / jobSkills.length) * 100);
}

// ── Adaptadores de APIs ──

const apiAdapters = [
  // ═══════════════════════════════════
  // ── APIs EXISTENTES ──
  // ═══════════════════════════════════
  {
    name: 'JSearch',
    quotaKey: 'jsearch',
    queriesPerRun: 2,
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
    queriesPerRun: 5,
    async fetch(queryConfig, apiKey) {
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
    queriesPerRun: 1,
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
  },

  // ═══════════════════════════════════
  // ── NUEVAS APIs INTEGRADAS ──
  // ═══════════════════════════════════

  // 1. Jobicy - API PÚBLICA (no consume cuota de RapidAPI, es gratuita sin API key)
  {
    name: 'Jobicy (Remote)',
    quotaKey: 'jobicy',
    queriesPerRun: 2,
    async fetch(queryConfig, _apiKey) {
      // Jobicy tiene API pública gratuita, no necesita API key
      const tag = queryConfig.query.split(' ')[0]; // Primer palabra como tag
      const res = await axios.get('https://jobicy.com/api/v2/remote-jobs', {
        params: { count: 50, tag: tag, industry: 'engineering' },
        timeout: 10000
      });
      const jobs = res.data?.jobs || [];
      return jobs.map(j => ({
        id: `jobicy_${j.id || Date.now() + Math.random()}`,
        company: j.companyName || 'Desconocida',
        title: j.jobTitle || 'Sin Título',
        description: j.jobDescription || j.jobExcerpt || '',
        url: j.url || '',
        location: j.jobGeo || 'Remoto',
        employmentType: j.jobType || 'Tiempo completo',
        source: 'Jobicy'
      }));
    }
  },

  // 2. Job Postings (Techmap) - 9,000/mes
  {
    name: 'Job Postings (Techmap)',
    quotaKey: 'job-postings-techmap',
    queriesPerRun: 3,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://job-postings1.p.rapidapi.com/api', {
        params: { search: queryConfig.query, results_per_page: 20 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'job-postings1.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || res.data || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `techmap_${j.id || j._id || Date.now() + Math.random()}`,
        company: j.company || j.organization || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || j.body || '',
        url: j.url || j.link || '',
        location: j.location || j.city || 'No especificada',
        source: 'Techmap Job Postings'
      }));
    }
  },

  // 3. Job Listings - 200/mes
  {
    name: 'Job Listings',
    quotaKey: 'job-listings',
    queriesPerRun: 2,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://job-listings4.p.rapidapi.com/api/job-listings', {
        params: { query: queryConfig.query, limit: 20 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'job-listings4.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || res.data?.results || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `jlist_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.employer || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || '',
        url: j.url || j.link || '',
        location: j.location || 'No especificada',
        source: 'Job Listings'
      }));
    }
  },

  // 4. Internships API (Fantastic.Jobs) - 200/mes - ¡Perfecto para practicantes!
  {
    name: 'Internships API',
    quotaKey: 'internships-api',
    queriesPerRun: 2,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://internships-api.p.rapidapi.com/active-ats-7d', {
        params: { title_filter: queryConfig.query, location_filter: queryConfig.country || '', description_type: 'text' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'internships-api.p.rapidapi.com' }, timeout: 15000
      });
      const jobs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return jobs.slice(0, 30).map(j => ({
        id: `intern_${j.id || Date.now() + Math.random()}`,
        company: j.company_name || j.company || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || j.text_description || '',
        url: j.url || j.application_url || '',
        location: j.location || j.city || 'Remoto',
        source: 'Internships API'
      }));
    }
  },

  // 5. Glassdoor Real-Time - 200/mes
  {
    name: 'Glassdoor Real-Time',
    quotaKey: 'glassdoor-realtime',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://glassdoor-real-time.p.rapidapi.com/search-jobs', {
        params: { query: queryConfig.query, location: queryConfig.country || 'Peru', page: 1 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'glassdoor-real-time.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `gdrt_${j.id || j.jobId || Date.now() + Math.random()}`,
        company: j.employer || j.company || 'Desconocida',
        title: j.jobTitle || j.title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.jobLink || '',
        location: j.location || 'No especificada',
        source: 'Glassdoor'
      }));
    }
  },

  // 6. Jobs API (200/mo)
  {
    name: 'Jobs API (200)',
    quotaKey: 'jobs-api-200',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://jobs-api14.p.rapidapi.com/v2/list', {
        params: { query: queryConfig.query, location: queryConfig.country || 'Peru', language: 'es_ES' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'jobs-api14.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.jobs || res.data?.data || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `japi200_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.employer_name || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.link || '',
        location: j.location || 'No especificada',
        source: 'Jobs API'
      }));
    }
  },

  // 7. ByteBricks - 100/mes
  {
    name: 'ByteBricks',
    quotaKey: 'bytebricks',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://bytebricks.p.rapidapi.com/api/jobs/search', {
        params: { query: queryConfig.query, page: 1 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'bytebricks.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || res.data?.results || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `bb_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.company_name || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || '',
        url: j.url || j.apply_url || '',
        location: j.location || 'Remoto',
        source: 'ByteBricks'
      }));
    }
  },

  // 8. Upwork Jobs - 100/día
  {
    name: 'Upwork Jobs',
    quotaKey: 'upwork-jobs',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://upwork-jobs-api2.p.rapidapi.com/active-freelance-7d', {
        params: { title_filter: queryConfig.query, description_type: 'text' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'upwork-jobs-api2.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return jobs.slice(0, 20).map(j => ({
        id: `upwork_${j.id || Date.now() + Math.random()}`,
        company: j.company_name || 'Freelance/Upwork',
        title: j.title || 'Sin Título',
        description: j.description || j.text_description || '',
        url: j.url || '',
        location: 'Remoto (Freelance)',
        employmentType: 'Freelance',
        source: 'Upwork'
      }));
    }
  },

  // 9. Job Search (50/mes)
  {
    name: 'Job Search 50',
    quotaKey: 'job-search-50',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://job-search38.p.rapidapi.com/my/search', {
        params: { query: queryConfig.query, location: queryConfig.country || 'Peru', limit: 15 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'job-search38.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || res.data?.results || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `js50_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.employer || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.link || '',
        location: j.location || 'No especificada',
        source: 'Job Search'
      }));
    }
  },

  // 10. HireBase Jobs Data - 50/mes (POST endpoint)
  {
    name: 'HireBase',
    quotaKey: 'hirebase',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.post('https://hirebase1.p.rapidapi.com/v2/jobs/search', 
        { query: queryConfig.query, location: queryConfig.country || 'Remote' },
        { headers: { 'content-type': 'application/json', 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'hirebase1.p.rapidapi.com' }, timeout: 10000 }
      );
      const jobs = res.data?.data || res.data?.jobs || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `hb_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.company_name || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || '',
        url: j.url || j.apply_url || '',
        location: j.location || j.city || 'Remoto',
        source: 'HireBase'
      }));
    }
  },

  // 11. Remoote Job Search - 50/mes
  {
    name: 'Remoote Job Search',
    quotaKey: 'remoote-job-search',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://remoote-job-search.p.rapidapi.com/v1/jobs/search', {
        params: { query: queryConfig.query, page: 1, limit: 20 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'remoote-job-search.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `remoote_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.company_name || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || '',
        url: j.url || j.link || '',
        location: j.location || 'Remoto',
        source: 'Remoote'
      }));
    }
  },

  // 12. Jobs API (50/mo)
  {
    name: 'Jobs API (50)',
    quotaKey: 'jobs-api-50',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://jobs-api50.p.rapidapi.com/api/v1/search', {
        params: { query: queryConfig.query, location: queryConfig.country || 'Peru' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'jobs-api50.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `japi50_${j.id || Date.now() + Math.random()}`,
        company: j.company || 'Desconocida',
        title: j.title || 'Sin Título',
        description: j.description || '',
        url: j.url || '',
        location: j.location || 'No especificada',
        source: 'Jobs API'
      }));
    }
  },

  // 13. Remote Jobs - 20/mes
  {
    name: 'Remote Jobs',
    quotaKey: 'remote-jobs',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://remote-jobs2.p.rapidapi.com/remote-jobs', {
        params: { query: queryConfig.query, limit: 20 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'remote-jobs2.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `remote_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.company_name || 'Desconocida',
        title: j.title || j.position || 'Sin Título',
        description: j.description || '',
        url: j.url || j.link || '',
        location: 'Remoto',
        source: 'Remote Jobs'
      }));
    }
  },

  // 14. Monster Jobs - 25/mes
  {
    name: 'Monster Jobs',
    quotaKey: 'monster-jobs',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://monster-jobs-api.p.rapidapi.com/search', {
        params: { query: queryConfig.query, location: queryConfig.country || 'Peru', page: 1 },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'monster-jobs-api.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || res.data?.results || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `monster_${j.id || j.jobId || Date.now() + Math.random()}`,
        company: j.company || j.companyName || 'Desconocida',
        title: j.title || j.jobTitle || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.applyUrl || '',
        location: j.location || 'No especificada',
        source: 'Monster'
      }));
    }
  },

  // 15. Glassdoor Jobs Scraper - 25/mes
  {
    name: 'Glassdoor Scraper',
    quotaKey: 'glassdoor-scraper',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://glassdoor-jobs-scraper-api.p.rapidapi.com/search-jobs', {
        params: { query: queryConfig.query, location: queryConfig.country || 'Peru' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'glassdoor-jobs-scraper-api.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.data || res.data?.jobs || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `gdscrape_${j.id || j.jobId || Date.now() + Math.random()}`,
        company: j.employer || j.company || 'Desconocida',
        title: j.jobTitle || j.title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.jobLink || '',
        location: j.location || 'No especificada',
        source: 'Glassdoor'
      }));
    }
  },
  
  // ═══════════════════════════════════
  // ── NUEVAS APIs REGIONALES INDEED ──
  // ═══════════════════════════════════

  {
    name: 'Indeed Daily (10/day)',
    quotaKey: 'indeed-daily',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      // Intentamos usar el endpoint de mantiks (indeed12) que parece dar 10/day
      const res = await axios.get('https://indeed12.p.rapidapi.com/jobs/search', {
        params: { query: queryConfig.query, location: queryConfig.country || 'Peru' },
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'indeed12.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.jobs || res.data?.data || res.data || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `ind_daily_${j.id || Date.now() + Math.random()}`,
        company: j.company || j.employer_name || 'Desconocida',
        title: j.title || j.job_title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.link || '',
        location: j.location || 'Remoto',
        source: 'Indeed (Diario)'
      }));
    }
  },
  {
    name: 'Indeed Denmark',
    quotaKey: 'indeed-denmark',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://indeed-jobs-api-denmark.p.rapidapi.com/search', {
        params: { q: queryConfig.query }, // Solo busca en DK
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'indeed-jobs-api-denmark.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.jobs || res.data?.data || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `ind_dk_${j.id || Date.now() + Math.random()}`,
        company: j.company || 'Desconocida',
        title: j.title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.link || '',
        location: 'Denmark',
        source: 'Indeed Denmark'
      }));
    }
  },
  {
    name: 'Indeed Finland',
    quotaKey: 'indeed-finland',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://indeed-jobs-api-finland.p.rapidapi.com/search', {
        params: { q: queryConfig.query }, // Solo busca en FI
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'indeed-jobs-api-finland.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.jobs || res.data?.data || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `ind_fi_${j.id || Date.now() + Math.random()}`,
        company: j.company || 'Desconocida',
        title: j.title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.link || '',
        location: 'Finland',
        source: 'Indeed Finland'
      }));
    }
  },
  {
    name: 'Indeed Sweden',
    quotaKey: 'indeed-sweden',
    queriesPerRun: 1,
    async fetch(queryConfig, apiKey) {
      const res = await axios.get('https://indeed-jobs-api-sweden.p.rapidapi.com/search', {
        params: { q: queryConfig.query }, // Solo busca en SE
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'indeed-jobs-api-sweden.p.rapidapi.com' }, timeout: 10000
      });
      const jobs = res.data?.jobs || res.data?.data || [];
      const list = Array.isArray(jobs) ? jobs : [];
      return list.map(j => ({
        id: `ind_se_${j.id || Date.now() + Math.random()}`,
        company: j.company || 'Desconocida',
        title: j.title || 'Sin Título',
        description: j.description || j.snippet || '',
        url: j.url || j.link || '',
        location: 'Sweden',
        source: 'Indeed Sweden'
      }));
    }
  }
];

// ── Búsqueda Principal ──

async function searchAllJobs(userSkills, apiKey, location, customQuery = null) {
  const allQueries = generateSearchQueries(userSkills, location, customQuery);
  
  // Shuffle allQueries to ensure variety in countries and skills across different runs
  for (let i = allQueries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQueries[i], allQueries[j]] = [allQueries[j], allQueries[i]];
  }
  
  console.log(`[Scraper] Se generaron ${allQueries.length} queries base (mezcladas aleatoriamente para cubrir más países).`);

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
          j.experience = detectExperience(j.description);
          const sen = detectSeniority(j.title, j.description);
          j.seniority = sen.name;
          j.seniorityLevel = sen.level;
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
  detectArea,
  detectExperience,
  detectSeniority
};
