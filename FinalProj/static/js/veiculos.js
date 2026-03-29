/* ============================================================
   WAYNE INDUSTRIES — BAT-COMPUTADOR
   Arquivo: veiculos.js
   Descrição: Lógica da tela de Veículos
   ============================================================ */

const WRITE_ROLES = ['master', 'manager', 'security'];

function getSession() {
  const p = new URLSearchParams(window.location.search);
  return { role: p.get('role') || 'employee', user: p.get('user') || 'guest@wayne.com' };
}

const SESSION   = getSession();
const CAN_WRITE = WRITE_ROLES.includes(SESSION.role);

/* ── INICIALIZAÇÃO ─────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  loadVeiculos();
  loadTipos();
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
  const tick = () => {
    document.getElementById('clock').textContent =
      new Date().toLocaleTimeString('pt-BR', { hour12: false });
  };
  tick(); setInterval(tick, 1000);
}

function goBack() {
  window.location.href = `/batcave-menu.html?role=${SESSION.role}&user=${encodeURIComponent(SESSION.user)}`;
}

/* ── CARREGAR VEÍCULOS ─────────────────────────────────── */

async function loadVeiculos() {
  const busca  = document.getElementById('busca').value;
  const status = document.getElementById('filtro-status').value;
  const tipo   = document.getElementById('filtro-tipo').value;

  const params = new URLSearchParams();
  if (busca)  params.set('busca',  busca);
  if (status) params.set('status', status);
  if (tipo)   params.set('tipo',   tipo);

  const tbody = document.getElementById('veiculos-tbody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="9"><span class="loading-text">▸ CARREGANDO GARAGEM...</span></td></tr>`;

  try {
    const res  = await fetch(`/api/veiculos?${params}`);
    const data = await res.json();
    renderTable(data);
    updateStats(data);
  } catch {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">⚠ ERRO AO CARREGAR DADOS · VERIFIQUE O SERVIDOR</td></tr>`;
  }
}

async function loadTipos() {
  try {
    const res  = await fetch('/api/veiculos/tipos');
    const tipos = await res.json();
    const sel  = document.getElementById('filtro-tipo');
    tipos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t.toUpperCase();
      sel.appendChild(opt);
    });
  } catch {}
}

/* ── RENDERIZAR TABELA ─────────────────────────────────── */

function renderTable(itens) {
  const tbody = document.getElementById('veiculos-tbody');
  document.getElementById('strip-total').textContent = itens.length;

  if (!itens.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">NENHUM VEÍCULO ENCONTRADO</td></tr>`;
    return;
  }

  tbody.innerHTML = itens.map(v => `
    <tr data-id="${v.id}">
      <td class="td-codigo" data-label="CÓDIGO">${v.codigo}</td>
      <td class="td-nome" data-label="NOME">${v.nome}</td>
      <td data-label="TIPO">${tipoBadge(v.tipo)}</td>
      <td class="td-vel" data-label="VELOCIDADE">${v.velocidade || '—'}</td>
      <td class="td-trip" data-label="TRIPULAÇÃO">${v.tripulacao}</td>
      <td data-label="STATUS">${statusBadge(v.status)}</td>
      <td class="td-arm" data-label="ARMAMENTO">${v.armamento || '—'}</td>
      <td class="td-orig" data-label="ORIGEM">${v.origem || '—'}</td>
      ${CAN_WRITE ? `
      <td class="td-acoes">
        <button class="btn-edit" onclick="openEdit(${v.id})">EDITAR</button>
        <button class="btn-del"  onclick="openConfirmDelete(${v.id}, '${escapeJs(v.nome)}')">REMOVER</button>
      </td>` : ''}
    </tr>
  `).join('');
}

function tipoBadge(tipo) {
  const map = {
    'Terrestre':   ['🚗', 'badge-terrestre'],
    'Aéreo':       ['✈',  'badge-aereo'],
    'Aquático':    ['⛵',  'badge-aquatico'],
    'Submersível': ['🌊',  'badge-submersivel'],
    'Espacial':    ['🚀',  'badge-espacial'],
  };
  const [icon, cls] = map[tipo] || ['·', 'badge-terrestre'];
  return `<span class="badge-tipo ${cls}"><span class="tipo-icon">${icon}</span>${tipo.toUpperCase()}</span>`;
}

