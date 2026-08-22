/* ═══════════════════════════════════════════════
   AGENDA DE POSTULACIONES - Frontend Application
   Conecta con el backend para búsqueda automática
   ═══════════════════════════════════════════════ */

const API_BASE = '';  // Same origin

// ── App State ──
let vacancies = [];
let mySkills = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSkillFilter = null;
let currentExpFilter = 'all';
let currentExpMin = null;
let currentExpMax = null;
let confirmAction = null;
let isSearching = false;
let apiKeyConfigured = false;

// ══════════════════════════════════════
// ── Initialization ──
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  setupParticles();
  setupFilterListener();
  await checkApiStatus();
  await loadData();
  renderAll();
});

async function checkApiStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();
    apiKeyConfigured = data.apiKeyConfigured;

    if (!apiKeyConfigured) {
      document.getElementById('api-warning').style.display = 'flex';
    }
  } catch (error) {
    console.error('Error checking API status:', error);
  }
}

async function loadData() {
  try {
    const res = await fetch(`${API_BASE}/api/vacancies`);
    const data = await res.json();

    if (data.ok) {
      vacancies = data.vacancies || [];
      mySkills = data.mySkills || [];

      if (data.lastSearch) {
        const lastDate = new Date(data.lastSearch);
        document.getElementById('last-search-time').textContent =
          `Última búsqueda: ${formatDateTime(data.lastSearch)}`;
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('❌ Error conectando con el servidor', 'error');
  }
}


// ══════════════════════════════════════
// ── Automatic Search ──
// ══════════════════════════════════════

async function startSearch() {
  if (isSearching) return;

  if (!apiKeyConfigured) {
    showToast('⚠️ Configura tu API Key en .env primero', 'error');
    return;
  }

  isSearching = true;
  const searchBtn = document.getElementById('btn-search');
  const searchBtnText = document.getElementById('search-btn-text');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const loadingSubtext = document.getElementById('loading-subtext');
  const loadingProgress = document.getElementById('loading-progress');

  // Show loading
  searchBtn.disabled = true;
  searchBtnText.textContent = '⏳ Buscando...';
  loadingOverlay.style.display = 'flex';
  loadingText.textContent = '🔍 Buscando vacantes...';
  loadingSubtext.textContent = 'Analizando múltiples portales de empleo con tus habilidades';
  loadingProgress.textContent = 'Conectando con JSearch API...';

  const customQuery = document.getElementById('custom-search-input').value.trim() || null;
  const location = document.getElementById('location-input').value.trim() || 'Lima, Peru';

  try {
    loadingProgress.textContent = 'Enviando búsquedas...';

    const res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customQuery, location })
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || 'Error en la búsqueda');
    }

    loadingText.textContent = '💾 Guardando resultados...';
    loadingProgress.textContent = `Encontradas ${data.results.length} vacantes únicas`;

    if (data.results.length > 0) {
      // Save results to backend
      const saveRes = await fetch(`${API_BASE}/api/vacancies/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancies: data.results })
      });

      const saveData = await saveRes.json();

      if (saveData.ok) {
        showToast(
          `✅ ${saveData.added} vacantes nuevas agregadas (${saveData.skipped} ya existían)`,
          'success'
        );
      }

      // Show search info
      const infoEl = document.getElementById('search-info');
      infoEl.style.display = 'block';
      infoEl.innerHTML = `
        <strong>Última búsqueda:</strong> ${data.results.length} vacantes encontradas
        (${data.meta.totalRaw} resultados en ${data.meta.queriesUsed.length} búsquedas).
        ${data.meta.errors.length > 0 ? `⚠️ ${data.meta.errors.length} búsquedas con error.` : '✅ Sin errores.'}
      `;
    } else {
      showToast('🔍 No se encontraron vacantes nuevas con esos criterios', 'info');
    }

    // Update last search time
    document.getElementById('last-search-time').textContent =
      `Última búsqueda: ${formatDateTime(new Date().toISOString())}`;

    // Reload data
    await loadData();
    renderAll();

  } catch (error) {
    console.error('Search error:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
  } finally {
    // Hide loading
    loadingOverlay.style.display = 'none';
    searchBtn.disabled = false;
    searchBtnText.textContent = '🔍 Buscar Vacantes';
    isSearching = false;
  }
}


// ══════════════════════════════════════
// ── Rendering ──
// ══════════════════════════════════════

function renderAll() {
  renderStats();
  renderMySkills();
  renderSkillsFilterBar();
  renderVacancies();
}

function renderStats() {
  const total = vacancies.length;
  const applied = vacancies.filter(v => v.status === 'applied').length;
  const pending = total - applied;
  const rate = total > 0 ? Math.round((applied / total) * 100) : 0;

  animateCounter('stat-total', total);
  animateCounter('stat-pending', pending);
  animateCounter('stat-applied', applied);
  document.getElementById('stat-rate').textContent = rate + '%';
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 500;
  const steps = 20;
  const increment = (target - current) / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    if (step >= steps) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current + increment * step);
    }
  }, duration / steps);
}

function renderMySkills() {
  const container = document.getElementById('my-skills-list');
  container.innerHTML = mySkills.map(skill =>
    `<span class="profile-skill">✅ ${escapeHtml(skill)}</span>`
  ).join('');
}

function renderSkillsFilterBar() {
  const container = document.getElementById('skills-filter-bar');
  const allSkills = new Set();
  vacancies.forEach(v => {
    if (v.skills) v.skills.forEach(s => allSkills.add(s));
  });

  const sorted = [...allSkills].sort();
  container.innerHTML = `<span class="skills-bar__label">🏷️ Filtrar por skill:</span>` +
    sorted.map(skill => {
      const isActive = currentSkillFilter === skill;
      const isMySkill = mySkills.some(s => s.toLowerCase() === skill.toLowerCase());
      return `<button class="skill-filter ${isActive ? 'skill-filter--active' : ''}"
                      onclick="toggleSkillFilter('${escapeHtml(skill)}')"
                      title="${isMySkill ? '✅ Tienes esta habilidad' : ''}">
                ${escapeHtml(skill)} ${isMySkill ? '✅' : ''}
              </button>`;
    }).join('');
}

function renderVacancies() {
  const grid = document.getElementById('vacancies-grid');
  let filtered = getFilteredVacancies();

  if (filtered.length === 0) {
    const message = vacancies.length === 0
      ? 'Haz clic en "🔍 Buscar Vacantes" para encontrar oportunidades automáticamente.'
      : 'Intenta cambiar los filtros o realiza una nueva búsqueda.';

    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">${vacancies.length === 0 ? '🚀' : '🔍'}</span>
        <h3 class="empty-state__title">${vacancies.length === 0 ? '¡Empieza a buscar!' : 'No se encontraron vacantes'}</h3>
        <p class="empty-state__desc">${message}</p>
      </div>`;
    return;
  }

  // Sort: pending first, then by match score, then by date
  filtered.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    if ((b.matchScore || 0) !== (a.matchScore || 0)) return (b.matchScore || 0) - (a.matchScore || 0);
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });

  grid.innerHTML = filtered.map((v, idx) => renderCard(v, idx)).join('');
}

