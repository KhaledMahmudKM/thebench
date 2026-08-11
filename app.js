const ARROW = '<span class="arrow">&#8594;</span>';

// ---- escape helper (data is user-maintained, keep it safe) ----
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---- elements ----
const rackEl = document.getElementById('rack');
const emptyEl = document.getElementById('empty');
const qEl = document.getElementById('q');
const statusCountEl = document.getElementById('status-count');
const introEl = document.getElementById('intro');
const footMetaEl = document.getElementById('foot-meta');

let UNITS = [];

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function unitCard(unit, index) {
  const isOnline = (unit.status || 'online') === 'online';
  const tagNum = 'UNIT ' + pad(index + 1);

  const lamp = `<span class="lamp${isOnline ? ' on' : ''}" aria-hidden="true"></span>`;
  const action = isOnline
    ? `<span class="launch-btn">Launch ${ARROW}</span>`
    : `<span class="launch-btn soon">Coming Soon</span>`;

  const inner = `
    <div class="rack-unit-header">
      <span class="unit-tag">${esc(tagNum)}</span>
      ${lamp}
    </div>
    <h2>${esc(unit.title)}</h2>
    <div class="rack-unit-model">${esc(unit.tag || '')}</div>
    <p>${esc(unit.description || '')}</p>
    ${action}`;

  if (isOnline) {
    return `<a class="rack-unit" href="${esc(unit.url)}" target="_blank" rel="noopener">${inner}</a>`;
  }
  return `<div class="rack-unit rack-unit-disabled">${inner}</div>`;
}

function render() {
  const q = (qEl.value || '').trim().toLowerCase();
  const filtered = UNITS.filter((u, i) => {
    if (!q) return true;
    return (u.title + ' ' + (u.tag || '') + ' ' + (u.description || '')).toLowerCase().includes(q);
  });

  rackEl.innerHTML = filtered.map((u) => unitCard(u, UNITS.indexOf(u))).join('');
  emptyEl.classList.toggle('show', filtered.length === 0);
}

function fillMeta(meta) {
  if (!meta) return;
  if (meta.tagline && introEl) introEl.textContent = meta.tagline;
  const foot = [meta.updated ? 'Last update: ' + meta.updated : '', meta.author ? '\u00A9 ' + meta.author : ''].filter(Boolean).join(' \u00B7 ');
  if (foot && footMetaEl) footMetaEl.textContent = foot;
}

function fillStatus() {
  const online = UNITS.filter(u => (u.status || 'online') === 'online').length;
  if (statusCountEl) statusCountEl.textContent = online + ' OF ' + UNITS.length + ' UNITS ONLINE';
}

function fillStructuredData() {
  const el = document.getElementById('ld-itemlist');
  if (!el) return;
  const elements = UNITS.map((u, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "url": u.url,
    "name": u.title,
    "description": u.description
  }));
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "The Bench — unit directory",
    "numberOfItems": elements.length,
    "itemListElement": elements
  };
  el.textContent = JSON.stringify(ld);
}

// ---- load data ----
fetch('data.json')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(json => {
    UNITS = json.units || [];
    fillMeta(json.meta);
    fillStatus();
    fillStructuredData();
    render();
  })
  .catch(err => {
    rackEl.innerHTML = '';
    emptyEl.textContent = '// could not load data.json \u2014 ' + err.message;
    emptyEl.classList.add('show');
  });

qEl.addEventListener('input', render);

// ---- keyboard: "/" focuses search, Esc clears ----
addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== qEl) { e.preventDefault(); qEl.focus(); }
  if (e.key === 'Escape' && document.activeElement === qEl) { qEl.value = ''; render(); qEl.blur(); }
});
