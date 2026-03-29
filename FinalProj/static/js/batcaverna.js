/* ============================================================
   WAYNE INDUSTRIES — BATCAVERNA
   Arquivo: batcaverna.js
   ============================================================ */

const WRITE_ROLES = ['master', 'manager', 'security'];

function getSession() {
  const p = new URLSearchParams(window.location.search);
  return { role: p.get('role') || 'employee', user: p.get('user') || 'guest@wayne.com' };
}
const SESSION   = getSession();
const CAN_WRITE = WRITE_ROLES.includes(SESSION.role);

/* ── ABA ATUAL ─────────────────────────────────────────── */
let currentTab = 'sistemas';

/* ══════════════════════════════════════════════════════════
   CONFIGURAÇÃO DAS ABAS
   ══════════════════════════════════════════════════════════ */

const TABS = {

  // ── SISTEMAS ───────────────────────────────────────────
  sistemas: {
    api: '/api/batcaverna/sistemas',
    apiCats: '/api/batcaverna/sistemas/categorias',
    addLabel: '+ NOVO SISTEMA',
    statusOptions: [
      { v:'operacional', l:'OPERACIONAL' },
      { v:'standby',     l:'STANDBY'     },
      { v:'manutencao',  l:'MANUTENÇÃO'  },
      { v:'critico',     l:'CRÍTICO'     },
      { v:'offline',     l:'OFFLINE'     },
    ],
    headers: ['CÓDIGO','NOME','CATEGORIA','STATUS','LOCALIZAÇÃO','UPTIME','OBSERVAÇÕES','ÚLTIMA REVISÃO'],
    renderRow(item, canWrite) {
      return `
        <td class="td-codigo">${item.codigo}</td>
        <td class="td-nome">${item.nome}</td>
        <td>${catBadge(item.categoria)}</td>
        <td>${statusBadge(item.status, 'sistemas')}</td>
        <td class="td-local">${item.localizacao || '—'}</td>
        <td style="font-family:'Orbitron',sans-serif;font-size:11px;color:var(--cyan)">${item.uptime || '—'}</td>
        <td class="td-nota">${item.observacoes || '—'}</td>
        <td class="td-date">${formatDate(item.atualizado_em)}</td>
        ${canWrite ? `<td class="td-acoes">
          <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
          <button class="btn-del"  onclick="openConfirmDelete(${item.id},'${esc(item.nome)}')">REMOVER</button>
        </td>` : ''}`;
    },
    modalFields(item) {
      return `
        <input type="hidden" id="edit-id" value="${item ? item.id : ''}">
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ CÓDIGO</label>
            <input type="text" id="f-codigo" class="field-input" placeholder="SYS-XXX" value="${item ? item.codigo : ''}" ${item ? 'readonly style="opacity:.5"' : ''}></div>
          <div class="form-field"><label class="field-label">▸ CATEGORIA</label>
            <select id="f-categoria" class="field-input">
              ${['Computação','Energia','Comunicação','Transporte','Defesa','Ambiental'].map(c =>
                `<option value="${c}" ${item && item.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ NOME DO SISTEMA</label>
          <input type="text" id="f-nome" class="field-input" placeholder="EX: BAT-COMPUTADOR CENTRAL" value="${item ? item.nome : ''}"></div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ STATUS</label>
            <select id="f-status" class="field-input">
              ${[['operacional','OPERACIONAL'],['standby','STANDBY'],['manutencao','MANUTENÇÃO'],['critico','CRÍTICO'],['offline','OFFLINE']].map(([v,l]) =>
                `<option value="${v}" ${item && item.status === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></div>
          <div class="form-field"><label class="field-label">▸ LOCALIZAÇÃO</label>
            <input type="text" id="f-localizacao" class="field-input" placeholder="EX: Nível B2 · Setor Norte" value="${item ? (item.localizacao||'') : ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ UPTIME</label>
            <input type="text" id="f-uptime" class="field-input" placeholder="EX: 99.97%" value="${item ? (item.uptime||'') : ''}"></div>
          <div class="form-field"><label class="field-label">▸ FORNECEDOR / ORIGEM</label>
            <input type="text" id="f-origem" class="field-input" placeholder="EX: Wayne Enterprises R&D" value="${item ? (item.origem||'') : ''}"></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ OBSERVAÇÕES</label>
          <textarea id="f-observacoes" class="field-input" rows="2">${item ? (item.observacoes||'') : ''}</textarea></div>
        <div class="alert" id="modal-alert"></div>`;
    },
    getPayload(id) {
      return {
        codigo:      v('f-codigo').toUpperCase(),
        nome:        v('f-nome'),
        categoria:   v('f-categoria'),
        status:      v('f-status'),
        localizacao: v('f-localizacao'),
        uptime:      v('f-uptime'),
        origem:      v('f-origem'),
        observacoes: v('f-observacoes'),
      };
    },
    validate(p) { return p.codigo && p.nome ? null : '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS'; },
    statsText(itens) {
      const op  = itens.filter(i => i.status === 'operacional').length;
      const cri = itens.filter(i => i.status === 'critico').length;
      return `OPERACIONAL <span class="stat-val" style="color:var(--green)">${op}</span>
              <span class="stat-sep">·</span>
              CRÍTICO <span class="stat-val" style="color:var(--red)">${cri}</span>`;
    },
  },

  // ── TROFÉUS ────────────────────────────────────────────
  trofeus: {
    api: '/api/batcaverna/trofeus',
    apiCats: '/api/batcaverna/trofeus/categorias',
    addLabel: '+ NOVO TROFÉU',
    statusOptions: [
      { v:'exposicao',   l:'EM EXPOSIÇÃO' },
      { v:'armazenado',  l:'ARMAZENADO'   },
      { v:'restauracao', l:'RESTAURAÇÃO'  },
      { v:'restrito',    l:'RESTRITO'     },
    ],
    headers: ['CÓDIGO','NOME','CATEGORIA','STATUS','ORIGEM / VILÃO','LOCAL DE EXIBIÇÃO','PRIMEIRO APARECIMENTO','OBSERVAÇÕES'],
    renderRow(item, canWrite) {
      return `
        <td class="td-codigo">${item.codigo}</td>
        <td class="td-nome">${item.nome}</td>
        <td>${catBadge(item.categoria)}</td>
        <td>${statusBadge(item.status, 'trofeus')}</td>
        <td class="td-orig">${item.origem || '—'}</td>
        <td class="td-local">${item.local_exibicao || '—'}</td>
        <td class="td-orig">${item.primeiro_aparecimento || '—'}</td>
        <td class="td-nota">${item.observacoes || '—'}</td>
        ${canWrite ? `<td class="td-acoes">
          <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
          <button class="btn-del"  onclick="openConfirmDelete(${item.id},'${esc(item.nome)}')">REMOVER</button>
        </td>` : ''}`;
    },
    modalFields(item) {
      return `
        <input type="hidden" id="edit-id" value="${item ? item.id : ''}">
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ CÓDIGO</label>
            <input type="text" id="f-codigo" class="field-input" placeholder="TRF-XXX" value="${item ? item.codigo : ''}" ${item ? 'readonly style="opacity:.5"' : ''}></div>
          <div class="form-field"><label class="field-label">▸ CATEGORIA</label>
            <select id="f-categoria" class="field-input">
              ${['Vilão','Aliado','Histórico','Arma'].map(c =>
                `<option value="${c}" ${item && item.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ NOME DO TROFÉU</label>
          <input type="text" id="f-nome" class="field-input" placeholder="EX: T-REX MECÂNICO" value="${item ? item.nome : ''}"></div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ STATUS</label>
            <select id="f-status" class="field-input">
              ${[['exposicao','EM EXPOSIÇÃO'],['armazenado','ARMAZENADO'],['restauracao','RESTAURAÇÃO'],['restrito','RESTRITO']].map(([v,l]) =>
                `<option value="${v}" ${item && item.status === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></div>
          <div class="form-field"><label class="field-label">▸ ORIGEM / VILÃO</label>
            <input type="text" id="f-origem" class="field-input" placeholder="EX: Penny Plunderer" value="${item ? (item.origem||'') : ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ LOCAL DE EXIBIÇÃO</label>
            <input type="text" id="f-local_exibicao" class="field-input" placeholder="EX: Salão Principal · Nível A" value="${item ? (item.local_exibicao||'') : ''}"></div>
          <div class="form-field"><label class="field-label">▸ PRIMEIRO APARECIMENTO</label>
            <input type="text" id="f-primeiro_aparecimento" class="field-input" placeholder="EX: Batman #35 (1946)" value="${item ? (item.primeiro_aparecimento||'') : ''}"></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ OBSERVAÇÕES / HISTÓRIA</label>
          <textarea id="f-observacoes" class="field-input" rows="3">${item ? (item.observacoes||'') : ''}</textarea></div>
        <div class="alert" id="modal-alert"></div>`;
    },
    getPayload(id) {
      return {
        codigo:                v('f-codigo').toUpperCase(),
        nome:                  v('f-nome'),
        categoria:             v('f-categoria'),
        status:                v('f-status'),
        origem:                v('f-origem'),
        local_exibicao:        v('f-local_exibicao'),
        primeiro_aparecimento: v('f-primeiro_aparecimento'),
        observacoes:           v('f-observacoes'),
      };
    },
    validate(p) { return p.codigo && p.nome ? null : '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS'; },
    statsText(itens) {
      const exp = itens.filter(i => i.status === 'exposicao').length;
      const res = itens.filter(i => i.status === 'restrito').length;
      return `EM EXPOSIÇÃO <span class="stat-val">${exp}</span>
              <span class="stat-sep">·</span>
              RESTRITOS <span class="stat-val" style="color:var(--red)">${res}</span>`;
    },
  },

  // ── LABORATÓRIO ────────────────────────────────────────
  laboratorio: {
    api: '/api/batcaverna/laboratorio',
    apiCats: '/api/batcaverna/laboratorio/categorias',
    addLabel: '+ NOVO EQUIPAMENTO',
    statusOptions: [
      { v:'ativo',       l:'ATIVO'        },
      { v:'analise',     l:'EM ANÁLISE'   },
      { v:'concluido',   l:'CONCLUÍDO'    },
      { v:'manutencao',  l:'MANUTENÇÃO'   },
      { v:'contaminado', l:'CONTAMINADO'  },
    ],
    headers: ['CÓDIGO','NOME','CATEGORIA','STATUS','AMOSTRA / ASSUNTO','PRIORIDADE','RESPONSÁVEL','PRAZO / DATA'],
    renderRow(item, canWrite) {
      const prioColor = item.prioridade === 'MÁXIMA' ? 'var(--red)' :
                        item.prioridade === 'ALTA'   ? 'var(--yellow)' : 'var(--cyan)';
      return `
        <td class="td-codigo">${item.codigo}</td>
        <td class="td-nome">${item.nome}</td>
        <td>${catBadge(item.categoria)}</td>
        <td>${statusBadge(item.status, 'laboratorio')}</td>
        <td class="td-nota">${item.amostra || '—'}</td>
        <td style="font-family:'Orbitron',sans-serif;font-size:10px;color:${prioColor}">${item.prioridade || '—'}</td>
        <td class="td-local">${item.responsavel || '—'}</td>
        <td class="td-date">${item.prazo || formatDate(item.atualizado_em)}</td>
        ${canWrite ? `<td class="td-acoes">
          <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
          <button class="btn-del"  onclick="openConfirmDelete(${item.id},'${esc(item.nome)}')">REMOVER</button>
        </td>` : ''}`;
    },
    modalFields(item) {
      return `
        <input type="hidden" id="edit-id" value="${item ? item.id : ''}">
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ CÓDIGO</label>
            <input type="text" id="f-codigo" class="field-input" placeholder="LAB-XXX" value="${item ? item.codigo : ''}" ${item ? 'readonly style="opacity:.5"' : ''}></div>
          <div class="form-field"><label class="field-label">▸ CATEGORIA</label>
            <select id="f-categoria" class="field-input">
              ${['Forense','Químico','Biológico','Computação'].map(c =>
                `<option value="${c}" ${item && item.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ NOME / ANÁLISE</label>
          <input type="text" id="f-nome" class="field-input" placeholder="EX: ANÁLISE DE DNA · AMOSTRA #47" value="${item ? item.nome : ''}"></div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ STATUS</label>
            <select id="f-status" class="field-input">
              ${[['ativo','ATIVO'],['analise','EM ANÁLISE'],['concluido','CONCLUÍDO'],['manutencao','MANUTENÇÃO'],['contaminado','CONTAMINADO']].map(([v,l]) =>
                `<option value="${v}" ${item && item.status === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></div>
          <div class="form-field"><label class="field-label">▸ PRIORIDADE</label>
            <select id="f-prioridade" class="field-input">
              ${['MÁXIMA','ALTA','MÉDIA','BAIXA'].map(p =>
                `<option value="${p}" ${item && item.prioridade === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ AMOSTRA / ASSUNTO</label>
            <input type="text" id="f-amostra" class="field-input" placeholder="EX: Toxina do Coringa #47" value="${item ? (item.amostra||'') : ''}"></div>
          <div class="form-field"><label class="field-label">▸ RESPONSÁVEL</label>
            <input type="text" id="f-responsavel" class="field-input" placeholder="EX: Lucius Fox" value="${item ? (item.responsavel||'') : ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ PRAZO / DATA</label>
            <input type="text" id="f-prazo" class="field-input" placeholder="EX: 6h RESTANTES" value="${item ? (item.prazo||'') : ''}"></div>
          <div class="form-field"><label class="field-label">▸ LOCAL</label>
            <input type="text" id="f-localizacao" class="field-input" placeholder="EX: Bancada B · Setor 3" value="${item ? (item.localizacao||'') : ''}"></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ OBSERVAÇÕES</label>
          <textarea id="f-observacoes" class="field-input" rows="2">${item ? (item.observacoes||'') : ''}</textarea></div>
        <div class="alert" id="modal-alert"></div>`;
    },
    getPayload(id) {
      return {
        codigo:      v('f-codigo').toUpperCase(),
        nome:        v('f-nome'),
        categoria:   v('f-categoria'),
        status:      v('f-status'),
        prioridade:  v('f-prioridade'),
        amostra:     v('f-amostra'),
        responsavel: v('f-responsavel'),
        prazo:       v('f-prazo'),
        localizacao: v('f-localizacao'),
        observacoes: v('f-observacoes'),
      };
    },
    validate(p) { return p.codigo && p.nome ? null : '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS'; },
    statsText(itens) {
      const an = itens.filter(i => i.status === 'analise').length;
      const co = itens.filter(i => i.status === 'contaminado').length;
      return `EM ANÁLISE <span class="stat-val" style="color:var(--yellow)">${an}</span>
              ${co ? `<span class="stat-sep">·</span> CONTAMINADO <span class="stat-val" style="color:var(--red)">${co}</span>` : ''}`;
    },
  },

  // ── SEGURANÇA ──────────────────────────────────────────
  seguranca: {
    api: '/api/batcaverna/seguranca',
    apiCats: '/api/batcaverna/seguranca/categorias',
    addLabel: '+ NOVO PROTOCOLO',
    statusOptions: [
      { v:'armado',    l:'ARMADO'    },
      { v:'desarmado', l:'DESARMADO' },
      { v:'alerta',    l:'ALERTA'    },
      { v:'manutencao',l:'MANUTENÇÃO'},
      { v:'offline',   l:'OFFLINE'   },
    ],
    headers: ['CÓDIGO','NOME','CATEGORIA','STATUS','COBERTURA','NÍVEL AMEAÇA','ÚLTIMA ATIVAÇÃO','OBSERVAÇÕES'],
    renderRow(item, canWrite) {
      const nc = item.nivel_ameaca;
      const nColor = nc === '10' || nc === '9' ? 'var(--red)' :
                     nc === '8'  || nc === '7' ? 'var(--yellow)' : 'var(--cyan)';
      return `
        <td class="td-codigo">${item.codigo}</td>
        <td class="td-nome">${item.nome}</td>
        <td>${catBadge(item.categoria)}</td>
        <td>${statusBadge(item.status, 'seguranca')}</td>
        <td class="td-local">${item.cobertura || '—'}</td>
        <td class="td-nivel" style="color:${nColor}">${item.nivel_ameaca || '—'}</td>
        <td class="td-date">${item.ultima_ativacao || formatDate(item.atualizado_em)}</td>
        <td class="td-nota">${item.observacoes || '—'}</td>
        ${canWrite ? `<td class="td-acoes">
          <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
          <button class="btn-del"  onclick="openConfirmDelete(${item.id},'${esc(item.nome)}')">REMOVER</button>
        </td>` : ''}`;
    },
    modalFields(item) {
      return `
        <input type="hidden" id="edit-id" value="${item ? item.id : ''}">
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ CÓDIGO</label>
            <input type="text" id="f-codigo" class="field-input" placeholder="SEC-XXX" value="${item ? item.codigo : ''}" ${item ? 'readonly style="opacity:.5"' : ''}></div>
          <div class="form-field"><label class="field-label">▸ CATEGORIA</label>
            <select id="f-categoria" class="field-input">
              ${['Perímetro','Acesso','Vigilância','Protocolo'].map(c =>
                `<option value="${c}" ${item && item.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ NOME DO PROTOCOLO / SISTEMA</label>
          <input type="text" id="f-nome" class="field-input" placeholder="EX: PROTOCOLO ARQUEIRO — CONTENÇÃO FLASH" value="${item ? item.nome : ''}"></div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ STATUS</label>
            <select id="f-status" class="field-input">
              ${[['armado','ARMADO'],['desarmado','DESARMADO'],['alerta','ALERTA'],['manutencao','MANUTENÇÃO'],['offline','OFFLINE']].map(([v,l]) =>
                `<option value="${v}" ${item && item.status === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></div>
          <div class="form-field"><label class="field-label">▸ NÍVEL DE AMEAÇA (1–10)</label>
            <input type="number" id="f-nivel_ameaca" class="field-input" min="1" max="10" placeholder="1–10" value="${item ? (item.nivel_ameaca||'') : ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ COBERTURA / ALVO</label>
            <input type="text" id="f-cobertura" class="field-input" placeholder="EX: Perímetro Norte · Câmeras 01–12" value="${item ? (item.cobertura||'') : ''}"></div>
          <div class="form-field"><label class="field-label">▸ ÚLTIMA ATIVAÇÃO</label>
            <input type="text" id="f-ultima_ativacao" class="field-input" placeholder="EX: 04:28 · Setor 7-G" value="${item ? (item.ultima_ativacao||'') : ''}"></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ OBSERVAÇÕES</label>
          <textarea id="f-observacoes" class="field-input" rows="2">${item ? (item.observacoes||'') : ''}</textarea></div>
        <div class="alert" id="modal-alert"></div>`;
    },
    getPayload(id) {
      return {
        codigo:           v('f-codigo').toUpperCase(),
        nome:             v('f-nome'),
        categoria:        v('f-categoria'),
        status:           v('f-status'),
        nivel_ameaca:     v('f-nivel_ameaca'),
        cobertura:        v('f-cobertura'),
        ultima_ativacao:  v('f-ultima_ativacao'),
        observacoes:      v('f-observacoes'),
      };
    },
    validate(p) { return p.codigo && p.nome ? null : '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS'; },
    statsText(itens) {
      const arm = itens.filter(i => i.status === 'armado').length;
      const ale = itens.filter(i => i.status === 'alerta').length;
      return `ARMADOS <span class="stat-val" style="color:var(--green)">${arm}</span>
              ${ale ? `<span class="stat-sep">·</span> ALERTAS <span class="stat-val" style="color:var(--red)">${ale}</span>` : ''}`;
    },
  },
};

/* ── HELPERS ───────────────────────────────────────────── */

function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function esc(s) { return (s||'').replace(/'/g, "\\'"); }

function formatDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
}

function statusBadge(status, tab) {
  const maps = {
    sistemas:    { operacional:'OPERACIONAL', standby:'STANDBY', manutencao:'MANUTENÇÃO', critico:'CRÍTICO', offline:'OFFLINE' },
    trofeus:     { exposicao:'EM EXPOSIÇÃO', armazenado:'ARMAZENADO', restauracao:'RESTAURAÇÃO', restrito:'RESTRITO' },
    laboratorio: { ativo:'ATIVO', analise:'EM ANÁLISE', concluido:'CONCLUÍDO', manutencao:'MANUTENÇÃO', contaminado:'CONTAMINADO' },
    seguranca:   { armado:'ARMADO', desarmado:'DESARMADO', alerta:'ALERTA', manutencao:'MANUTENÇÃO', offline:'OFFLINE' },
  };
  const label = (maps[tab] || {})[status] || status.toUpperCase();
  return `<span class="badge badge-${status}">${label}</span>`;
}

function catBadge(cat) {
  const cls = {
    'Computação':'cat-computacao', 'Energia':'cat-energia', 'Comunicação':'cat-comunicacao',
    'Transporte':'cat-transporte', 'Defesa':'cat-defesa', 'Ambiental':'cat-ambiental',
    'Vilão':'cat-vilao', 'Aliado':'cat-aliado', 'Histórico':'cat-historico', 'Arma':'cat-arma',
    'Forense':'cat-forense', 'Químico':'cat-quimico', 'Biológico':'cat-biologico',
    'Perímetro':'cat-perimetro', 'Acesso':'cat-acesso', 'Vigilância':'cat-vigilancia', 'Protocolo':'cat-protocolo',
  }[cat] || 'cat-computacao';
  return `<span class="badge-cat ${cls}">${cat.toUpperCase()}</span>`;
}

/* ── INIT ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  switchTab('sistemas');
  startClock();
});

function setupUI() {
  const clearMap = {
    master:'CLEARANCE: MASTER · ACESSO TOTAL', manager:'CLEARANCE: LVL-3 · ACESSO GERENCIAL',
    security:'CLEARANCE: LVL-2 · ACESSO DE SEGURANÇA', employee:'CLEARANCE: LVL-1 · SOMENTE LEITURA',
  };
  document.getElementById('header-clearance').textContent = clearMap[SESSION.role] || clearMap.employee;
  document.getElementById('session-user').textContent = SESSION.user.split('@')[0].replace(/\./g,' ').toUpperCase();
  if (CAN_WRITE) document.getElementById('btn-add').style.display = 'block';
}

function startClock() {
  const tick = () => document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('pt-BR', { hour12: false });
  tick(); setInterval(tick, 1000);
}

function goBack() {
  window.location.href = `/batcave-menu.html?role=${SESSION.role}&user=${encodeURIComponent(SESSION.user)}`;
}

/* ── TROCAR ABA ────────────────────────────────────────── */

window.switchTab = async function(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  const cfg = TABS[tab];

  // Atualiza botão
  document.getElementById('btn-add').textContent = cfg.addLabel;

  // Atualiza filtro status
  const fStatus = document.getElementById('filtro-status');
  fStatus.innerHTML = '<option value="">TODOS OS STATUS</option>' +
    cfg.statusOptions.map(o => `<option value="${o.v}">${o.l}</option>`).join('');

  // Atualiza filtro categoria
  const fCat = document.getElementById('filtro-cat');
  fCat.innerHTML = '<option value="">TODAS AS CATEGORIAS</option>';
  try {
    const res  = await fetch(cfg.apiCats);
    const cats = await res.json();
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c.toUpperCase();
      fCat.appendChild(opt);
    });
  } catch {}

  // Atualiza cabeçalho da tabela
  const colCount = cfg.headers.length + (CAN_WRITE ? 1 : 0);
  document.getElementById('table-head').innerHTML =
    '<tr>' + cfg.headers.map(h => `<th>${h}</th>`).join('') + (CAN_WRITE ? '<th>AÇÕES</th>' : '') + '</tr>';

  // Limpa busca e filtros
  document.getElementById('busca').value = '';
  fStatus.value = '';
  fCat.value    = '';

  // Carrega dados
  await loadData();

  // Configura filtros
  setupFilters();
};

/* ── CARREGAR DADOS ────────────────────────────────────── */

async function loadData() {
  const cfg    = TABS[currentTab];
  const busca  = document.getElementById('busca').value;
  const status = document.getElementById('filtro-status').value;
  const cat    = document.getElementById('filtro-cat').value;
  const params = new URLSearchParams();
  if (busca)  params.set('busca',     busca);
  if (status) params.set('status',    status);
  if (cat)    params.set('categoria', cat);

  const tbody = document.getElementById('main-tbody');
  const cols  = cfg.headers.length + (CAN_WRITE ? 1 : 0);
  tbody.innerHTML = `<tr class="loading-row"><td colspan="${cols}"><span class="loading-text">▸ CARREGANDO...</span></td></tr>`;

  try {
    const res  = await fetch(`${cfg.api}?${params}`);
    const data = await res.json();
    renderTable(data);
    updateStats(data);
  } catch {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${cols}">⚠ ERRO AO CARREGAR DADOS</td></tr>`;
  }
}

function renderTable(itens) {
  const cfg   = TABS[currentTab];
  const tbody = document.getElementById('main-tbody');
  const cols  = cfg.headers.length + (CAN_WRITE ? 1 : 0);
  document.getElementById('strip-total').textContent = itens.length;
  document.getElementById('tab-total').textContent   = itens.length;

  if (!itens.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${cols}">NENHUM REGISTRO ENCONTRADO</td></tr>`;
    return;
  }
  tbody.innerHTML = itens.map(item =>
    `<tr data-id="${item.id}">${cfg.renderRow(item, CAN_WRITE)}</tr>`
  ).join('');
}

function updateStats(itens) {
  document.getElementById('tab-status-stats').innerHTML = TABS[currentTab].statsText(itens);
}

/* ── FILTROS ───────────────────────────────────────────── */

function setupFilters() {
  let debounce;
  const busca = document.getElementById('busca');
  const clone1 = busca.cloneNode(true);
  busca.parentNode.replaceChild(clone1, busca);
  clone1.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(loadData, 300); });

  ['filtro-status','filtro-cat'].forEach(id => {
    const el = document.getElementById(id);
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    clone.addEventListener('change', loadData);
  });
}

/* ── MODAL ─────────────────────────────────────────────── */

window.openModal = function(item = null) {
  const cfg = TABS[currentTab];
  document.getElementById('modal-title').textContent = item ? `EDITAR · ${item.nome}` : cfg.addLabel.replace('+ ','');
  document.getElementById('modal-body').innerHTML    = cfg.modalFields(item);
  document.getElementById('modal-overlay').classList.add('show');
};

window.openEdit = async function(id) {
  try {
    const res  = await fetch(`${TABS[currentTab].api}/${id}`);
    const item = await res.json();
    openModal(item);
  } catch { alert('ERRO AO CARREGAR REGISTRO'); }
};

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.remove('show');
};

/* ── SALVAR ────────────────────────────────────────────── */

window.saveItem = async function() {
  const cfg     = TABS[currentTab];
  const editId  = v('edit-id');
  const payload = cfg.getPayload(editId);
  const err     = cfg.validate(payload);
  if (err) { showAlert('modal-alert', 'error', err); return; }

  const btn = document.getElementById('btn-save');
  btn.textContent = '▸ SALVANDO...'; btn.disabled = true;

  try {
    const url    = editId ? `${cfg.api}/${editId}` : cfg.api;
    const method = editId ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-User-Role': SESSION.role },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showAlert('modal-alert', 'error', `⚠ ${data.error || 'ERRO AO SALVAR'}`); return; }
    showAlert('modal-alert', 'success', `✓ ${payload.nome} ${editId ? 'ATUALIZADO' : 'CADASTRADO'} COM SUCESSO`);
    setTimeout(() => { closeModal(); loadData(); }, 1200);
  } catch { showAlert('modal-alert', 'error', '⚠ FALHA NA COMUNICAÇÃO'); }
  finally { btn.textContent = '▸ SALVAR'; btn.disabled = false; }
};

/* ── REMOÇÃO ───────────────────────────────────────────── */

let deleteTargetId = null;

window.openConfirmDelete = function(id, nome) {
  deleteTargetId = id;
  document.getElementById('confirm-item-name').textContent = nome;
  document.getElementById('confirm-overlay').classList.add('show');
};

window.closeConfirm = function() {
  deleteTargetId = null;
  document.getElementById('confirm-overlay').classList.remove('show');
};

window.confirmDelete = async function() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('btn-confirm-delete');
  btn.textContent = '▸ REMOVENDO...'; btn.disabled = true;
  try {
    const res = await fetch(`${TABS[currentTab].api}/${deleteTargetId}`, {
      method: 'DELETE', headers: { 'X-User-Role': SESSION.role },
    });
    if (!res.ok) { const d = await res.json(); alert(`ERRO: ${d.error}`); return; }
    closeConfirm(); loadData();
  } catch { alert('FALHA NA COMUNICAÇÃO'); }
  finally { btn.textContent = '▸ CONFIRMAR'; btn.disabled = false; }
};

/* ── ALERTAS / ESC ─────────────────────────────────────── */

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg; el.className = `alert ${type}`; el.style.display = 'block';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});
