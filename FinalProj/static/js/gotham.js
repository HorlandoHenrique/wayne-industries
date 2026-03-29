/* ============================================================
   WAYNE INDUSTRIES — GOTHAM CITY
   Arquivo: gotham.js
   ============================================================ */

const WRITE_ROLES = ['master', 'manager', 'security'];

function getSession() {
  const p = new URLSearchParams(window.location.search);
  return { role: p.get('role') || 'employee', user: p.get('user') || 'guest@wayne.com' };
}
const SESSION   = getSession();
const CAN_WRITE = WRITE_ROLES.includes(SESSION.role);

let currentTab = 'distritos';

/* ══════════════════════════════════════════════════════════
   CONFIGURAÇÃO DAS ABAS
   ══════════════════════════════════════════════════════════ */

const TABS = {

  // ── DISTRITOS ──────────────────────────────────────────
  distritos: {
    api: '/api/gotham/distritos',
    apiCats: '/api/gotham/distritos/categorias',
    addLabel: '+ NOVO DISTRITO',
    statusOptions: [
      {v:'seguro',     l:'SEGURO'},
      {v:'monitorado', l:'MONITORADO'},
      {v:'alerta',     l:'ALERTA'},
      {v:'critico',    l:'CRÍTICO'},
      {v:'controlado', l:'CONTROLADO'},
      {v:'perdido',    l:'PERDIDO'},
    ],
    headers: ['CÓDIGO','NOME','CATEGORIA','STATUS','POPULAÇÃO','CONTROLE ATUAL','NÍVEL CRIME','OBSERVAÇÕES'],
    renderRow(item, cw) {
      const nc = parseInt(item.nivel_crime) || 0;
      return `
        <td class="td-codigo">${item.codigo}</td>
        <td class="td-nome">${item.nome}</td>
        <td>${catBadge(item.categoria)}</td>
        <td>${statusBadge(item.status)}</td>
        <td class="td-pop">${item.populacao || '—'}</td>
        <td class="td-local">${item.controle_atual || '—'}</td>
        <td class="td-nivel nivel-${nc}">${nc > 0 ? nc : '—'}</td>
        <td class="td-nota">${item.observacoes || '—'}</td>
        ${cw ? `<td class="td-acoes">
          <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
          <button class="btn-del"  onclick="openConfirmDelete(${item.id},'${esc(item.nome)}')">REMOVER</button>
        </td>` : ''}`;
    },
    modalFields(item) {
      return `<input type="hidden" id="edit-id" value="${item?.id||''}">
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ CÓDIGO</label>
            <input type="text" id="f-codigo" class="field-input" placeholder="GTH-XXX" value="${item?.codigo||''}" ${item?'readonly style="opacity:.5"':''}></div>
          <div class="form-field"><label class="field-label">▸ CATEGORIA</label>
            <select id="f-categoria" class="field-input">
              ${['Ilha Principal','Ilha Norte','Ilha Sul','Continente','Prisão','Parque','Comercial','Residencial','Portuário','Industrial'].map(c=>
                `<option value="${c}" ${item?.categoria===c?'selected':''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ NOME DO DISTRITO</label>
            <input type="text" id="f-nome" class="field-input" placeholder="EX: THE BOWERY" value="${item?.nome||''}"></div>
          <div class="form-field"><label class="field-label">▸ STATUS</label>
            <select id="f-status" class="field-input">
              ${[['seguro','SEGURO'],['monitorado','MONITORADO'],['alerta','ALERTA'],['critico','CRÍTICO'],['controlado','CONTROLADO'],['perdido','PERDIDO']].map(([v,l])=>
                `<option value="${v}" ${item?.status===v?'selected':''}>${l}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ POPULAÇÃO ESTIMADA</label>
            <input type="text" id="f-populacao" class="field-input" placeholder="EX: 85.000" value="${item?.populacao||''}"></div>
          <div class="form-field"><label class="field-label">▸ NÍVEL DE CRIME (1–10)</label>
            <input type="number" id="f-nivel_crime" class="field-input" min="1" max="10" value="${item?.nivel_crime||''}"></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ CONTROLE ATUAL</label>
          <input type="text" id="f-controle_atual" class="field-input" placeholder="EX: Coringa / GCPD / Batman" value="${item?.controle_atual||''}"></div>
        <div class="form-field full"><label class="field-label">▸ OBSERVAÇÕES</label>
          <textarea id="f-observacoes" class="field-input" rows="2">${item?.observacoes||''}</textarea></div>
        <div class="alert" id="modal-alert"></div>`;
    },
    getPayload() {
      return { codigo:v('f-codigo').toUpperCase(), nome:v('f-nome'), categoria:v('f-categoria'),
        status:v('f-status'), populacao:v('f-populacao'), nivel_crime:v('f-nivel_crime'),
        controle_atual:v('f-controle_atual'), observacoes:v('f-observacoes') };
    },
    validate(p) { return p.codigo&&p.nome ? null : '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS'; },
    statsText(itens) {
      const crit = itens.filter(i=>i.status==='critico').length;
      const seg  = itens.filter(i=>i.status==='seguro').length;
      return `SEGURO <span class="stat-val" style="color:var(--green)">${seg}</span>
              <span class="stat-sep">·</span>
              CRÍTICO <span class="stat-val" style="color:var(--red)">${crit}</span>`;
    },
  },

  // ── OCORRÊNCIAS ────────────────────────────────────────
  ocorrencias: {
    api: '/api/gotham/ocorrencias',
    apiCats: '/api/gotham/ocorrencias/categorias',
    addLabel: '+ NOVA OCORRÊNCIA',
    statusOptions: [
      {v:'ativa',       l:'ATIVA'},
      {v:'investigando',l:'INVESTIGANDO'},
      {v:'resolvida',   l:'RESOLVIDA'},
      {v:'pendente',    l:'PENDENTE'},
      {v:'arquivada',   l:'ARQUIVADA'},
    ],
    headers: ['CÓDIGO','TIPO','STATUS','SETOR','SUSPEITO','VÍTIMAS','PRIORIDADE','DATA / HORA','DESCRIÇÃO'],
    renderRow(item, cw) {
      const pc = item.prioridade;
      const pColor = pc==='MÁXIMA'?'var(--red)': pc==='ALTA'?'var(--yellow)':'var(--cyan)';
      return `
        <td class="td-codigo">${item.codigo}</td>
        <td>${catBadge(item.categoria)}</td>
        <td>${statusBadge(item.status)}</td>
        <td class="td-local">${item.setor||'—'}</td>
        <td style="color:var(--cyan);font-size:10px">${item.suspeito||'—'}</td>
        <td style="font-family:'Orbitron',sans-serif;font-size:12px;text-align:center;color:${parseInt(item.vitimas)>0?'var(--red)':'var(--text-dim)'}">${item.vitimas||'0'}</td>
        <td style="font-family:'Orbitron',sans-serif;font-size:9px;color:${pColor}">${item.prioridade||'—'}</td>
        <td class="td-date">${item.data_hora||'—'}</td>
        <td class="td-nota">${item.descricao||'—'}</td>
        ${cw ? `<td class="td-acoes">
          <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
          <button class="btn-del"  onclick="openConfirmDelete(${item.id},'${esc(item.codigo)}')">REMOVER</button>
        </td>` : ''}`;
    },
    modalFields(item) {
      return `<input type="hidden" id="edit-id" value="${item?.id||''}">
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ CÓDIGO</label>
            <input type="text" id="f-codigo" class="field-input" placeholder="OC-XXXX" value="${item?.codigo||''}" ${item?'readonly style="opacity:.5"':''}></div>
          <div class="form-field"><label class="field-label">▸ TIPO / CATEGORIA</label>
            <select id="f-categoria" class="field-input">
              ${['Homicídio','Terrorismo','Roubo','Sequestro','Químico','Biológico','Vandalismo','Corrupção','Confronto','Fuga'].map(c=>
                `<option value="${c}" ${item?.categoria===c?'selected':''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ STATUS</label>
            <select id="f-status" class="field-input">
              ${[['ativa','ATIVA'],['investigando','INVESTIGANDO'],['resolvida','RESOLVIDA'],['pendente','PENDENTE'],['arquivada','ARQUIVADA']].map(([v,l])=>
                `<option value="${v}" ${item?.status===v?'selected':''}>${l}</option>`).join('')}
            </select></div>
          <div class="form-field"><label class="field-label">▸ PRIORIDADE</label>
            <select id="f-prioridade" class="field-input">
              ${['MÁXIMA','ALTA','MÉDIA','BAIXA'].map(p=>
                `<option value="${p}" ${item?.prioridade===p?'selected':''}>${p}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ SETOR / LOCAL</label>
            <input type="text" id="f-setor" class="field-input" placeholder="EX: The Bowery · Rua Crime" value="${item?.setor||''}"></div>
          <div class="form-field"><label class="field-label">▸ SUSPEITO</label>
            <input type="text" id="f-suspeito" class="field-input" placeholder="EX: Coringa" value="${item?.suspeito||''}"></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ VÍTIMAS</label>
            <input type="number" id="f-vitimas" class="field-input" min="0" value="${item?.vitimas||'0'}"></div>
          <div class="form-field"><label class="field-label">▸ DATA / HORA</label>
            <input type="text" id="f-data_hora" class="field-input" placeholder="EX: 25/12 · 23:58" value="${item?.data_hora||''}"></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ DESCRIÇÃO</label>
          <textarea id="f-descricao" class="field-input" rows="3">${item?.descricao||''}</textarea></div>
        <div class="alert" id="modal-alert"></div>`;
    },
    getPayload() {
      return { codigo:v('f-codigo').toUpperCase(), categoria:v('f-categoria'), status:v('f-status'),
        prioridade:v('f-prioridade'), setor:v('f-setor'), suspeito:v('f-suspeito'),
        vitimas:v('f-vitimas'), data_hora:v('f-data_hora'), descricao:v('f-descricao') };
    },
    validate(p) { return p.codigo&&p.categoria ? null : '⚠ CÓDIGO E TIPO SÃO OBRIGATÓRIOS'; },
    statsText(itens) {
      const ativas = itens.filter(i=>i.status==='ativa').length;
      const total_vit = itens.reduce((a,i)=>a+(parseInt(i.vitimas)||0),0);
      return `ATIVAS <span class="stat-val" style="color:var(--red)">${ativas}</span>
              <span class="stat-sep">·</span>
              VÍTIMAS <span class="stat-val" style="color:var(--yellow)">${total_vit}</span>`;
    },
  },

  // ── SUSPEITOS ──────────────────────────────────────────
  suspeitos: {
    api: '/api/gotham/suspeitos',
    apiCats: '/api/gotham/suspeitos/categorias',
    addLabel: '+ NOVO SUSPEITO',
    statusOptions: [
      {v:'solto',       l:'SOLTO'},
      {v:'foragido',    l:'FORAGIDO'},
      {v:'preso',       l:'PRESO'},
      {v:'internado',   l:'INTERNADO'},
      {v:'desaparecido',l:'DESAPARECIDO'},
      {v:'morto',       l:'MORTO'},
    ],
    headers: ['CÓDIGO','NOME / CODINOME','TIPO','STATUS','TERRITÓRIO','NÍVEL AMEAÇA','ÚLTIMA LOCALIZAÇÃO','OBSERVAÇÕES'],
    renderRow(item, cw) {
      const nc = parseInt(item.nivel_ameaca)||0;
      return `
        <td class="td-codigo">${item.codigo}</td>
        <td class="td-nome">${item.nome}</td>
        <td>${catBadge(item.categoria)}</td>
        <td>${statusBadge(item.status)}</td>
        <td class="td-local">${item.territorio||'—'}</td>
        <td class="td-nivel nivel-${nc}">${nc>0?nc:'—'}</td>
        <td class="td-orig">${item.ultima_localizacao||'—'}</td>
        <td class="td-nota">${item.observacoes||'—'}</td>
        ${cw ? `<td class="td-acoes">
          <button class="btn-edit" onclick="openEdit(${item.id})">EDITAR</button>
          <button class="btn-del"  onclick="openConfirmDelete(${item.id},'${esc(item.nome)}')">REMOVER</button>
        </td>` : ''}`;
    },
    modalFields(item) {
      return `<input type="hidden" id="edit-id" value="${item?.id||''}">
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ CÓDIGO</label>
            <input type="text" id="f-codigo" class="field-input" placeholder="SUS-XXX" value="${item?.codigo||''}" ${item?'readonly style="opacity:.5"':''}></div>
          <div class="form-field"><label class="field-label">▸ TIPO</label>
            <select id="f-categoria" class="field-input">
              ${['Meta-Humano','Crime Organizado','Assassino','Terrorista','Ladrão','Cientista','Hacker'].map(c=>
                `<option value="${c}" ${item?.categoria===c?'selected':''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ NOME / CODINOME</label>
            <input type="text" id="f-nome" class="field-input" placeholder="EX: CORINGA / Jack Napier" value="${item?.nome||''}"></div>
          <div class="form-field"><label class="field-label">▸ STATUS</label>
            <select id="f-status" class="field-input">
              ${[['solto','SOLTO'],['foragido','FORAGIDO'],['preso','PRESO'],['internado','INTERNADO (ARKHAM)'],['desaparecido','DESAPARECIDO'],['morto','MORTO']].map(([v,l])=>
                `<option value="${v}" ${item?.status===v?'selected':''}>${l}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label class="field-label">▸ TERRITÓRIO / BASE</label>
            <input type="text" id="f-territorio" class="field-input" placeholder="EX: Anarky Row / Paris Island" value="${item?.territorio||''}"></div>
          <div class="form-field"><label class="field-label">▸ NÍVEL DE AMEAÇA (1–10)</label>
            <input type="number" id="f-nivel_ameaca" class="field-input" min="1" max="10" value="${item?.nivel_ameaca||''}"></div>
        </div>
        <div class="form-field full"><label class="field-label">▸ ÚLTIMA LOCALIZAÇÃO</label>
          <input type="text" id="f-ultima_localizacao" class="field-input" placeholder="EX: Visto em Arkham · 03:47" value="${item?.ultima_localizacao||''}"></div>
        <div class="form-field full"><label class="field-label">▸ OBSERVAÇÕES / PERFIL</label>
          <textarea id="f-observacoes" class="field-input" rows="3">${item?.observacoes||''}</textarea></div>
        <div class="alert" id="modal-alert"></div>`;
    },
    getPayload() {
      return { codigo:v('f-codigo').toUpperCase(), nome:v('f-nome'), categoria:v('f-categoria'),
        status:v('f-status'), territorio:v('f-territorio'), nivel_ameaca:v('f-nivel_ameaca'),
        ultima_localizacao:v('f-ultima_localizacao'), observacoes:v('f-observacoes') };
    },
    validate(p) { return p.codigo&&p.nome ? null : '⚠ CÓDIGO E NOME SÃO OBRIGATÓRIOS'; },
    statsText(itens) {
      const soltos   = itens.filter(i=>i.status==='solto'||i.status==='foragido').length;
      const nivel10  = itens.filter(i=>parseInt(i.nivel_ameaca)>=9).length;
      return `SOLTOS/FORAGIDOS <span class="stat-val" style="color:var(--red)">${soltos}</span>
              <span class="stat-sep">·</span>
              AMEAÇA 9-10 <span class="stat-val" style="color:var(--red)">${nivel10}</span>`;
    },
  },
};

/* ── HELPERS ───────────────────────────────────────────── */

function v(id) { const el=document.getElementById(id); return el?el.value.trim():''; }
function esc(s) { return (s||'').replace(/'/g,"\\'"); }
function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('pt-BR')+' '+new Date(dt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}

function statusBadge(status) {
  const map = {
    seguro:'SEGURO', monitorado:'MONITORADO', alerta:'ALERTA', critico:'CRÍTICO',
    controlado:'CONTROLADO', perdido:'PERDIDO',
    ativa:'ATIVA', investigando:'INVESTIGANDO', resolvida:'RESOLVIDA', pendente:'PENDENTE', arquivada:'ARQUIVADA',
    solto:'SOLTO', foragido:'FORAGIDO', preso:'PRESO', internado:'INTERNADO', desaparecido:'DESAPARECIDO', morto:'MORTO',
  };
  return `<span class="badge badge-${status}">${map[status]||status.toUpperCase()}</span>`;
}

function catBadge(cat) {
  const cls = {
    'Ilha Principal':'cat-ilha-principal','Ilha Norte':'cat-ilha-norte','Ilha Sul':'cat-ilha-sul',
    'Continente':'cat-continente','Prisão':'cat-prisao','Parque':'cat-parque',
    'Comercial':'cat-comercial','Residencial':'cat-residencial','Portuário':'cat-portuario','Industrial':'cat-industrial',
    'Homicídio':'cat-homicidio','Terrorismo':'cat-terrorismo','Roubo':'cat-roubo','Sequestro':'cat-sequestro',
    'Químico':'cat-quimico','Biológico':'cat-biologico','Vandalismo':'cat-vandalismo',
    'Corrupção':'cat-corrupcao','Confronto':'cat-confronto','Fuga':'cat-fuga',
    'Meta-Humano':'cat-meta-humano','Crime Organizado':'cat-crime-organizado','Assassino':'cat-assassino',
    'Terrorista':'cat-terrorista','Ladrão':'cat-ladrao','Cientista':'cat-cientista','Hacker':'cat-hacker',
  }[cat]||'cat-ilha-principal';
  return `<span class="badge-cat ${cls}">${cat.toUpperCase()}</span>`;
}

/* ── INIT ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupUI(); switchTab('distritos'); startClock();
});

function setupUI() {
  const m = {master:'CLEARANCE: MASTER · ACESSO TOTAL',manager:'CLEARANCE: LVL-3 · ACESSO GERENCIAL',
    security:'CLEARANCE: LVL-2 · ACESSO DE SEGURANÇA',employee:'CLEARANCE: LVL-1 · SOMENTE LEITURA'};
  document.getElementById('header-clearance').textContent = m[SESSION.role]||m.employee;
  document.getElementById('session-user').textContent = SESSION.user.split('@')[0].replace(/\./g,' ').toUpperCase();
  if (CAN_WRITE) document.getElementById('btn-add').style.display = 'block';
}

function startClock() {
  const t = ()=>document.getElementById('clock').textContent=new Date().toLocaleTimeString('pt-BR',{hour12:false});
  t(); setInterval(t,1000);
}

function goBack() {
  window.location.href=`/batcave-menu.html?role=${SESSION.role}&user=${encodeURIComponent(SESSION.user)}`;
}

/* ── TROCAR ABA ────────────────────────────────────────── */

window.switchTab = async function(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  const cfg = TABS[tab];
  document.getElementById('btn-add').textContent = cfg.addLabel;

  // Status filter
  const fS = document.getElementById('filtro-status');
  fS.innerHTML = '<option value="">TODOS OS STATUS</option>' +
    cfg.statusOptions.map(o=>`<option value="${o.v}">${o.l}</option>`).join('');

  // Cat filter
  const fC = document.getElementById('filtro-cat');
  fC.innerHTML = '<option value="">TODAS AS CATEGORIAS</option>';
  try {
    const cats = await (await fetch(cfg.apiCats)).json();
    cats.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c.toUpperCase(); fC.appendChild(o); });
  } catch {}

  // Headers
  const cols = cfg.headers.length+(CAN_WRITE?1:0);
  document.getElementById('table-head').innerHTML =
    '<tr>'+cfg.headers.map(h=>`<th>${h}</th>`).join('')+(CAN_WRITE?'<th>AÇÕES</th>':'')+'</tr>';

  document.getElementById('busca').value=''; fS.value=''; fC.value='';
  await loadData();
  setupFilters();
};

/* ── CARREGAR ──────────────────────────────────────────── */

async function loadData() {
  const cfg=TABS[currentTab];
  const p=new URLSearchParams();
  const b=document.getElementById('busca').value;
  const s=document.getElementById('filtro-status').value;
  const c=document.getElementById('filtro-cat').value;
  if(b) p.set('busca',b); if(s) p.set('status',s); if(c) p.set('categoria',c);

  const tbody=document.getElementById('main-tbody');
  const cols=cfg.headers.length+(CAN_WRITE?1:0);
  tbody.innerHTML=`<tr class="loading-row"><td colspan="${cols}"><span class="loading-text">▸ CARREGANDO...</span></td></tr>`;
  try {
    const data=await (await fetch(`${cfg.api}?${p}`)).json();
    renderTable(data); updateStats(data);
  } catch {
    tbody.innerHTML=`<tr class="empty-row"><td colspan="${cols}">⚠ ERRO AO CARREGAR DADOS</td></tr>`;
  }
}

function renderTable(itens) {
  const cfg=TABS[currentTab];
  const tbody=document.getElementById('main-tbody');
  const cols=cfg.headers.length+(CAN_WRITE?1:0);
  document.getElementById('strip-total').textContent=itens.length;
  document.getElementById('tab-total').textContent=itens.length;
  if (!itens.length) { tbody.innerHTML=`<tr class="empty-row"><td colspan="${cols}">NENHUM REGISTRO ENCONTRADO</td></tr>`; return; }
  tbody.innerHTML=itens.map(item=>`<tr data-id="${item.id}">${cfg.renderRow(item,CAN_WRITE)}</tr>`).join('');
}

function updateStats(itens) {
  document.getElementById('tab-status-stats').innerHTML=TABS[currentTab].statsText(itens);
}

/* ── FILTROS ───────────────────────────────────────────── */

function setupFilters() {
  let deb;
  const b=document.getElementById('busca');
  const nb=b.cloneNode(true); b.parentNode.replaceChild(nb,b);
  nb.addEventListener('input',()=>{clearTimeout(deb);deb=setTimeout(loadData,300);});
  ['filtro-status','filtro-cat'].forEach(id=>{
    const el=document.getElementById(id); const c=el.cloneNode(true);
    el.parentNode.replaceChild(c,el); c.addEventListener('change',loadData);
  });
}

/* ── MODAL ─────────────────────────────────────────────── */

window.openModal=function(item=null){
  const cfg=TABS[currentTab];
  document.getElementById('modal-title').textContent=item?`EDITAR · ${item.nome||item.codigo}`:cfg.addLabel.replace('+ ','');
  document.getElementById('modal-body').innerHTML=cfg.modalFields(item);
  document.getElementById('modal-overlay').classList.add('show');
};

window.openEdit=async function(id){
  try { const item=await (await fetch(`${TABS[currentTab].api}/${id}`)).json(); openModal(item); }
  catch { alert('ERRO AO CARREGAR REGISTRO'); }
};

window.closeModal=function(){ document.getElementById('modal-overlay').classList.remove('show'); };

/* ── SALVAR ────────────────────────────────────────────── */

window.saveItem=async function(){
  const cfg=TABS[currentTab];
  const editId=v('edit-id');
  const payload=cfg.getPayload();
  const err=cfg.validate(payload);
  if(err){showAlert('modal-alert','error',err);return;}

  const btn=document.getElementById('btn-save');
  btn.textContent='▸ SALVANDO...'; btn.disabled=true;
  try {
    const res=await fetch(editId?`${cfg.api}/${editId}`:cfg.api,{
      method:editId?'PUT':'POST',
      headers:{'Content-Type':'application/json','X-User-Role':SESSION.role},
      body:JSON.stringify(payload),
    });
    const data=await res.json();
    if(!res.ok){showAlert('modal-alert','error',`⚠ ${data.error||'ERRO AO SALVAR'}`);return;}
    showAlert('modal-alert','success',`✓ ${payload.nome||payload.codigo} ${editId?'ATUALIZADO':'CADASTRADO'}`);
    setTimeout(()=>{closeModal();loadData();},1200);
  } catch { showAlert('modal-alert','error','⚠ FALHA NA COMUNICAÇÃO'); }
  finally { btn.textContent='▸ SALVAR'; btn.disabled=false; }
};

/* ── REMOÇÃO ───────────────────────────────────────────── */

let deleteTargetId=null;

window.openConfirmDelete=function(id,nome){
  deleteTargetId=id;
  document.getElementById('confirm-item-name').textContent=nome;
  document.getElementById('confirm-overlay').classList.add('show');
};
window.closeConfirm=function(){ deleteTargetId=null; document.getElementById('confirm-overlay').classList.remove('show'); };
window.confirmDelete=async function(){
  if(!deleteTargetId)return;
  const btn=document.getElementById('btn-confirm-delete');
  btn.textContent='▸ REMOVENDO...'; btn.disabled=true;
  try {
    const res=await fetch(`${TABS[currentTab].api}/${deleteTargetId}`,{method:'DELETE',headers:{'X-User-Role':SESSION.role}});
    if(!res.ok){const d=await res.json();alert(`ERRO: ${d.error}`);return;}
    closeConfirm(); loadData();
  } catch { alert('FALHA NA COMUNICAÇÃO'); }
  finally { btn.textContent='▸ CONFIRMAR'; btn.disabled=false; }
};

/* ── ALERTAS / ESC ─────────────────────────────────────── */

function showAlert(id,type,msg){
  const el=document.getElementById(id); if(!el)return;
  el.textContent=msg; el.className=`alert ${type}`; el.style.display='block';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeConfirm();}});
