/* ============================================================
   WAYNE INDUSTRIES — PROTOCOLO SOMBRA
   Arquivo: protocolo-sombra.js
   ============================================================ */

const params = new URLSearchParams(window.location.search);
const role   = params.get('role') || '';
const user   = params.get('user') || '';

// Só master tem acesso
if (role !== 'master') {
  document.body.innerHTML = `<div style="position:fixed;inset:0;background:#000;display:flex;
    flex-direction:column;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif">
    <div style="font-size:10px;letter-spacing:6px;color:#ff2244;margin-bottom:16px">ACESSO NEGADO</div>
    <div style="font-size:8px;letter-spacing:3px;color:rgba(255,34,68,.5)">CLEARANCE INSUFICIENTE</div>
  </div>`;
}

// Session info
document.getElementById('sess-user').textContent =
  user.split('@')[0].replace(/\./g,' ').toUpperCase() || 'BRUCE WAYNE';

// Clock
function tick() {
  const t = new Date().toLocaleTimeString('pt-BR',{hour12:false});
  const clockEl = document.getElementById('tr-top');
  if (clockEl) clockEl.textContent = t;
}
tick(); 
setInterval(tick, 1000);

// Dates
const now = new Date();
const fmt  = now.toLocaleDateString('pt-BR') + ' · ' + now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
document.getElementById('doc-date').textContent   = 'DATA DE ACESSO: ' + fmt;
document.getElementById('footer-date').textContent = fmt;

// Back
window.goBack = function() {
  window.location.href = `batcave-menu.html?role=${role}&user=${encodeURIComponent(user)}`;
};

// Sidebar scroll — nome diferente para não sobrescrever window.scrollTo nativo
window.scrollToSection = function(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior:'smooth' });
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
};

// Active sidebar on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      const link = document.querySelector(`.sb-link[data-target="${id}"]`);;
      if (link) {
        document.querySelectorAll('.sb-link').forEach(l=>l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}, { 
  threshold: 0.2,
  rootMargin: "-100px 0px -50% 0px"
});

document.querySelectorAll('.section[id]').forEach(s => observer.observe(s));

// Psyche bars animate on scroll
const psycheObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.psyche-bar-fill').forEach(bar => {
        const val = bar.dataset.val;
        setTimeout(() => { bar.style.width = val + '%'; }, 200);
      });
      psycheObs.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('#s-fragilidades').forEach(s => psycheObs.observe(s));

// Redacted reveal on click
document.querySelectorAll('.sb-link').forEach(link => {
  link.addEventListener('click', () => {
    const id = link.dataset.target;
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Background canvas - animated particles
const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    const particles = Array.from({length:80}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.8 + 0.2,
      vx:(Math.random()-.5)*.2,
      vy:(Math.random()-.5)*.2,
      a: Math.random(),
    }));

    function drawBg() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(0,212,255,${p.a * 0.25})`;
        ctx.fill();
      });
      requestAnimationFrame(drawBg);
    }
    drawBg();
  }