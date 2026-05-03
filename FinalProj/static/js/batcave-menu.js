/* ============================================================
   WAYNE INDUSTRIES — BAT-COMPUTADOR
   Arquivo: batcave-menu.js
   ============================================================ */

/* ── HOLOGRAMAS NO CANVAS ──────────────────────────────── */
const canvas = document.getElementById('hologram-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  if(!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* Detecta se é mobile para poupar processamento */
const isMobile = window.innerWidth <= 768;

/* Partículas flutuantes globais (Reduzidas no mobile) */
const globalParticles = Array.from({length: isMobile ? 20 : 80}, () => ({
  x:     Math.random() * window.innerWidth,
  y:     Math.random() * window.innerHeight,
  vx:    (Math.random() - 0.5) * 0.3,
  vy:    -(Math.random() * 0.5 + 0.1),
  size:  Math.random() * 1.5 + 0.5,
  alpha: Math.random() * 0.4 + 0.1,
  life:  Math.random() * 200,
}));

/* Linhas de dados (Reduzidas no mobile) */
const dataLines = Array.from({length: isMobile ? 3 : 12}, () => ({
  x:     Math.random() * window.innerWidth,
  y:     Math.random() * window.innerHeight,
  len:   Math.random() * 80 + 20,
  speed: Math.random() * 1 + 0.5,
  alpha: Math.random() * 0.15 + 0.03,
}));

function animateCanvas() {
  if(!ctx) return;
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

  /* Raios de varredura radial (Apenas PC) */
  if (!isMobile) {
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
  }

  requestAnimationFrame(animateCanvas);
}
animateCanvas();

/* ── PARTÍCULAS NOS CARDS ──────────────────────────────── */
['p-arsenal','p-veiculos','p-trajes','p-batcaverna','p-gotham'].forEach(id => {
  const container = document.getElementById(id);
  if (!container) return;
  const particleCount = isMobile ? 5 : 18; 
  for (let i = 0; i < particleCount; i++) {
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
  const clockEl = document.getElementById('clock');
  if(clockEl) {
    clockEl.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  }
}
setInterval(updateClock, 1000);
updateClock();

const startTime = Date.now();
function updateUptime() {
  const uptimeEl = document.getElementById('uptime');
  if(!uptimeEl) return;
  const d = Math.floor((Date.now() - startTime) / 1000);
  const h = String(Math.floor(d / 3600)).padStart(2,'0');
  const m = String(Math.floor((d % 3600) / 60)).padStart(2,'0');
  const s = String(d % 60).padStart(2,'0');
  uptimeEl.textContent = `${h}:${m}:${s}`;
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
  
  const headerUser = document.getElementById('header-user');
  const headerClearance = document.getElementById('header-clearance');
  
  if(headerUser) headerUser.textContent = name;
  if(headerClearance) headerClearance.textContent = clearMap[role] || clearMap.master;
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
window.doLogout = function() {
  const overlay = document.getElementById('logout-overlay');
  if(overlay) overlay.classList.add('show');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 2200);
};

/* ── ABRIR MÓDULO ──────────────────────────────────────── */
window.openModule = function(name, id) {
  const overlay = document.getElementById('access-overlay');
  const bar     = document.getElementById('ao-bar');
  const pct     = document.getElementById('ao-pct');
  const modName = document.getElementById('ao-module-name');
  const modSub  = document.getElementById('ao-module-sub');

  if(modName) modName.textContent = name;
  if(modSub) modSub.textContent  = 'CARREGANDO MÓDULO · AGUARDE...';

  if(overlay) overlay.classList.add('show');
  if(bar) bar.style.width = '0%';
  if(pct) pct.textContent = '0%';

  setTimeout(() => { if(bar) bar.style.width = '100%'; }, 100);

  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(p + Math.random() * 4 + 1, 100);
    if(pct) pct.textContent = Math.floor(p) + '%';
    if (p >= 100) {
      clearInterval(iv);
      if(modSub) modSub.textContent = '✓ MÓDULO CARREGADO · REDIRECIONANDO...';
    }
  }, 60);

  setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    const role   = params.get('role') || 'employee';
    const user   = params.get('user') || '';
    window.location.href = id + '.html?role=' + role + '&user=' + encodeURIComponent(user);
  }, 3200);
};

/* ── ESCONDER PAINÉIS LATERAIS EM MOBILE/TABLET ─────────── */
(function hideSidePanelsOnMobile() {
  function checkAndHide() {
    const left  = document.getElementById('side-left');
    const right = document.getElementById('side-right');
    if (!left || !right) return;
    if (window.innerWidth <= 1024) {
      left.style.display  = 'none';
      right.style.display = 'none';
    } else {
      left.style.display  = '';
      right.style.display = '';
    }
  }
  checkAndHide();
  window.addEventListener('resize', checkAndHide);
})();

/* ── HOVER: EFEITO 3D COORDENADAS NO CURSOR ────────────── */
if (!isMobile) {
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
}