function renderCard(v, index) {
  const isPending = v.status === 'pending';
  const statusClass = isPending ? 'vacancy-card--pending' : 'vacancy-card--applied';
  const statusText = isPending ? 'Pendiente' : 'Postulado';
  const actionBtn = isPending
    ? `<button class="btn btn--danger btn--sm" onclick="markAsApplied('${v.id}')">🔴 Postulado</button>`
    : `<button class="btn btn--success btn--sm" onclick="markAsPending('${v.id}')">🟢 Desmarcar</button>`;

  // Match score badge
  const matchScore = v.matchScore || 0;
  let matchClass = 'match-badge--low';
  let matchBarClass = 'match-bar__fill--low';
  if (matchScore >= 70) { matchClass = 'match-badge--high'; matchBarClass = 'match-bar__fill--high'; }
  else if (matchScore >= 40) { matchClass = 'match-badge--medium'; matchBarClass = 'match-bar__fill--medium'; }

  const matchBadge = matchScore > 0
    ? `<span class="match-badge ${matchClass}">🎯 ${matchScore}% match</span>`
    : '';

  const matchBar = matchScore > 0
    ? `<div class="match-bar"><div class="match-bar__fill ${matchBarClass}" style="width: ${matchScore}%"></div></div>`
    : '';

  // Skills
  const skillTags = (v.skills || []).map(skill => {
    const isMatch = mySkills.some(s => s.toLowerCase() === skill.toLowerCase());
    return `<span class="skill-tag ${isMatch ? 'skill-tag--match' : ''}">${escapeHtml(skill)}</span>`;
  }).join('');

  // Company logo
  const logoHtml = v.logo
    ? `<img src="${v.logo}" alt="" class="vacancy-card__company-logo" onerror="this.style.display='none'">`
    : '';

  // URL link
  const urlLink = v.url
    ? `<a href="${escapeHtml(v.url)}" target="_blank" class="vacancy-card__link">🔗 Postular</a>`
    : '';

  // Location & type
  const locationHtml = v.location
    ? `<span class="vacancy-card__location">📍 ${escapeHtml(v.location)}</span>`
    : '';

  const typeHtml = v.employmentType
    ? `<span class="vacancy-card__type">💼 ${escapeHtml(v.employmentType)}</span>`
    : '';

  // Experience badge
  const textToSearch = ((v.title || '') + ' ' + (v.description || '')).toLowerCase();
  const expYears = extractExperience(textToSearch);
  
  let expBadge = '';
  if (expYears === 0) {
    expBadge = `<span class="vacancy-card__type" style="background: #e6f4ea; color: #1e8e3e; border: 1px solid #1e8e3e;">🌱 Sin experiencia</span>`;
  } else if (expYears !== null) {
    const isMonths = expYears > 0 && expYears < 1;
    const expText = isMonths ? Math.round(expYears * 12) + ' meses exp.' : expYears + ' años exp.';
    expBadge = `<span class="vacancy-card__type" style="background: #fff3e0; color: #e65100; border: 1px solid #e65100;">💼 ${expText}</span>`;
  }

  // Date
  const dateDisplay = isPending
    ? `📅 ${formatDate(v.dateAdded)}`
    : `📅 Postulado: ${formatDate(v.dateApplied || v.dateAdded)}`;

  return `
    <div class="vacancy-card ${statusClass}" style="animation-delay: ${index * 0.04}s" id="card-${v.id}">
      <span class="vacancy-card__status">${statusText}</span>
      <div class="vacancy-card__company">${logoHtml}🏢 ${escapeHtml(v.company)} ${matchBadge}</div>
      <h3 class="vacancy-card__title">${escapeHtml(v.title)}</h3>
      <div class="vacancy-card__meta">
        <span class="vacancy-card__area">📂 ${escapeHtml(v.area || 'General')}</span>
        ${locationHtml}
        ${typeHtml}
        ${expBadge}
      </div>
      ${matchBar}
      <p class="vacancy-card__description">${escapeHtml(v.description || '')}</p>
      <div class="vacancy-card__skills">${skillTags}</div>
      <div class="vacancy-card__footer">
        <span class="vacancy-card__date">${dateDisplay}</span>
        <div class="vacancy-card__actions">
          <span class="vacancy-card__source">${escapeHtml(v.source || 'Web')}</span>
          ${urlLink}
          ${actionBtn}
          <button class="btn btn--ghost btn--sm" onclick="confirmDelete('${v.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
}


// ══════════════════════════════════════
// ── Filtering & Search ──
// ══════════════════════════════════════

function extractExperience(text) {
  if (!text) return null;
  
  // Buscar meses: "6 meses", "seis meses"
  const regexMonths = /(\d+)\s*(?:meses|months)\b/i;
  const matchMonths = text.match(regexMonths);
  if (matchMonths && matchMonths[1]) {
    return parseInt(matchMonths[1]) / 12; // Convertir meses a años (ej. 0.5)
  }

  // Buscar patrones como "2 años", "2-3 años", "2 years"
  const regex = /(\d+)\s*(?:a|-|to)?\s*(?:\d+)?\s*(?:\+)?\s*(?:años?|years?)\b/i;
  const match = text.match(regex);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  // Patrón "experiencia de 2 años"
  const regex2 = /(?:experiencia|experience)\b.{0,15}?\b(\d+)\b.{0,10}?(?:años?|years?)\b/i;
  const match2 = text.match(regex2);
  if (match2 && match2[1]) {
    return parseFloat(match2[1]);
  }

  // Palabras clave de no experiencia
  if (/(?:trainee|practicante|sin experiencia|no experience)/i.test(text)) {
    return 0;
  }

  return null;
}

function getFilteredVacancies() {
  return vacancies.filter(v => {
    if (currentFilter === 'pending' && v.status !== 'pending') return false;
    if (currentFilter === 'applied' && v.status !== 'applied') return false;

    if (currentSkillFilter) {
      if (!v.skills || !v.skills.some(s => s.toLowerCase() === currentSkillFilter.toLowerCase())) return false;
    }

    if (currentSearch) {
      const query = currentSearch.toLowerCase();
      const searchable = [v.company, v.title, v.area, v.description, ...(v.skills || [])]
        .join(' ').toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    // Filtro de Experiencia
    if (currentExpFilter !== 'all') {
      const textToSearch = ((v.title || '') + ' ' + (v.description || '')).toLowerCase();
      const years = extractExperience(textToSearch);
      
      if (currentExpFilter === 'none') {
        // Rechazar si requiere > 0 años
        if (years !== null && years > 0) return false;
      } else if (currentExpFilter === 'some') {
        // Requiere experiencia
        if (years === 0) return false;
        
        if (currentExpMin !== null && currentExpMin >= 0) {
          if (years === null || years < currentExpMin) return false;
        }
        if (currentExpMax !== null && currentExpMax > 0) {
          if (years !== null && years > currentExpMax) return false;
        }
      }
    }

    return true;
  });
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
  btn.classList.add('filter-btn--active');
  renderVacancies();
}

function toggleSkillFilter(skill) {
  currentSkillFilter = currentSkillFilter === skill ? null : skill;
  renderSkillsFilterBar();
  renderVacancies();
}

function toggleExpRange() {
  const select = document.getElementById('exp-select').value;
  const rangeContainer = document.getElementById('exp-range-container');
  
  if (select === 'some') {
    rangeContainer.style.display = 'flex';
  } else {
    rangeContainer.style.display = 'none';
    applyExpFilter();
  }
}

function applyExpFilter() {
  currentExpFilter = document.getElementById('exp-select').value;
  if (currentExpFilter === 'some') {
    const minVal = document.getElementById('exp-min').value;
    const maxVal = document.getElementById('exp-max').value;
    currentExpMin = minVal !== '' ? parseFloat(minVal) : null;
    currentExpMax = maxVal !== '' ? parseFloat(maxVal) : null;
  } else {
    currentExpMin = null;
    currentExpMax = null;
  }
  renderVacancies();
}

function setupFilterListener() {
  const input = document.getElementById('filter-input');
  let debounceTimer;
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value.trim();
      renderVacancies();
    }, 250);
  });
}


// ══════════════════════════════════════
// ── Vacancy Actions (API calls) ──
// ══════════════════════════════════════

async function markAsApplied(id) {
  try {
    const res = await fetch(`${API_BASE}/api/vacancies/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'applied' })
    });
    const data = await res.json();

    if (data.ok) {
      const v = vacancies.find(v => v.id === id);
      if (v) {
        v.status = 'applied';
        v.dateApplied = new Date().toISOString().split('T')[0];
      }

      const card = document.getElementById(`card-${id}`);
      if (card) {
        card.classList.add('vacancy-card--just-applied');
        setTimeout(() => card.classList.remove('vacancy-card--just-applied'), 600);
      }

      renderAll();
      showToast('🔴 ¡Marcado como postulado! Buena suerte 🍀', 'success');
    }
  } catch (error) {
    showToast('❌ Error actualizando estado', 'error');
  }
}