function statusBadge(status) {
  const map = {
    pronto:     ['PRONTO',     'badge badge-pronto'],
    em_uso:     ['EM USO',     'badge badge-em-uso'],
    manutencao: ['MANUTENÇÃO', 'badge badge-manut'],
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
  document.getElementById('stat-pronto').textContent = itens.filter(v => v.status === 'pronto').length;
  document.getElementById('stat-uso').textContent    = itens.filter(v => v.status === 'em_uso').length;
  document.getElementById('stat-manut').textContent  = itens.filter(v => v.status === 'manutencao').length;
}

/* ── FILTROS ───────────────────────────────────────────── */

function setupFilters() {
  let debounce;
  document.getElementById('busca').addEventListener('input', () => {
    clearTimeout(debounce); debounce = setTimeout(loadVeiculos, 300);
  });
  document.getElementById('filtro-status').addEventListener('change', loadVeiculos);
  document.getElementById('filtro-tipo').addEventListener('change', loadVeiculos);
}

/* ── MODAL ─────────────────────────────────────────────── */

function openModal(item = null) {
  document.getElementById('modal-title').textContent = item ? 'EDITAR VEÍCULO' : 'NOVO VEÍCULO';
  document.getElementById('edit-id').value       = item ? item.id : '';
  document.getElementById('f-codigo').value      = item ? item.codigo : '';
  document.getElementById('f-nome').value        = item ? item.nome : '';
  document.getElementById('f-tipo').value        = item ? item.tipo : 'Terrestre';
  document.getElementById('f-velocidade').value  = item ? (item.velocidade || '') : '';
  document.getElementById('f-tripulacao').value  = item ? item.tripulacao : 1;
  document.getElementById('f-status').value      = item ? item.status : 'pronto';
  document.getElementById('f-origem').value      = item ? (item.origem || '') : '';
  document.getElementById('f-armamento').value   = item ? (item.armamento || '') : '';
  document.getElementById('f-descricao').value   = item ? (item.descricao || '') : '';

  document.getElementById('f-codigo').readOnly   = !!item;
  document.getElementById('f-codigo').style.opacity = item ? '0.5' : '1';

  hideAlert('modal-alert');
  document.getElementById('modal-overlay').classList.add('show');
}

async function openEdit(id) {
  try {
    const res  = await fetch(`/api/veiculos/${id}`);
    const item = await res.json();
    openModal(item);
  } catch {
    showAlert('modal-alert', 'error', '⚠ ERRO AO CARREGAR VEÍCULO');
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

/* ── SALVAR ────────────────────────────────────────────── */

async function saveItem() {
  const id = document.getElementById('edit-id').value;

  const payload = {
    codigo:     document.getElementById('f-codigo').value.trim().toUpperCase(),
    nome:       document.getElementById('f-nome').value.trim(),
    tipo:       document.getElementById('f-tipo').value,
    velocidade: document.getElementById('f-velocidade').value.trim(),
    tripulacao: parseInt(document.getElementById('f-tripulacao').value) || 1,
    status:     document.getElementById('f-status').value,
    origem:     document.getElementById('f-origem').value.trim(),
    armamento:  document.getElementById('f-armamento').value.trim(),
    descricao:  document.getElementById('f-descricao').value.trim(),
  };

  if (!payload.codigo || !payload.nome) {
    showAlert('modal-alert', 'error', '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS');
    return;
  }

  const btn = document.getElementById('btn-save');
  btn.textContent = '▸ SALVANDO...'; btn.disabled = true;

  try {
    const url    = id ? `/api/veiculos/${id}` : '/api/veiculos';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-User-Role': SESSION.role },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert('modal-alert', 'error', `⚠ ${data.error || 'ERRO AO SALVAR'}`);
      return;
    }

    showAlert('modal-alert', 'success', `✓ ${payload.nome} ${id ? 'ATUALIZADO' : 'CADASTRADO'} COM SUCESSO`);
    setTimeout(() => { closeModal(); loadVeiculos(); }, 1200);
  } catch {
    showAlert('modal-alert', 'error', '⚠ FALHA NA COMUNICAÇÃO COM O SERVIDOR');
  } finally {
    btn.textContent = '▸ SALVAR'; btn.disabled = false;
  }
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
    const res = await fetch(`/api/veiculos/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'X-User-Role': SESSION.role },
    });
    if (!res.ok) { const d = await res.json(); alert(`ERRO: ${d.error}`); return; }
    closeConfirm(); loadVeiculos();
  } catch {
    alert('FALHA NA COMUNICAÇÃO COM O SERVIDOR');
  } finally {
    btn.textContent = '▸ CONFIRMAR REMOÇÃO'; btn.disabled = false;
  }
}

/* ── ALERTAS / ESC ─────────────────────────────────────── */

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