/* ── EASTER EGG · ACESSO PROTOCOLO SOMBRA ─────────────── */
(function() {
  const SECRET = 'iamthenight';
  const params = new URLSearchParams(window.location.search);
  const role   = params.get('role') || '';
  const user   = params.get('user') || '';
  if (role !== 'master') return;

  let buffer = '';
  let active = false;

  document.addEventListener('keydown', function(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1) { buffer = ''; return; }
    buffer += e.key.toLowerCase();
    if (buffer.length > SECRET.length) buffer = buffer.slice(-SECRET.length);
    if (buffer === SECRET) { buffer = ''; triggerSecret(); }
  });

  function triggerSecret() {
    if (active) return;
    active = true;

    document.head.insertAdjacentHTML('beforeend', `<style>
      @keyframes sGlitch {
        0%{background:transparent}
        8%{background:rgba(0,212,255,.08);filter:hue-rotate(0)}
        10%{background:rgba(0,0,0,.95);filter:hue-rotate(180deg) contrast(2)}
        12%{background:transparent;filter:none}
        30%{background:rgba(0,0,0,.98)}
        32%{background:transparent}
        80%{background:rgba(0,0,0,.6)}
        100%{background:#000}
      }
      @keyframes sUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sFill{from{width:0}to{width:100%}}
      #sg{position:fixed;inset:0;z-index:9999;pointer-events:none;animation:sGlitch 2s forwards}
      #sgt{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;text-align:center;pointer-events:none;font-family:'Orbitron',sans-serif}
      .s1{font-size:9px;letter-spacing:8px;color:rgba(0,212,255,.6);margin-bottom:12px;animation:sUp .3s .4s both}
      .s2{font-size:22px;font-weight:900;letter-spacing:6px;color:#00d4ff;text-shadow:0 0 30px #00d4ff,0 0 60px rgba(0,212,255,.4);animation:sUp .4s .6s both}
      .s3{font-size:9px;letter-spacing:4px;color:rgba(0,212,255,.4);margin-top:10px;animation:sUp .3s .9s both}
      .sb{width:220px;height:1px;background:rgba(0,212,255,.15);margin:18px auto 0;animation:sUp .3s 1s both}
      .sf{height:100%;background:#00d4ff;box-shadow:0 0 6px #00d4ff;width:0;animation:sFill 1.2s 1s ease forwards}
    </style>`);

    const g = document.createElement('div'); g.id='sg'; document.body.appendChild(g);
    const t = document.createElement('div'); t.id='sgt';
    t.innerHTML=`<div class="s1">PROTOCOLO CLASSIFICADO &middot; NÍVEL OMEGA</div>
      <div class="s2">I AM THE NIGHT</div>
      <div class="s3">ACESSO CONCEDIDO &middot; BRUCE WAYNE</div>
      <div class="sb"><div class="sf"></div></div>`;
    document.body.appendChild(t);

    setTimeout(() => {
      window.location.href = `protocolo-sombra.html?role=${role}&user=${encodeURIComponent(user)}`;
    }, 2700);
  }

})();

/* ── MENU LATERAL MOBILE / TABLET (GAVETA) ─────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Criar Overlay
  const overlay = document.createElement('div');
  overlay.id = 'drawer-overlay';
  overlay.className = 'drawer-overlay';
  overlay.onclick = toggleMobileDrawer;
  document.body.appendChild(overlay);

  // 2. Criar Botão Puxador
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'mobile-drawer-toggle';
  toggleBtn.className = 'mobile-drawer-toggle';
  toggleBtn.innerHTML = '◀ STATUS';
  toggleBtn.onclick = toggleMobileDrawer;
  document.body.appendChild(toggleBtn);

  // 3. Criar Gaveta (Drawer)
  const drawer = document.createElement('div');
  drawer.id = 'mobile-side-drawer';
  drawer.className = 'mobile-side-drawer';
  drawer.innerHTML = `
    <div class="drawer-header">
      <span>DIAGNÓSTICO DO SISTEMA</span>
      <button class="close-drawer" onclick="toggleMobileDrawer()">✕</button>
    </div>
    <div class="drawer-content" id="drawer-content"></div>
  `;
  document.body.appendChild(drawer);

  const drawerContent = document.getElementById('drawer-content');

  // 4. Clonar Alerta do Sistema (Para o topo)
  const sysNotif = document.querySelector('.sys-notif');
  if (sysNotif) {
    drawerContent.appendChild(sysNotif.cloneNode(true));
  }

  // 5. Clonar Monitores (Laterais Direita e Esquerda)
  const panels = document.querySelectorAll('.side-panel.left .mini-monitor, .side-panel.right .mini-monitor');
  panels.forEach(monitor => {
    drawerContent.appendChild(monitor.cloneNode(true));
  });
});

window.toggleMobileDrawer = function() {
  document.getElementById('mobile-side-drawer').classList.toggle('open');
  document.getElementById('drawer-overlay').classList.toggle('show');
};