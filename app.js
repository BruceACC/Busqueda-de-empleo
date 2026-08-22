/* ═══════════════════════════════════════════════
   AGENDA DE POSTULACIONES - Application Logic
   ═══════════════════════════════════════════════ */

// ── Storage Keys ──
const STORAGE_KEYS = {
  vacancies: 'agenda_vacancies',
  skills: 'agenda_my_skills',
  appState: 'agenda_app_state'
};

// ── Default Skills for a Software Engineering Student ──
const DEFAULT_SKILLS = [
  'SQL', 'Python', 'Java', 'JavaScript', 'HTML', 'CSS',
  'Excel', 'Office', 'Power BI', 'Git', 'React',
  'Node.js', 'C++', 'C#', 'PHP', 'TypeScript',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Docker',
  'Scrum', 'Agile', 'REST API', 'Linux', 'AWS'
];

// ── Pre-loaded vacancies (real examples for Peru) ──
const INITIAL_VACANCIES = [
  {
    id: 'v001',
    company: 'Saga Falabella',
    title: 'Practicante BI Pre Profesional - CD VES',
    area: 'Business Intelligence',
    description: 'Practicante pre profesional para el área de Business Intelligence en el Centro de Distribución VES. Se requiere manejo de SQL, Excel avanzado y herramientas de Office. Deseable conocimiento en Power BI y análisis de datos.',
    skills: ['SQL', 'Excel', 'Office', 'Power BI'],
    url: '',
    source: 'Web Empresa',
    status: 'pending',
    dateAdded: '2026-08-20',
    dateApplied: null
  },
  {
    id: 'v002',
    company: 'BCP - Banco de Crédito del Perú',
    title: 'Practicante de Analítica de Datos',
    area: 'Data Analytics',
    description: 'Buscamos practicantes apasionados por los datos para el equipo de Analítica. Manejo de SQL, Python y herramientas de visualización. Estudiantes de Ing. de Sistemas, Software, Estadística o carreras afines.',
    skills: ['SQL', 'Python', 'Power BI', 'Excel'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-19',
    dateApplied: null
  },
  {
    id: 'v003',
    company: 'Interbank',
    title: 'Practicante de Desarrollo de Software',
    area: 'Desarrollo de Software',
    description: 'Practicante pre profesional para el equipo de desarrollo. Conocimiento en Java, Spring Boot, APIs REST y bases de datos. Metodologías ágiles. Estudiantes de últimos ciclos de Ing. de Software o afines.',
    skills: ['Java', 'REST API', 'SQL', 'Git', 'Agile'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-18',
    dateApplied: null
  },
  {
    id: 'v004',
    company: 'Belcorp',
    title: 'Practicante de Data Science',
    area: 'Data Science',
    description: 'Buscamos practicante para el equipo de Data Science. Se necesita manejo de Python, SQL, conocimiento en machine learning y estadística. Deseable experiencia con Power BI o Tableau.',
    skills: ['Python', 'SQL', 'Excel', 'Power BI'],
    url: '',
    source: 'CompuTrabajo',
    status: 'pending',
    dateAdded: '2026-08-17',
    dateApplied: null
  },
  {
    id: 'v005',
    company: 'BBVA Perú',
    title: 'Practicante de Transformación Digital',
    area: 'Transformación Digital',
    description: 'Únete al equipo de Transformación Digital. Participarás en proyectos de automatización y digitalización. Conocimientos en programación, bases de datos y herramientas digitales. Carreras de Ingeniería de Software, Sistemas o afines.',
    skills: ['Python', 'SQL', 'JavaScript', 'Agile', 'Scrum'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-17',
    dateApplied: null
  },
  {
    id: 'v006',
    company: 'Ripley',
    title: 'Practicante de Business Intelligence',
    area: 'Business Intelligence',
    description: 'Practicante para el área de BI. Creación de reportes y dashboards, análisis de datos de ventas. Manejo de SQL, Excel avanzado y Power BI. Estudiantes de Ingeniería o carreras afines.',
    skills: ['SQL', 'Excel', 'Power BI', 'Office'],
    url: '',
    source: 'CompuTrabajo',
    status: 'pending',
    dateAdded: '2026-08-16',
    dateApplied: null
  },
  {
    id: 'v007',
    company: 'NTT Data',
    title: 'Practicante de Desarrollo Full Stack',
    area: 'Desarrollo de Software',
    description: 'Practicante para proyectos de desarrollo web. Conocimiento en React, Node.js, JavaScript, bases de datos SQL/NoSQL. Metodología Scrum. Ing. de Software, Sistemas o afines.',
    skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Scrum'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-16',
    dateApplied: null
  },
  {
    id: 'v008',
    company: 'Scotiabank Perú',
    title: 'Practicante de QA / Testing',
    area: 'QA / Testing',
    description: 'Buscamos practicante para el área de Quality Assurance. Conocimiento en pruebas funcionales, automatización con Selenium, SQL y bases de datos. Carreras de Ing. de Software o afines.',
    skills: ['SQL', 'Java', 'Git', 'Agile'],
    url: '',
    source: 'Bumeran',
    status: 'pending',
    dateAdded: '2026-08-15',
    dateApplied: null
  },
  {
    id: 'v009',
    company: 'IBM Perú',
    title: 'Practicante de Cloud & DevOps',
    area: 'DevOps / Cloud',
    description: 'Oportunidad para practicantes interesados en Cloud Computing y DevOps. Conocimiento en Linux, Docker, AWS o Azure. Deseable conocimiento en CI/CD y automatización.',
    skills: ['Linux', 'Docker', 'AWS', 'Git', 'Python'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-15',
    dateApplied: null
  },
  {
    id: 'v010',
    company: 'Alicorp',
    title: 'Practicante de Analítica Avanzada',
    area: 'Data Analytics',
    description: 'Practicante para el equipo de analítica. Análisis de datos con Python y SQL, creación de dashboards. Deseable conocimiento en Power BI. Carreras de Ingeniería, Estadística o afines.',
    skills: ['Python', 'SQL', 'Power BI', 'Excel'],
    url: '',
    source: 'Web Empresa',
    status: 'pending',
    dateAdded: '2026-08-14',
    dateApplied: null
  },
  {
    id: 'v011',
    company: 'Globant',
    title: 'Practicante de Desarrollo Frontend',
    area: 'Desarrollo de Software',
    description: 'Únete como practicante frontend. Conocimiento en HTML, CSS, JavaScript y React. Uso de Git y metodologías ágiles. Estudiantes de Ing. de Software o carreras afines.',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-14',
    dateApplied: null
  },
  {
    id: 'v012',
    company: 'Cencosud',
    title: 'Practicante de Tecnología de la Información',
    area: 'Tecnología / TI',
    description: 'Practicante para el área de TI. Soporte a sistemas internos, manejo de bases de datos, reportería con Excel y SQL. Ing. de Sistemas, Software o afines.',
    skills: ['SQL', 'Excel', 'Office', 'Python'],
    url: '',
    source: 'CompuTrabajo',
    status: 'pending',
    dateAdded: '2026-08-13',
    dateApplied: null
  },
  {
    id: 'v013',
    company: 'Minsur',
    title: 'Practicante de Automatización de Procesos',
    area: 'Transformación Digital',
    description: 'Practicante para automatización de procesos con Python, Power Automate y manejo de bases de datos. Carreras de Ingeniería de Software, Sistemas, Industrial o afines.',
    skills: ['Python', 'SQL', 'Excel', 'Office'],
    url: '',
    source: 'Bumeran',
    status: 'pending',
    dateAdded: '2026-08-12',
    dateApplied: null
  },
  {
    id: 'v014',
    company: 'Entel Perú',
    title: 'Practicante de Desarrollo Backend',
    area: 'Desarrollo de Software',
    description: 'Practicante para el equipo backend. Desarrollo de APIs con Node.js o Python, bases de datos PostgreSQL/MongoDB. Git y Docker. Ing. de Software o afines.',
    skills: ['Python', 'Node.js', 'PostgreSQL', 'MongoDB', 'Docker', 'Git'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-12',
    dateApplied: null
  },
  {
    id: 'v015',
    company: 'Tottus',
    title: 'Practicante de Reportería y Análisis',
    area: 'Business Intelligence',
    description: 'Practicante para generación de reportes y análisis de datos comerciales. Dominio de Excel avanzado, SQL y Power BI. Carreras de Ingeniería, Administración o afines.',
    skills: ['Excel', 'SQL', 'Power BI', 'Office'],
    url: '',
    source: 'CompuTrabajo',
    status: 'pending',
    dateAdded: '2026-08-11',
    dateApplied: null
  },
  {
    id: 'v016',
    company: 'Accenture Perú',
    title: 'Practicante de Consultoría Tecnológica',
    area: 'Consultoría',
    description: 'Buscamos practicantes para proyectos de consultoría tecnológica. Conocimiento en programación, bases de datos y metodologías ágiles. Habilidades de comunicación y trabajo en equipo.',
    skills: ['SQL', 'Python', 'Agile', 'Scrum', 'Excel'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-11',
    dateApplied: null
  },
  {
    id: 'v017',
    company: 'Yape (BCP)',
    title: 'Practicante de Producto Digital',
    area: 'Producto Digital',
    description: 'Practicante para el equipo de producto. Participación en squads ágiles, análisis de métricas de usuario, apoyo en definición de features. Conocimiento en herramientas digitales y datos.',
    skills: ['SQL', 'Excel', 'Agile', 'Scrum'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-10',
    dateApplied: null
  },
  {
    id: 'v018',
    company: 'Indra Perú',
    title: 'Practicante de Desarrollo Java',
    area: 'Desarrollo de Software',
    description: 'Practicante para proyectos de desarrollo con Java, Spring Boot, microservicios. Conocimiento en bases de datos SQL y APIs REST. Ing. de Software o Sistemas.',
    skills: ['Java', 'SQL', 'REST API', 'Git', 'Agile'],
    url: '',
    source: 'Bumeran',
    status: 'pending',
    dateAdded: '2026-08-10',
    dateApplied: null
  },
  {
    id: 'v019',
    company: 'Claro Perú',
    title: 'Practicante de Base de Datos',
    area: 'Tecnología / TI',
    description: 'Practicante para el área de administración de bases de datos. Manejo de SQL, MySQL, PostgreSQL. Deseable conocimiento en Oracle. Carreras de Ingeniería de Software, Sistemas o afines.',
    skills: ['SQL', 'MySQL', 'PostgreSQL', 'Linux'],
    url: '',
    source: 'CompuTrabajo',
    status: 'pending',
    dateAdded: '2026-08-09',
    dateApplied: null
  },
  {
    id: 'v020',
    company: 'Niubiz',
    title: 'Practicante de Ciberseguridad',
    area: 'Ciberseguridad',
    description: 'Practicante para el equipo de ciberseguridad. Interés en seguridad informática, redes, Linux y scripting. Carreras de Ingeniería de Software, Sistemas, Telecomunicaciones o afines.',
    skills: ['Linux', 'Python', 'SQL', 'Git'],
    url: '',
    source: 'LinkedIn',
    status: 'pending',
    dateAdded: '2026-08-09',
    dateApplied: null
  }
];


// ── App State ──
let vacancies = [];
let mySkills = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSkillFilter = null;
let confirmAction = null;

// ══════════════════════════════════════
// ── Initialization ──
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderAll();
  setupParticles();
  setupSearchListener();
});

function loadData() {
  // Load skills
  const savedSkills = localStorage.getItem(STORAGE_KEYS.skills);
  if (savedSkills) {
    mySkills = JSON.parse(savedSkills);
  } else {
    mySkills = [...DEFAULT_SKILLS];
    saveSkillsToStorage();
  }

  // Load vacancies
  const savedVacancies = localStorage.getItem(STORAGE_KEYS.vacancies);
  if (savedVacancies) {
    vacancies = JSON.parse(savedVacancies);
  } else {
    vacancies = INITIAL_VACANCIES.map(v => ({ ...v }));
    saveVacanciesToStorage();
  }
}

function saveVacanciesToStorage() {
  localStorage.setItem(STORAGE_KEYS.vacancies, JSON.stringify(vacancies));
}

function saveSkillsToStorage() {
  localStorage.setItem(STORAGE_KEYS.skills, JSON.stringify(mySkills));
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
  // Collect all unique skills from vacancies
  const allSkills = new Set();
  vacancies.forEach(v => {
    v.skills.forEach(s => allSkills.add(s));
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
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">🔍</span>
        <h3 class="empty-state__title">No se encontraron vacantes</h3>
        <p class="empty-state__desc">Intenta cambiar los filtros o agrega una nueva vacante.</p>
      </div>`;
    return;
  }

  // Sort: pending first, then by date (newest first)
  filtered.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });

  grid.innerHTML = filtered.map((v, idx) => renderCard(v, idx)).join('');
}

function renderCard(v, index) {
  const isPending = v.status === 'pending';
  const statusClass = isPending ? 'vacancy-card--pending' : 'vacancy-card--applied';
  const statusText = isPending ? 'Pendiente' : 'Postulado';
  const actionBtn = isPending
    ? `<button class="btn btn--danger btn--sm" onclick="markAsApplied('${v.id}')">🔴 Marcar Postulado</button>`
    : `<button class="btn btn--success btn--sm" onclick="markAsPending('${v.id}')">🟢 Desmarcar</button>`;

  const skillTags = v.skills.map(skill => {
    const isMatch = mySkills.some(s => s.toLowerCase() === skill.toLowerCase());
    return `<span class="skill-tag ${isMatch ? 'skill-tag--match' : ''}">${escapeHtml(skill)}</span>`;
  }).join('');

  const urlLink = v.url
    ? `<div class="vacancy-card__url-row">
         <a href="${escapeHtml(v.url)}" target="_blank" class="vacancy-card__link">🔗 Ver convocatoria</a>
       </div>`
    : '';

  const dateDisplay = isPending
    ? `📅 Agregada: ${formatDate(v.dateAdded)}`
    : `📅 Postulado: ${formatDate(v.dateApplied || v.dateAdded)}`;

  return `
    <div class="vacancy-card ${statusClass}" style="animation-delay: ${index * 0.05}s" id="card-${v.id}">
      <span class="vacancy-card__status">${statusText}</span>
      <div class="vacancy-card__company">🏢 ${escapeHtml(v.company)}</div>
      <h3 class="vacancy-card__title">${escapeHtml(v.title)}</h3>
      <span class="vacancy-card__area">📂 ${escapeHtml(v.area)}</span>
      ${urlLink}
      <p class="vacancy-card__description">${escapeHtml(v.description)}</p>
      <div class="vacancy-card__skills">${skillTags}</div>
      <div class="vacancy-card__footer">
        <span class="vacancy-card__date">${dateDisplay}</span>
        <div class="vacancy-card__actions">
          <span class="vacancy-card__source">${escapeHtml(v.source)}</span>
          ${actionBtn}
          <button class="btn btn--ghost btn--sm" onclick="editVacancy('${v.id}')">✏️</button>
          <button class="btn btn--ghost btn--sm" onclick="confirmDelete('${v.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
}


// ══════════════════════════════════════
// ── Filtering & Search ──
// ══════════════════════════════════════

function getFilteredVacancies() {
  return vacancies.filter(v => {
    // Status filter
    if (currentFilter === 'pending' && v.status !== 'pending') return false;
    if (currentFilter === 'applied' && v.status !== 'applied') return false;

    // Skill filter
    if (currentSkillFilter) {
      if (!v.skills.some(s => s.toLowerCase() === currentSkillFilter.toLowerCase())) return false;
    }

    // Search
    if (currentSearch) {
      const query = currentSearch.toLowerCase();
      const searchable = [v.company, v.title, v.area, v.description, ...v.skills]
        .join(' ').toLowerCase();
      return searchable.includes(query);
    }

    return true;
  });
}

function setFilter(filter, btn) {
  currentFilter = filter;

  // Update active state
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
  btn.classList.add('filter-btn--active');

  renderVacancies();
}

function toggleSkillFilter(skill) {
  currentSkillFilter = currentSkillFilter === skill ? null : skill;
  renderSkillsFilterBar();
  renderVacancies();
}

function setupSearchListener() {
  const input = document.getElementById('search-input');
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
// ── Vacancy CRUD ──
// ══════════════════════════════════════

function markAsApplied(id) {
  const v = vacancies.find(v => v.id === id);
  if (!v) return;

  v.status = 'applied';
  v.dateApplied = new Date().toISOString().split('T')[0];
  saveVacanciesToStorage();

  // Animate card
  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.classList.add('vacancy-card--just-applied');
    setTimeout(() => card.classList.remove('vacancy-card--just-applied'), 600);
  }

  renderAll();
  showToast('🔴 Vacante marcada como postulada', 'success');
}

function markAsPending(id) {
  const v = vacancies.find(v => v.id === id);
  if (!v) return;

  v.status = 'pending';
  v.dateApplied = null;
  saveVacanciesToStorage();
  renderAll();
  showToast('🟢 Vacante marcada como pendiente', 'info');
}

function deleteVacancy(id) {
  vacancies = vacancies.filter(v => v.id !== id);
  saveVacanciesToStorage();
  renderAll();
  showToast('🗑️ Vacante eliminada', 'error');
}


// ══════════════════════════════════════
// ── Modal Handlers ──
// ══════════════════════════════════════

function openAddModal() {
  document.getElementById('modal-title').textContent = '➕ Nueva Vacante';
  document.getElementById('modal-submit-btn').textContent = '💾 Guardar Vacante';
  document.getElementById('vacancy-form').reset();
  document.getElementById('form-id').value = '';
  openModal();
}

function editVacancy(id) {
  const v = vacancies.find(v => v.id === id);
  if (!v) return;

  document.getElementById('modal-title').textContent = '✏️ Editar Vacante';
  document.getElementById('modal-submit-btn').textContent = '💾 Guardar Cambios';
  document.getElementById('form-id').value = v.id;
  document.getElementById('form-company').value = v.company;
  document.getElementById('form-title').value = v.title;
  document.getElementById('form-area').value = v.area;
  document.getElementById('form-description').value = v.description;
  document.getElementById('form-skills').value = v.skills.join(', ');
  document.getElementById('form-url').value = v.url || '';
  document.getElementById('form-source').value = v.source;

  openModal();
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-id').value;
  const skillsRaw = document.getElementById('form-skills').value;
  const skills = skillsRaw
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const vacancyData = {
    company: document.getElementById('form-company').value.trim(),
    title: document.getElementById('form-title').value.trim(),
    area: document.getElementById('form-area').value,
    description: document.getElementById('form-description').value.trim(),
    skills: skills,
    url: document.getElementById('form-url').value.trim(),
    source: document.getElementById('form-source').value,
  };

  if (id) {
    // Edit existing
    const v = vacancies.find(v => v.id === id);
    if (v) {
      Object.assign(v, vacancyData);
      saveVacanciesToStorage();
      showToast('✏️ Vacante actualizada correctamente', 'success');
    }
  } else {
    // Add new
    const newVacancy = {
      id: 'v' + Date.now(),
      ...vacancyData,
      status: 'pending',
      dateAdded: new Date().toISOString().split('T')[0],
      dateApplied: null
    };
    vacancies.unshift(newVacancy);
    saveVacanciesToStorage();
    showToast('✅ Nueva vacante agregada', 'success');
  }

  closeModal();
  renderAll();
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('modal-overlay--active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('modal-overlay--active');
  document.body.style.overflow = '';
}

// ── Skills Editor ──
function openSkillsEditor() {
  document.getElementById('skills-editor-input').value = mySkills.join(', ');
  document.getElementById('skills-modal-overlay').classList.add('modal-overlay--active');
  document.body.style.overflow = 'hidden';
}

function closeSkillsModal() {
  document.getElementById('skills-modal-overlay').classList.remove('modal-overlay--active');
  document.body.style.overflow = '';
}

function saveSkills() {
  const raw = document.getElementById('skills-editor-input').value;
  mySkills = raw
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  saveSkillsToStorage();
  closeSkillsModal();
  renderAll();
  showToast('🎯 Habilidades actualizadas', 'success');
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
  document.getElementById('confirm-title').textContent = '¿Reiniciar todo?';
  document.getElementById('confirm-message').textContent =
    'Se eliminarán todas las vacantes y se cargarán las vacantes iniciales. Los cambios de estado se perderán.';

  confirmAction = () => {
    localStorage.removeItem(STORAGE_KEYS.vacancies);
    localStorage.removeItem(STORAGE_KEYS.skills);
    vacancies = INITIAL_VACANCIES.map(v => ({ ...v }));
    mySkills = [...DEFAULT_SKILLS];
    saveVacanciesToStorage();
    saveSkillsToStorage();
    currentFilter = 'all';
    currentSearch = '';
    currentSkillFilter = null;
    document.getElementById('search-input').value = '';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    document.querySelector('[data-filter="all"]').classList.add('filter-btn--active');
    renderAll();
    showToast('🔄 Datos reiniciados correctamente', 'info');
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
  }, 3000);
}


// ══════════════════════════════════════
// ── Floating Particles ──
// ══════════════════════════════════════

function setupParticles() {
  const container = document.getElementById('particles');
  const count = 15;

  for (let i = 0; i < count; i++) {
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
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('es-PE', options);
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
