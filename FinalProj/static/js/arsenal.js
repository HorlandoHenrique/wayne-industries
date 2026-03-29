/* ============================================================
   WAYNE INDUSTRIES — BAT-COMPUTADOR
   Arquivo: arsenal.js
   Descrição: Lógica da tela do Arsenal
   ============================================================ */

/* ── ESTADO DA SESSÃO ──────────────────────────────────── */

const WRITE_ROLES = ['master', 'manager', 'security'];

function getSession() {
  const params = new URLSearchParams(window.location.search);
  return {
    role: params.get('role') || 'employee',
    user: params.get('user') || 'guest@wayne.com',
  };
}

const SESSION = getSession();
const CAN_WRITE = WRITE_ROLES.includes(SESSION.role);

/* ── INICIALIZAÇÃO ─────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  loadArsenal();
  loadCategorias();
  setupFilters();
  startClock();
});

function setupUI() {
  // Cabeçalho
  const clearMap = {
    master:   'CLEARANCE: MASTER · ACESSO TOTAL',
    manager:  'CLEARANCE: LVL-3 · ACESSO GERENCIAL',
    security: 'CLEARANCE: LVL-2 · ACESSO DE SEGURANÇA',
    employee: 'CLEARANCE: LVL-1 · SOMENTE LEITURA',
  };
  document.getElementById('header-clearance').textContent =
    clearMap[SESSION.role] || clearMap.employee;

  const name = SESSION.user.split('@')[0].replace(/\./g,' ').toUpperCase();
  document.getElementById('session-user').textContent = name;

  // Mostrar/ocultar controles de edição
  if (CAN_WRITE) {
    document.getElementById('btn-add').style.display = 'block';
    document.getElementById('col-acoes').style.display = '';
  }
}

/* ── RELÓGIO ───────────────────────────────────────────── */

