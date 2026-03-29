/* ── CREDENCIAIS VÁLIDAS ───────────────────────────────── */

const USERS = {
  // MASTER
  'bruce@wayne.com':      'darknight',
  // GERENTE
  'gerente@wayne.com':    '9012',
  // SEGURANÇA
  'gordon@wayne.com':     '5678',
  'sec1@wayne.com':       '5678',
  'bullock@wayne.com':    '5678',
  'montoya@wayne.com':    '5678',
  // EMPLOYEE (somente leitura)
  'alfred@wayne.com':     '1234',
  'lucius@wayne.com':     '1234',
  'dick@wayne.com':       '1234',
  'tim@wayne.com':        '1234',
  'barbara@wayne.com':    '1234',
  'damian@wayne.com':     '1234',
  'harold@wayne.com':     '1234',
  'leslie@wayne.com':     '1234',
};


/* ── FUNÇÃO PRINCIPAL DE LOGIN ─────────────────────────── */

function doLogin() {
  const username  = document.getElementById('username').value.trim();
  const password  = document.getElementById('password').value;
  const alertBox  = document.getElementById('alert-box');
  const loginBtn  = document.getElementById('loginBtn');
  const footerStatus = document.getElementById('footer-status');

  // Limpa alertas anteriores
  alertBox.style.display = 'none';
  alertBox.className = 'alert';

  // Validação básica
  if (!username || !password) {
    showAlert('error', '⚠ CAMPOS OBRIGATÓRIOS NÃO PREENCHIDOS');
    return;
  }

  // Simula carregamento
  loginBtn.classList.add('loading');
  loginBtn.textContent = 'VERIFICANDO';
  footerStatus.textContent = 'AUTENTICANDO...';

  setTimeout(() => {
    loginBtn.classList.remove('loading');

    if (USERS[username] && USERS[username] === password) {
      // Sucesso
      loginBtn.textContent = '✔ ACESSO CONCEDIDO';
      footerStatus.textContent = 'AUTENTICAÇÃO BEM-SUCEDIDA';
      showAlert('success', '✔ IDENTIDADE CONFIRMADA — REDIRECIONANDO...');
      triggerRedirect(username);
    } else {
      // Falha
      loginBtn.textContent = '▸ AUTENTICAR ACESSO';
      footerStatus.textContent = 'ACESSO NEGADO';
      showAlert('error', '✘ CREDENCIAIS INVÁLIDAS — ACESSO NEGADO');
    }
  }, 1500);
}


/* ── EXIBE ALERTA ──────────────────────────────────────── */

function showAlert(type, message) {
  const alertBox = document.getElementById('alert-box');
  alertBox.className = `alert ${type}`;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
}



/* ── MAPA DE REDIRECIONAMENTO POR PERFIL ───────────────── */
const ROLE_MAP = {
  // MASTER
  'bruce@wayne.com':    { role: 'master',   page: '/batcave-menu.html' },
  // GERENTE
  'gerente@wayne.com':  { role: 'manager',  page: '/batcave-menu.html' },
  // SEGURANÇA
  'gordon@wayne.com':   { role: 'security', page: '/batcave-menu.html' },
  'sec1@wayne.com':     { role: 'security', page: '/batcave-menu.html' },
  'bullock@wayne.com':  { role: 'security', page: '/batcave-menu.html' },
  'montoya@wayne.com':  { role: 'security', page: '/batcave-menu.html' },
  // EMPLOYEE (somente leitura)
  'alfred@wayne.com':   { role: 'employee', page: '/batcave-menu.html' },
  'lucius@wayne.com':   { role: 'employee', page: '/batcave-menu.html' },
  'dick@wayne.com':     { role: 'employee', page: '/batcave-menu.html' },
  'tim@wayne.com':      { role: 'employee', page: '/batcave-menu.html' },
  'barbara@wayne.com':  { role: 'employee', page: '/batcave-menu.html' },
  'damian@wayne.com':   { role: 'employee', page: '/batcave-menu.html' },
  'harold@wayne.com':   { role: 'employee', page: '/batcave-menu.html' },
  'leslie@wayne.com':   { role: 'employee', page: '/batcave-menu.html' },
};

