/* ═══════════════════════════════════════════════
   SERVER - Express backend para Agenda de Postulaciones
   ═══════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { searchAllJobs, calculateMatchScore, extractSkills, detectArea } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'vacancies.json');

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════
// ── Data Persistence ──
// ══════════════════════════════════════

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('[Data] Error leyendo datos:', error.message);
    const defaultData = { vacancies: [], mySkills: [], lastSearch: null };
    writeData(defaultData);
    return defaultData;
  }
}

function writeData(data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Data] Error escribiendo datos:', error.message);
  }
}

// ══════════════════════════════════════
// ── API Routes ──
// ══════════════════════════════════════

/**
 * GET /api/status
 * Verifica si la API Key está configurada
 */
app.get('/api/status', (req, res) => {
  const hasApiKey = process.env.RAPIDAPI_KEY &&
    process.env.RAPIDAPI_KEY !== 'TU_API_KEY_AQUI' &&
    process.env.RAPIDAPI_KEY.length > 10;

  res.json({
    ok: true,
    apiKeyConfigured: hasApiKey,
    serverTime: new Date().toISOString()
  });
});

/**
 * GET /api/vacancies
 * Retorna todas las vacantes guardadas
 */
app.get('/api/vacancies', (req, res) => {
  try {
    const data = readData();
    res.json({
      ok: true,
      vacancies: data.vacancies,
      mySkills: data.mySkills,
      lastSearch: data.lastSearch
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/vacancies
 * Guarda o actualiza una vacante
 */
app.post('/api/vacancies', (req, res) => {
  try {
    const data = readData();
    const vacancy = req.body;

    if (!vacancy || !vacancy.id) {
      return res.status(400).json({ ok: false, error: 'Vacancy must have an id' });
    }

    const existingIdx = data.vacancies.findIndex(v => v.id === vacancy.id);
    if (existingIdx >= 0) {
      // Update existing
      data.vacancies[existingIdx] = { ...data.vacancies[existingIdx], ...vacancy };
    } else {
      // Add new
      data.vacancies.unshift(vacancy);
    }

    writeData(data);
    res.json({ ok: true, vacancy: data.vacancies.find(v => v.id === vacancy.id) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/vacancies/bulk
 * Guarda múltiples vacantes de una búsqueda (solo las nuevas)
 */
app.post('/api/vacancies/bulk', (req, res) => {
  try {
    const data = readData();
    const { vacancies: newVacancies } = req.body;

    if (!Array.isArray(newVacancies)) {
      return res.status(400).json({ ok: false, error: 'Expected array of vacancies' });
    }

    let added = 0;
    let skipped = 0;

    for (const vacancy of newVacancies) {
      // Check if already exists (by company + title to handle different IDs)
      const exists = data.vacancies.some(v =>
        v.company.toLowerCase() === vacancy.company.toLowerCase() &&
        v.title.toLowerCase() === vacancy.title.toLowerCase()
      );

      if (!exists) {
        data.vacancies.unshift(vacancy);
        added++;
      } else {
        skipped++;
      }
    }

    data.lastSearch = new Date().toISOString();
    writeData(data);

    res.json({ ok: true, added, skipped, total: data.vacancies.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * PATCH /api/vacancies/:id/status
 * Actualiza el estado de una vacante (pending/applied)
 */
app.patch('/api/vacancies/:id/status', (req, res) => {
  try {
    const data = readData();
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'applied'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'Status must be "pending" or "applied"' });
    }

    const vacancy = data.vacancies.find(v => v.id === id);
    if (!vacancy) {
      return res.status(404).json({ ok: false, error: 'Vacancy not found' });
    }

    vacancy.status = status;
    vacancy.dateApplied = status === 'applied'
      ? new Date().toISOString().split('T')[0]
      : null;

    writeData(data);
    res.json({ ok: true, vacancy });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * DELETE /api/vacancies/:id
 * Elimina una vacante
 */
app.delete('/api/vacancies/:id', (req, res) => {
  try {
    const data = readData();
    const { id } = req.params;
    const before = data.vacancies.length;
    data.vacancies = data.vacancies.filter(v => v.id !== id);

    if (data.vacancies.length === before) {
      return res.status(404).json({ ok: false, error: 'Vacancy not found' });
    }

    writeData(data);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/vacancies/manual
 * Agrega una vacante manualmente
 */
app.post('/api/vacancies/manual', (req, res) => {
  try {
    const data = readData();
    const body = req.body;

    const vacancy = {
      id: 'manual_' + Date.now(),
      company: body.company || '',
      title: body.title || '',
      area: body.area || 'Tecnología / TI',
      description: body.description || '',
      skills: body.skills || [],
      url: body.url || '',
      source: body.source || 'Manual',
      logo: null,
      location: body.location || 'Lima, Peru',
      employmentType: 'Prácticas',
      postedDate: null,
      status: 'pending',
      dateAdded: new Date().toISOString().split('T')[0],
      dateApplied: null,
      matchScore: calculateMatchScore(body.skills || [], data.mySkills)
    };

    data.vacancies.unshift(vacancy);
    writeData(data);

    res.json({ ok: true, vacancy });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/skills
 * Retorna las habilidades del usuario
 */
app.get('/api/skills', (req, res) => {
  try {
    const data = readData();
    res.json({ ok: true, skills: data.mySkills });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * PUT /api/skills
 * Actualiza las habilidades del usuario
 */
app.put('/api/skills', (req, res) => {
  try {
    const data = readData();
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ ok: false, error: 'Expected array of skills' });
    }

    data.mySkills = skills;

    // Recalculate match scores for all vacancies
    for (const v of data.vacancies) {
      v.matchScore = calculateMatchScore(v.skills, data.mySkills);
    }

    writeData(data);
    res.json({ ok: true, skills: data.mySkills });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/search
 * Busca vacantes automáticamente usando JSearch API
 */
app.post('/api/search', async (req, res) => {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
      return res.status(400).json({
        ok: false,
        error: 'API Key no configurada. Agrega tu RAPIDAPI_KEY en el archivo .env'
      });
    }

    const data = readData();
    const { customQuery, location } = req.body;
    const searchLocation = location || 'Lima, Peru';

    console.log('\n══════════════════════════════════════');
    console.log('🔍 Iniciando búsqueda automática...');
    console.log('══════════════════════════════════════');

    const searchResult = await searchAllJobs(
      data.mySkills,
      apiKey,
      searchLocation,
      customQuery
    );

    // Calculate match scores with user's skills
    for (const job of searchResult.results) {
      job.matchScore = calculateMatchScore(job.skills, data.mySkills);
    }

    res.json({
      ok: true,
      results: searchResult.results,
      meta: {
        queriesUsed: searchResult.queriesUsed,
        totalRaw: searchResult.totalRaw,
        totalUnique: searchResult.totalUnique,
        errors: searchResult.errors,
        searchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Search] Error:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * DELETE /api/vacancies
 * Elimina todas las vacantes (reset)
 */
app.delete('/api/vacancies', (req, res) => {
  try {
    const data = readData();
    data.vacancies = [];
    data.lastSearch = null;
    writeData(data);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Serve frontend for all other routes ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  📋 Agenda de Postulaciones');
  console.log(`  🌐 http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════');

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    console.log('');
    console.log('  ⚠️  API Key NO configurada');
    console.log('  📝 Edita el archivo .env y agrega tu RAPIDAPI_KEY');
    console.log('  🔗 https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch');
  } else {
    console.log(`  ✅ API Key configurada`);
  }
  console.log('');
});