function startClock() {
  function tick() {
    document.getElementById('clock').textContent =
      new Date().toLocaleTimeString('pt-BR', { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
}

/* ── NAVEGAÇÃO ─────────────────────────────────────────── */

function goBack() {
  window.location.href = `/batcave-menu.html?role=${SESSION.role}&user=${encodeURIComponent(SESSION.user)}`;
}

/* ── CARREGAR ARSENAL ──────────────────────────────────── */

async function loadArsenal() {
  const busca     = document.getElementById('busca').value;
  const status    = document.getElementById('filtro-status').value;
  const categoria = document.getElementById('filtro-categoria').value;

  const params = new URLSearchParams();
  if (busca)     params.set('busca',     busca);
  if (status)    params.set('status',    status);
  if (categoria) params.set('categoria', categoria);

  const tbody = document.getElementById('arsenal-tbody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="8"><span class="loading-text">▸ CARREGANDO INVENTÁRIO...</span></td></tr>`;

  try {
    const res  = await fetch(`/api/arsenal?${params}`);
    const data = await res.json();
    renderTable(data);
    updateStats(data);
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">⚠ ERRO AO CARREGAR DADOS · VERIFIQUE O SERVIDOR</td></tr>`;
  }
}

async function loadCategorias() {
  try {
    const res  = await fetch('/api/arsenal/categorias');
    const cats = await res.json();
    const sel  = document.getElementById('filtro-categoria');
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
  } catch {}
}

/* ── RENDERIZAR TABELA ─────────────────────────────────── */

function renderTable(itens) {
  const tbody = document.getElementById('arsenal-tbody');
  document.getElementById('strip-total').textContent = itens.length;

  if (!itens.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">NENHUM ITEM ENCONTRADO</td></tr>`;
    return;
  }

  tbody.innerHTML = itens.map(item => `
    <tr data-id="${item.id}">
      <td class="td-codigo" data-label="CÓDIGO">${item.codigo}</td>
      <td class="td-nome" data-label="NOME">${item.nome}</td>
      <td class="td-cat" data-label="CATEGORIA">${item.categoria}</td>
      <td class="td-qty" data-label="QTD" style="color:${item.quantidade === 0 ? 'var(--red)' : 'var(--cyan)'}">${item.quantidade}</td>
      <td data-label="STATUS">${statusBadge(item.status)}</td>
      <td class="td-desc" data-label="DESCRIÇÃO">${item.descricao || '—'}</td>
      <td class="td-date" data-label="ATUALIZADO">${formatDate(item.atualizado_em)}</td>
      ${CAN_WRITE ? `
      <td class="td-acoes">
        <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
        <button class="btn-del"  onclick="openConfirmDelete(${item.id}, '${escapeJs(item.nome)}')">REMOVER</button>
      </td>` : ''}
    </tr>
  `).join('');
}

function statusBadge(status) {
  const map = {
    disponivel: ['DISPONÍVEL', 'badge-disp'],
    em_uso:     ['EM USO',     'badge-uso'],
    manutencao: ['MANUTENÇÃO', 'badge-manut'],
  };
  const [label, cls] = map[status] || ['—', ''];
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}

function escapeJs(str) {
  return (str || '').replace(/'/g, "\\'");
}

/* ── STATS ─────────────────────────────────────────────── */

function updateStats(itens) {
  document.getElementById('stat-total').textContent = itens.length;
  document.getElementById('stat-disp').textContent  = itens.filter(i => i.status === 'disponivel').length;
  document.getElementById('stat-uso').textContent   = itens.filter(i => i.status === 'em_uso').length;
  document.getElementById('stat-manut').textContent = itens.filter(i => i.status === 'manutencao').length;
}

/* ── FILTROS ───────────────────────────────────────────── */

function setupFilters() {
  let debounce;
  document.getElementById('busca').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(loadArsenal, 300);
  });
  document.getElementById('filtro-status').addEventListener('change', loadArsenal);
  document.getElementById('filtro-categoria').addEventListener('change', loadArsenal);
}

/* ── MODAL ADICIONAR / EDITAR ──────────────────────────── */

function openModal(item = null) {
  document.getElementById('modal-title').textContent = item ? 'EDITAR ITEM · ARSENAL' : 'NOVO ITEM · ARSENAL';
  document.getElementById('edit-id').value      = item ? item.id : '';
  document.getElementById('f-codigo').value     = item ? item.codigo : '';
  document.getElementById('f-nome').value       = item ? item.nome : '';
  document.getElementById('f-categoria').value  = item ? item.categoria : 'Geral';
  document.getElementById('f-quantidade').value = item ? item.quantidade : '';
  document.getElementById('f-status').value     = item ? item.status : 'disponivel';
  document.getElementById('f-descricao').value  = item ? (item.descricao || '') : '';

  // Código não editável em modo edição
  document.getElementById('f-codigo').readOnly = !!item;
  document.getElementById('f-codigo').style.opacity = item ? '0.5' : '1';

  hideAlert('modal-alert');
  document.getElementById('modal-overlay').classList.add('show');
}

async function openEdit(id) {
  try {
    const res  = await fetch(`/api/arsenal/${id}`);
    const item = await res.json();
    openModal(item);
  } catch {
    showAlert('modal-alert', 'error', '⚠ ERRO AO CARREGAR ITEM');
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

/* ── SALVAR ITEM ───────────────────────────────────────── */

async function saveItem() {
  const id = document.getElementById('edit-id').value;

  const payload = {
    codigo:     document.getElementById('f-codigo').value.trim().toUpperCase(),
    nome:       document.getElementById('f-nome').value.trim(),
    categoria:  document.getElementById('f-categoria').value,
    quantidade: parseInt(document.getElementById('f-quantidade').value) || 0,
    status:     document.getElementById('f-status').value,
    descricao:  document.getElementById('f-descricao').value.trim(),
  };

  if (!payload.codigo || !payload.nome) {
    showAlert('modal-alert', 'error', '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS');
    return;
  }

  const btn = document.getElementById('btn-save');
  btn.textContent = '▸ SALVANDO...';
  btn.disabled = true;

  try {
    const url    = id ? `/api/arsenal/${id}` : '/api/arsenal';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role':  SESSION.role,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('modal-alert', 'error', `⚠ ${data.error || 'ERRO AO SALVAR'}`);
      return;
    }

    showAlert('modal-alert', 'success', `✓ ITEM ${payload.codigo} ${id ? 'ATUALIZADO' : 'CADASTRADO'} COM SUCESSO`);
    setTimeout(() => { closeModal(); loadArsenal(); }, 1200);

  } catch {
    showAlert('modal-alert', 'error', '⚠ FALHA NA COMUNICAÇÃO COM O SERVIDOR');
  } finally {
    btn.textContent = '▸ SALVAR';
    btn.disabled = false;
  }
}

/* ── CONFIRMAR REMOÇÃO ─────────────────────────────────── */

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
  btn.textContent = '▸ REMOVENDO...';
  btn.disabled = true;

  try {
    const res = await fetch(`/api/arsenal/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'X-User-Role': SESSION.role },
    });
    const data = await res.json();

    if (!res.ok) {
      alert(`ERRO: ${data.error}`);
      return;
    }

    closeConfirm();
    loadArsenal();

  } catch {
    alert('FALHA NA COMUNICAÇÃO COM O SERVIDOR');
  } finally {
    btn.textContent = '▸ CONFIRMAR REMOÇÃO';
    btn.disabled = false;
  }
}

/* ── ALERTAS ───────────────────────────────────────────── */

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `alert ${type}`;
  el.style.display = 'block';
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

/* ── FECHAR MODAL COM ESC ──────────────────────────────── */

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});
