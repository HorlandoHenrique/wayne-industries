/* ============================================================
   WAYNE INDUSTRIES — BAT-COMPUTADOR
   Arquivo: trajes.js
   Descrição: Lógica da tela de Trajes
   ============================================================ */

const WRITE_ROLES = ['master', 'manager', 'security'];

function getSession() {
  const p = new URLSearchParams(window.location.search);
  return { role: p.get('role') || 'employee', user: p.get('user') || 'guest@wayne.com' };
}

const SESSION   = getSession();
const CAN_WRITE = WRITE_ROLES.includes(SESSION.role);

/* ── INIT ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  loadTrajes();
  loadCategorias();
  setupFilters();
  startClock();
});

function setupUI() {
  const clearMap = {
    master:   'CLEARANCE: MASTER · ACESSO TOTAL',
    manager:  'CLEARANCE: LVL-3 · ACESSO GERENCIAL',
    security: 'CLEARANCE: LVL-2 · ACESSO DE SEGURANÇA',
    employee: 'CLEARANCE: LVL-1 · SOMENTE LEITURA',
  };
  document.getElementById('header-clearance').textContent = clearMap[SESSION.role] || clearMap.employee;
  document.getElementById('session-user').textContent =
    SESSION.user.split('@')[0].replace(/\./g, ' ').toUpperCase();
  if (CAN_WRITE) {
    document.getElementById('btn-add').style.display = 'block';
    document.getElementById('col-acoes').style.display = '';
  }
}

function startClock() {
  const tick = () => document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('pt-BR', { hour12: false });
  tick(); setInterval(tick, 1000);
}

function goBack() {
  window.location.href = `/batcave-menu.html?role=${SESSION.role}&user=${encodeURIComponent(SESSION.user)}`;
}

/* ── CARREGAR ──────────────────────────────────────────── */

async function loadTrajes() {
  const busca     = document.getElementById('busca').value;
  const status    = document.getElementById('filtro-status').value;
  const categoria = document.getElementById('filtro-categoria').value;
  const params    = new URLSearchParams();
  if (busca)     params.set('busca',     busca);
  if (status)    params.set('status',    status);
  if (categoria) params.set('categoria', categoria);

  const tbody = document.getElementById('trajes-tbody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="9"><span class="loading-text">▸ CARREGANDO ARSENAL DE TRAJES...</span></td></tr>`;

  try {
    const res  = await fetch(`/api/trajes?${params}`);
    const data = await res.json();
    renderTable(data);
    updateStats(data);
  } catch {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">⚠ ERRO AO CARREGAR DADOS</td></tr>`;
  }
}

async function loadCategorias() {
  try {
    const res  = await fetch('/api/trajes/categorias');
    const cats = await res.json();
    const sel  = document.getElementById('filtro-categoria');
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c.toUpperCase();
      sel.appendChild(opt);
    });
  } catch {}
}

/* ── RENDERIZAR ────────────────────────────────────────── */

function renderTable(itens) {
  const tbody = document.getElementById('trajes-tbody');
  document.getElementById('strip-total').textContent = itens.length;

  if (!itens.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">NENHUM TRAJE ENCONTRADO</td></tr>`;
    return;
  }

  tbody.innerHTML = itens.map(t => `
    <tr data-id="${t.id}">
      <td class="td-codigo" data-label="CÓDIGO">${t.codigo}</td>
      <td class="td-nome" data-label="NOME">${t.nome}</td>
      <td data-label="CATEGORIA">${categoriaBadge(t.categoria)}</td>
      <td data-label="STATUS">${statusBadge(t.status)}</td>
      <td class="td-material" data-label="MATERIAL">${t.material || '—'}</td>
      <td class="td-blindagem" data-label="BLINDAGEM">${t.blindagem || '—'}</td>
      <td class="td-sistemas" data-label="SISTEMAS">${t.sistemas || '—'}</td>
      <td class="td-orig" data-label="ORIGEM">${t.origem || '—'}</td>
      ${CAN_WRITE ? `
      <td class="td-acoes">
        <button class="btn-edit" onclick="openEdit(${t.id})">EDITAR</button>
        <button class="btn-del"  onclick="openConfirmDelete(${t.id}, '${escapeJs(t.nome)}')">REMOVER</button>
      </td>` : ''}
    </tr>
  `).join('');
}

function categoriaBadge(cat) {
  const map = {
    'Combate':       'cat-combate',
    'Anti-Ameaça':   'cat-antiameaca',
    'Anti-Liga':     'cat-antiliga',
    'Infiltração':   'cat-infiltracao',
    'Especializado': 'cat-especializado',
    'Mecanizado':    'cat-mecanizado',
    'Futuro':        'cat-futuro',
    'Sobrevivência': 'cat-sobrevivencia',
  };
  const cls = map[cat] || 'cat-combate';
  return `<span class="badge-cat ${cls}">${cat.toUpperCase()}</span>`;
}

function statusBadge(status) {
  const map = {
    pronto:     ['PRONTO',     'badge badge-pronto'],
    em_uso:     ['EM USO',     'badge badge-em-uso'],
    manutencao: ['MANUTENÇÃO', 'badge badge-manut'],
    standby:    ['STANDBY',    'badge badge-standby'],
  };
  const [label, cls] = map[status] || ['—', 'badge'];
  return `<span class="${cls}">${label}</span>`;
}