async function markAsPending(id) {
  try {
    const res = await fetch(`${API_BASE}/api/vacancies/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' })
    });
    const data = await res.json();

    if (data.ok) {
      const v = vacancies.find(v => v.id === id);
      if (v) {
        v.status = 'pending';
        v.dateApplied = null;
      }
      renderAll();
      showToast('🟢 Vacante marcada como pendiente', 'info');
    }
  } catch (error) {
    showToast('❌ Error actualizando estado', 'error');
  }
}

async function deleteVacancy(id) {
  try {
    const res = await fetch(`${API_BASE}/api/vacancies/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (data.ok) {
      vacancies = vacancies.filter(v => v.id !== id);
      renderAll();
      showToast('🗑️ Vacante eliminada', 'error');
    }
  } catch (error) {
    showToast('❌ Error eliminando vacante', 'error');
  }
}


// ══════════════════════════════════════
// ── Manual Add Modal ──
// ══════════════════════════════════════

function openAddModal() {
  document.getElementById('modal-title').textContent = '➕ Nueva Vacante Manual';
  document.getElementById('modal-submit-btn').textContent = '💾 Guardar Vacante';
  document.getElementById('vacancy-form').reset();
  document.getElementById('form-id').value = '';
  openModal();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const skillsRaw = document.getElementById('form-skills').value;
  const skills = skillsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

  const body = {
    company: document.getElementById('form-company').value.trim(),
    title: document.getElementById('form-title').value.trim(),
    area: document.getElementById('form-area').value,
    description: document.getElementById('form-description').value.trim(),
    skills: skills,
    url: document.getElementById('form-url').value.trim(),
    source: document.getElementById('form-source').value,
  };

  try {
    const res = await fetch(`${API_BASE}/api/vacancies/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.ok) {
      vacancies.unshift(data.vacancy);
      closeModal();
      renderAll();
      showToast('✅ Vacante agregada manualmente', 'success');
    }
  } catch (error) {
    showToast('❌ Error agregando vacante', 'error');
  }
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('modal-overlay--active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('modal-overlay--active');
  document.body.style.overflow = '';
}


// ══════════════════════════════════════
// ── Skills Editor ──
// ══════════════════════════════════════

function openSkillsEditor() {
  document.getElementById('skills-editor-input').value = mySkills.join(', ');
  document.getElementById('skills-modal-overlay').classList.add('modal-overlay--active');
  document.body.style.overflow = 'hidden';
}

function closeSkillsModal() {
  document.getElementById('skills-modal-overlay').classList.remove('modal-overlay--active');
  document.body.style.overflow = '';
}

async function saveSkills() {
  const raw = document.getElementById('skills-editor-input').value;
  const newSkills = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);

  try {
    const res = await fetch(`${API_BASE}/api/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: newSkills })
    });

    const data = await res.json();
    if (data.ok) {
      mySkills = data.skills;
      closeSkillsModal();
      // Reload vacancies to get updated match scores
      await loadData();
      renderAll();
      showToast('🎯 Habilidades actualizadas', 'success');
    }
  } catch (error) {
    showToast('❌ Error guardando habilidades', 'error');
  }
}