/* ── OVERLAY DE REDIRECIONAMENTO ───────────────────────── */
function triggerRedirect(username) {
  const overlay  = document.getElementById('redirect-overlay');
  const fill     = document.getElementById('access-fill');
  const nameEl   = document.getElementById('redirect-name');
  const subEl    = document.getElementById('redirect-sub');

  const profile     = ROLE_MAP[username] || { role: 'employee', page: '/batcave-dashboard.html' };
  const displayName = username.split('@')[0].toUpperCase();

  nameEl.textContent = `BEM-VINDO, ${displayName}`;
  subEl.textContent  = `CARREGANDO PAINEL · NÍVEL ${profile.role.toUpperCase()}...`;

  // Usa a logo cyan do painel de login no overlay
  const logoSrc    = document.querySelector('.bat-logo img').src;
  const overlayImg = document.querySelector('.redirect-overlay img');
  overlayImg.src   = logoSrc;
  overlayImg.style.cssText = `
    width: 220px; height: auto;
    filter: drop-shadow(0 0 16px #00d4ff) drop-shadow(0 0 40px rgba(0,212,255,0.7));
    animation: logoPulse 3s ease-in-out infinite;
    margin-bottom: 10px;
  `;

  overlay.classList.add('show');
  setTimeout(() => { fill.style.width = '100%'; }, 100);

  // Redireciona com role como query param
  setTimeout(() => {
    window.location.href = `${profile.page}?role=${profile.role}&user=${encodeURIComponent(username)}`;
  }, 3000);
}


/* ── EVENTOS ───────────────────────────────────────────── */

// Submeter com Enter
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// Anima barras laterais ao carregar
setTimeout(() => {
  document.querySelectorAll('.mini-bar-fill').forEach(el => {
    const targetWidth = el.style.width;
    el.style.width = '0%';
    setTimeout(() => { el.style.width = targetWidth; }, 100);
  });
}, 500);

// Relógio em tempo real
function updateClock() {
  const clock = document.getElementById('clock');
  if (clock) {
    clock.textContent = new Date().toLocaleTimeString('pt-BR');
  }
}
setInterval(updateClock, 1000);
updateClock();


/* ── LOG DE DEMONSTRAÇÃO (remover em produção) ─────────── */

console.log('%cWAYNE INDUSTRIES — DEMO', 'color:#00d4ff;font-size:16px;font-weight:bold');
console.log(
  '%cCredenciais disponíveis:\n' +
  '• bruce@wayne.com            → darknight  (MASTER)\n' +
  '• gerente@wayne.com          → 9012       (GERENTE)\n' +
  '• gordon@wayne.com           → 5678       (SEGURANÇA)\n' +
  '• sec1@wayne.com             → 5678       (SEGURANÇA)\n' +
  '• bullock@wayne.com          → 5678       (SEGURANÇA)\n' +
  '• montoya@wayne.com          → 5678       (SEGURANÇA)\n' +
  '• alfred@wayne.com           → 1234       (EMPLOYEE)\n' +
  '• lucius@wayne.com           → 1234       (EMPLOYEE)\n' +
  '• dick@wayne.com             → 1234       (EMPLOYEE)\n' +
  '• tim@wayne.com              → 1234       (EMPLOYEE)\n' +
  '• barbara@wayne.com          → 1234       (EMPLOYEE)\n' +
  '• damian@wayne.com           → 1234       (EMPLOYEE)\n' +
  '• harold@wayne.com           → 1234       (EMPLOYEE)\n' +
  '• leslie@wayne.com           → 1234       (EMPLOYEE)',
  'color:#00d4ff'
);