function escapeJs(str) {
  return (str || '').replace(/'/g, "\\'");
}

/* ── STATS ─────────────────────────────────────────────── */

function updateStats(itens) {
  document.getElementById('stat-total').textContent  = itens.length;
  document.getElementById('stat-pronto').textContent = itens.filter(t => t.status === 'pronto').length;
  document.getElementById('stat-uso').textContent    = itens.filter(t => t.status === 'em_uso').length;
  document.getElementById('stat-manut').textContent  = itens.filter(t => t.status === 'manutencao').length;
}

/* ── FILTROS ───────────────────────────────────────────── */

function setupFilters() {
  let debounce;
  document.getElementById('busca').addEventListener('input', () => {
    clearTimeout(debounce); debounce = setTimeout(loadTrajes, 300);
  });
  document.getElementById('filtro-status').addEventListener('change', loadTrajes);
  document.getElementById('filtro-categoria').addEventListener('change', loadTrajes);
}

/* ── MODAL ─────────────────────────────────────────────── */

function openModal(item = null) {
  document.getElementById('modal-title').textContent  = item ? 'EDITAR TRAJE' : 'NOVO TRAJE';
  document.getElementById('edit-id').value            = item ? item.id : '';
  document.getElementById('f-codigo').value           = item ? item.codigo : '';
  document.getElementById('f-nome').value             = item ? item.nome : '';
  document.getElementById('f-categoria').value        = item ? item.categoria : 'Combate';
  document.getElementById('f-status').value           = item ? item.status : 'pronto';
  document.getElementById('f-material').value         = item ? (item.material   || '') : '';
  document.getElementById('f-blindagem').value        = item ? (item.blindagem  || '') : '';
  document.getElementById('f-sistemas').value         = item ? (item.sistemas   || '') : '';
  document.getElementById('f-origem').value           = item ? (item.origem     || '') : '';
  document.getElementById('f-descricao').value        = item ? (item.descricao  || '') : '';

  document.getElementById('f-codigo').readOnly        = !!item;
  document.getElementById('f-codigo').style.opacity   = item ? '0.5' : '1';

  hideAlert('modal-alert');
  document.getElementById('modal-overlay').classList.add('show');
}

async function openEdit(id) {
  try {
    const res  = await fetch(`/api/trajes/${id}`);
    const item = await res.json();
    openModal(item);
  } catch { showAlert('modal-alert', 'error', '⚠ ERRO AO CARREGAR TRAJE'); }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

/* ── SALVAR ────────────────────────────────────────────── */

async function saveItem() {
  const id = document.getElementById('edit-id').value;
  const payload = {
    codigo:    document.getElementById('f-codigo').value.trim().toUpperCase(),
    nome:      document.getElementById('f-nome').value.trim(),
    categoria: document.getElementById('f-categoria').value,
    status:    document.getElementById('f-status').value,
    material:  document.getElementById('f-material').value.trim(),
    blindagem: document.getElementById('f-blindagem').value.trim(),
    sistemas:  document.getElementById('f-sistemas').value.trim(),
    origem:    document.getElementById('f-origem').value.trim(),
    descricao: document.getElementById('f-descricao').value.trim(),
  };

  if (!payload.codigo || !payload.nome) {
    showAlert('modal-alert', 'error', '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS'); return;
  }

  const btn = document.getElementById('btn-save');
  btn.textContent = '▸ SALVANDO...'; btn.disabled = true;

  try {
    const url    = id ? `/api/trajes/${id}` : '/api/trajes';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-User-Role': SESSION.role },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showAlert('modal-alert', 'error', `⚠ ${data.error || 'ERRO AO SALVAR'}`); return; }
    showAlert('modal-alert', 'success', `✓ ${payload.nome} ${id ? 'ATUALIZADO' : 'CADASTRADO'} COM SUCESSO`);
    setTimeout(() => { closeModal(); loadTrajes(); }, 1200);
  } catch { showAlert('modal-alert', 'error', '⚠ FALHA NA COMUNICAÇÃO COM O SERVIDOR'); }
  finally { btn.textContent = '▸ SALVAR'; btn.disabled = false; }
}

/* ── REMOÇÃO ───────────────────────────────────────────── */

let deleteTargetId = null;

function openConfirmDelete(id, nome) {
  deleteTargetId = id;
  document.getElementById('confirm-item-name').textContent = nome;
  document.getElementById('confirm-overlay').classList.add('show');
}

function closeConfirm() {
  deleteTargetId = null;
  document.getElementById('confirm-overlay').classList.remove('show');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('btn-confirm-delete');
  btn.textContent = '▸ REMOVENDO...'; btn.disabled = true;
  try {
    const res = await fetch(`/api/trajes/${deleteTargetId}`, {
      method: 'DELETE', headers: { 'X-User-Role': SESSION.role },
    });
    if (!res.ok) { const d = await res.json(); alert(`ERRO: ${d.error}`); return; }
    closeConfirm(); loadTrajes();
  } catch { alert('FALHA NA COMUNICAÇÃO COM O SERVIDOR'); }
  finally { btn.textContent = '▸ CONFIRMAR REMOÇÃO'; btn.disabled = false; }
}

/* ── HELPERS ───────────────────────────────────────────── */

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.className = `alert ${type}`; el.style.display = 'block';
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});