// ══════════════════════════════════════
// ── Confirm Dialog ──
// ══════════════════════════════════════

function confirmDelete(id) {
  const v = vacancies.find(v => v.id === id);
  if (!v) return;

  document.getElementById('confirm-icon').textContent = '🗑️';
  document.getElementById('confirm-title').textContent = '¿Eliminar vacante?';
  document.getElementById('confirm-message').textContent =
    `Se eliminará "${v.title}" de ${v.company}. Esta acción no se puede deshacer.`;

  confirmAction = () => deleteVacancy(id);
  document.getElementById('confirm-overlay').classList.add('confirm-overlay--active');
}

function confirmReset() {
  document.getElementById('confirm-icon').textContent = '⚠️';
  document.getElementById('confirm-title').textContent = '¿Limpiar todo?';
  document.getElementById('confirm-message').textContent =
    'Se eliminarán TODAS las vacantes guardadas. Podrás hacer una nueva búsqueda después.';

  confirmAction = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vacancies`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        vacancies = [];
        currentFilter = 'all';
        currentSearch = '';
        currentSkillFilter = null;
        document.getElementById('filter-input').value = '';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
        document.querySelector('[data-filter="all"]').classList.add('filter-btn--active');
        renderAll();
        showToast('🗑️ Todas las vacantes eliminadas', 'info');
      }
    } catch (error) {
      showToast('❌ Error limpiando datos', 'error');
    }
  };

  document.getElementById('confirm-overlay').classList.add('confirm-overlay--active');
}

function executeConfirmAction() {
  if (confirmAction) confirmAction();
  closeConfirm();
  confirmAction = null;
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('confirm-overlay--active');
}


// ══════════════════════════════════════
// ── Toast Notifications ──
// ══════════════════════════════════════

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}


// ══════════════════════════════════════
// ── Particles ──
// ══════════════════════════════════════

function setupParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
    particle.style.animationDelay = (Math.random() * 10) + 's';
    particle.style.width = (Math.random() * 3 + 1) + 'px';
    particle.style.height = particle.style.width;
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    container.appendChild(particle);
  }
}


// ══════════════════════════════════════
// ── Utilities ──
// ══════════════════════════════════════

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const date = new Date(isoStr);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
  if (e.target.id === 'skills-modal-overlay') closeSkillsModal();
  if (e.target.id === 'confirm-overlay') closeConfirm();
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeSkillsModal();
    closeConfirm();
  }
});

// Search on Enter in custom search input
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('custom-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        startSearch();
      }
    });
  }
});
