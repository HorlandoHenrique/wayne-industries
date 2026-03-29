/* ── HOLOGRAMAS NO CANVAS ──────────────────────────────── */

const canvas = document.getElementById('hologram-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* Partículas flutuantes globais */
const globalParticles = Array.from({length: 80}, () => ({
  x:     Math.random() * window.innerWidth,
  y:     Math.random() * window.innerHeight,
  vx:    (Math.random() - 0.5) * 0.3,
  vy:    -(Math.random() * 0.5 + 0.1),
  size:  Math.random() * 1.5 + 0.5,
  alpha: Math.random() * 0.4 + 0.1,
  life:  Math.random() * 200,
}));

/* Linhas de dados (simulando fluxo de info) */
const dataLines = Array.from({length: 12}, () => ({
  x:     Math.random() * window.innerWidth,
  y:     Math.random() * window.innerHeight,
  len:   Math.random() * 80 + 20,
  speed: Math.random() * 1 + 0.5,
  alpha: Math.random() * 0.15 + 0.03,
}));

function animateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Partículas */
  globalParticles.forEach(p => {
    p.x  += p.vx;
    p.y  += p.vy;
    p.life++;

    if (p.y < -10 || p.life > 300) {
      p.x     = Math.random() * canvas.width;
      p.y     = canvas.height + 10;
      p.life  = 0;
      p.alpha = Math.random() * 0.3 + 0.05;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
    ctx.fill();
  });

  /* Linhas de dados verticais */
  dataLines.forEach(l => {
    l.y += l.speed;
    if (l.y > canvas.height + l.len) {
      l.y = -l.len;
      l.x = Math.random() * canvas.width;
    }
    const grad = ctx.createLinearGradient(l.x, l.y - l.len, l.x, l.y);
    grad.addColorStop(0, `rgba(0,212,255,0)`);
    grad.addColorStop(1, `rgba(0,212,255,${l.alpha})`);
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - l.len);
    ctx.lineTo(l.x, l.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  });

  /* Raios de varredura radial (hologramas de cantos) */
  const t = Date.now() / 1000;
  [[80, 80], [canvas.width - 80, 80], [80, canvas.height - 80], [canvas.width - 80, canvas.height - 80]]
    .forEach(([cx, cy], i) => {
      const angle = t * 0.8 + (i * Math.PI / 2);
      for (let r = 0; r < 3; r++) {
        const a = angle + r * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50);
        ctx.strokeStyle = `rgba(0,212,255,${0.06 - r * 0.015})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
      }
      /* Círculo radar */
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,0.05)';
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,0.04)';
      ctx.lineWidth   = 0.5;
      ctx.stroke();
    });

  requestAnimationFrame(animateCanvas);
}
animateCanvas();

/* ── PARTÍCULAS NOS CARDS ──────────────────────────────── */

['p-arsenal','p-veiculos','p-trajes','p-batcaverna','p-gotham'].forEach(id => {
  const container = document.getElementById(id);
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'card-particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      --dx: ${(Math.random() - 0.5) * 30}px;
      --dur: ${2.5 + Math.random() * 3}s;
      --delay: ${Math.random() * 4}s;
    `;
    container.appendChild(p);
  }
});

/* ── RELÓGIO E UPTIME ──────────────────────────────────── */

function updateClock() {
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('pt-BR', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

const startTime = Date.now();
function updateUptime() {
  const d = Math.floor((Date.now() - startTime) / 1000);
  const h = String(Math.floor(d / 3600)).padStart(2,'0');
  const m = String(Math.floor((d % 3600) / 60)).padStart(2,'0');
  const s = String(d % 60).padStart(2,'0');
  document.getElementById('uptime').textContent = `${h}:${m}:${s}`;
}
setInterval(updateUptime, 1000);

/* ── IDENTIFICAÇÃO DO USUÁRIO PELA URL ─────────────────── */

(function identifyUser() {
  const params   = new URLSearchParams(window.location.search);
  const role     = params.get('role') || 'master';
  const userRaw  = params.get('user') || 'bruce@wayne.com';
  const name     = userRaw.split('@')[0].replace(/\./g,' ').toUpperCase();
  const clearMap = {
    master: 'CLEARANCE: MASTER · ACESSO TOTAL LIBERADO',
    manager: 'CLEARANCE: LVL-3 · ACESSO GERENCIAL',
    security: 'CLEARANCE: LVL-2 · ACESSO DE SEGURANÇA',
    employee: 'CLEARANCE: LVL-1 · ACESSO BÁSICO',
  };
  document.getElementById('header-user').textContent     = name;
  document.getElementById('header-clearance').textContent = clearMap[role] || clearMap.master;
})();

/* ── BARRAS DE PROGRESSO ───────────────────────────────── */

setTimeout(() => {
  document.querySelectorAll('.card-access-fill').forEach(el => {
    const w = el.style.width;
    el.style.width = '0%';
    setTimeout(() => { el.style.width = w; }, 150);
  });
  document.querySelectorAll('.mini-bar-fill').forEach(el => {
    const w = el.style.width;
    el.style.width = '0%';
    setTimeout(() => { el.style.width = w; }, 150);
  });
}, 600);


/* ── LOGOUT ────────────────────────────────────────────── */

function doLogout() {
  const overlay = document.getElementById('logout-overlay');
  overlay.classList.add('show');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 2200);
}

/* ── ABRIR MÓDULO ──────────────────────────────────────── */

function openModule(name, id) {
  const overlay = document.getElementById('access-overlay');
  const bar     = document.getElementById('ao-bar');
  const pct     = document.getElementById('ao-pct');
  const modName = document.getElementById('ao-module-name');
  const modSub  = document.getElementById('ao-module-sub');

  modName.textContent = name;
  modSub.textContent  = 'CARREGANDO MÓDULO · AGUARDE...';

  overlay.classList.add('show');
  bar.style.width = '0%';
  pct.textContent = '0%';

  setTimeout(() => { bar.style.width = '100%'; }, 100);

  /* Anima percentual */
  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(p + Math.random() * 4 + 1, 100);
    pct.textContent = Math.floor(p) + '%';
    if (p >= 100) {
      clearInterval(iv);
      modSub.textContent = '✓ MÓDULO CARREGADO · REDIRECIONANDO...';
    }
  }, 60);

  /* Redireciona para a página do módulo com role e user */
  setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    const role   = params.get('role') || 'employee';
    const user   = params.get('user') || '';
    window.location.href = id + '.html?role=' + role + '&user=' + encodeURIComponent(user);
  }, 3200);
}

/* ── HOVER: efeito de coordenadas no cursor ────────────── */

document.querySelectorAll('.module-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const x  = ((e.clientX - r.left) / r.width  - 0.5) * 12;
    const y  = ((e.clientY - r.top)  / r.height - 0.5) * 12;
    card.style.transform = `translateY(-8px) scale(1.02) rotateX(${-y}deg) rotateY(${x}deg)`;
    card.style.perspective = '800px';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});