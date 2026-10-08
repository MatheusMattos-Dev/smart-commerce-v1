import { animate, inView, press, scroll, stagger } from 'motion';

/* =====================================================================
   IA no Balcão: comportamento da página de vendas.
   Animações com Motion (motion.dev). Este é o arquivo-fonte; o que a
   página carrega é assets/main.js, gerado por `npm run build`.

   Cole aqui o link do checkout (Hotmart, Kiwify, Eduzz etc.).
   Enquanto estiver vazio, os botões de compra rolam até a /oferta.
   ===================================================================== */
const CHECKOUT_URL = '';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Saída rápida que assenta devagar: usada em tudo que entra na tela.
const EASE_OUT = [0.16, 1, 0.3, 1];
// Mola curta para respostas a cliques (abas, ícones, botões).
const SPRING = { type: 'spring', visualDuration: 0.35, bounce: 0.2 };

/* ---------- Checkout ---------- */
if (CHECKOUT_URL) {
  document.querySelectorAll('[data-checkout]').forEach((a) => {
    a.href = CHECKOUT_URL;
    a.rel = 'noopener';
  });
}

/* ---------- Hero: palavra digitada ---------- */
function startTyping() {
  const el = document.querySelector('[data-typed]');
  if (!el) return;
  const line = el.closest('[data-typed-line]');
  const words = JSON.parse(el.dataset.typed);
  let i = 0;

  if (reduceMotion) {
    setInterval(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
    }, 2800);
    return;
  }

  // ciclo: segura a palavra, seleciona (fundo lima), apaga, digita a próxima
  (async function loop() {
    for (;;) {
      await wait(2200);
      line.classList.add('is-selecting');
      el.classList.add('is-selected');
      await wait(520);
      el.classList.remove('is-selected');
      line.classList.remove('is-selecting');
      el.textContent = '';
      line.classList.add('is-typing');
      await wait(220);
      i = (i + 1) % words.length;
      for (const ch of words[i]) {
        el.textContent += ch;
        await wait(55 + Math.random() * 55);
      }
      line.classList.remove('is-typing');
    }
  })();
}

/* ---------- Hero: entrada orquestrada ----------
   O único momento de movimento sem ação do visitante: as peças do hero
   sobem em sequência e só então a palavra começa a ser digitada. */
(async () => {
  const steps = document.querySelectorAll('[data-hero-step]');
  const art = document.querySelector('[data-hero-art]');
  if (!reduceMotion && steps.length) {
    animate('[data-dots]', { opacity: [0, 1] }, { duration: 1.6, ease: 'easeOut' });
    // o trio entra com uma mola, junto com o texto
    if (art) {
      animate(art, { opacity: [0, 1] }, { duration: 0.4, delay: 0.1 });
      animate(art, { scale: [0.86, 1], rotate: [-3, 0] }, { type: 'spring', visualDuration: 0.8, bounce: 0.35, delay: 0.1 });
    }
    await animate(steps, { opacity: [0, 1], y: [28, 0] }, {
      duration: 1,
      ease: EASE_OUT,
      delay: stagger(0.09, { startDelay: 0.15 }),
    });
  }
  startTyping();
})();

/* ---------- Hero: o trio ganha vida ----------
   Cada movimento mora numa camada própria para não brigar com os outros:
   palco (perspectiva) > inclinação (cursor) > flutuação (loop) > imagem (entrada e toque). */
(() => {
  const stage = document.querySelector('[data-hero-stage]');
  if (!stage || reduceMotion) return;
  const tilt = stage.querySelector('[data-hero-tilt]');
  const float = stage.querySelector('[data-hero-float]');
  const art = stage.querySelector('[data-hero-art]');
  const loops = [];

  // flutua devagar, como quem respira
  loops.push(animate(float, { y: [0, -12, 0], rotate: [-0.8, 0.8, -0.8] }, {
    duration: 6.4,
    repeat: Infinity,
    ease: 'easeInOut',
  }));

  // brilhos piscando, cada um no seu ritmo
  stage.querySelectorAll('[data-sparkle]').forEach((el, i) => {
    loops.push(animate(el, { scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90] }, {
      duration: 2.2 + (i % 3) * 0.6,
      delay: 0.9 + i * 0.45,
      repeat: Infinity,
      repeatDelay: 0.5 + (i % 2) * 0.9,
      ease: 'easeInOut',
    }));
  });

  // os loops só rodam com o hero na tela
  loops.forEach((a) => a.pause());
  inView(stage, () => {
    loops.forEach((a) => a.play());
    return () => loops.forEach((a) => a.pause());
  });

  // no desktop, o trio inclina em 3D na direção do cursor
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const hero = document.getElementById('topo');
    const follow = { type: 'spring', visualDuration: 0.6, bounce: 0.25 };
    let raf = 0;
    let px = 0;
    let py = 0;
    hero.addEventListener('pointermove', (e) => {
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = stage.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (r.width * 1.2)));
        const ny = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (r.height * 1.2)));
        animate(tilt, { rotateY: nx * 12, rotateX: -ny * 9 }, follow);
      });
    });
    hero.addEventListener('pointerleave', () => animate(tilt, { rotateX: 0, rotateY: 0 }, follow));
  }

  // clique ou toque: o trio amassa e volta com mola
  art.style.transformOrigin = '50% 85%';
  art.addEventListener('pointerdown', () => {
    animate(art, { scaleX: 1.07, scaleY: 0.92 }, { duration: 0.12, ease: 'easeOut' });
  });
  const release = () => animate(art, { scaleX: 1, scaleY: 1 }, { type: 'spring', visualDuration: 0.5, bounce: 0.6 });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => art.addEventListener(type, release));
})();

/* ---------- Hero: afunda e esmaece ao rolar ---------- */
(() => {
  const hero = document.getElementById('topo');
  const inner = document.querySelector('[data-hero-inner]');
  if (!hero || !inner || reduceMotion) return;
  scroll(animate(inner, { y: [0, 120], opacity: [1, 0.1] }, { ease: 'linear' }), {
    target: hero,
    offset: ['start start', 'end start'],
  });
})();

/* ---------- Hero: grade de pontos com pulsos ----------
   A grade é desenhada uma vez num canvas fora da tela; a cada quadro
   só copiamos a grade e desenhamos os poucos pulsos ativos. */
(() => {
  const canvas = document.querySelector('[data-dots]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const GAP = 28;
  const grid = document.createElement('canvas');
  const gctx = grid.getContext('2d');
  let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, ox = 0;
  let pulses = [];
  let running = false, raf = 0, lastSpawn = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    for (const c of [canvas, grid]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    cols = Math.ceil(w / GAP) + 1;
    rows = Math.ceil(h / GAP) + 1;
    ox = (w % GAP) / 2;
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx.clearRect(0, 0, w, h);
    gctx.fillStyle = 'rgba(37,45,50,0.15)';
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        gctx.beginPath();
        gctx.arc(ox + x * GAP, 12 + y * GAP, 1, 0, Math.PI * 2);
        gctx.fill();
      }
    }
    draw(performance.now());
  }

  function spawn(now) {
    // pulsos se concentram na faixa central, onde fica o título
    const cx = Math.round(cols / 2 + (Math.random() - 0.5) * cols * 0.85);
    const cy = Math.round(rows * 0.45 + (Math.random() - 0.5) * rows * 0.8);
    pulses.push({ x: ox + cx * GAP, y: 12 + cy * GAP, t0: now, life: 2600 + Math.random() * 1400 });
  }

  function draw(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(grid, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pulses = pulses.filter((p) => now - p.t0 < p.life);
    for (const p of pulses) {
      const k = (now - p.t0) / p.life;
      const a = Math.sin(k * Math.PI);
      ctx.fillStyle = `rgba(242,201,76,${0.45 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + 9 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(37,45,50,${0.7 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    if (now - lastSpawn > 420 && pulses.length < 12) {
      spawn(now);
      lastSpawn = now;
    }
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  function setRunning(on) {
    if (reduceMotion || on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  }

  resize();
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(resize, 150);
  });
  inView(canvas, () => {
    setRunning(true);
    return () => setRunning(false);
  });
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden));
})();

/* ---------- Entrada ao rolar ----------
   --d no HTML define a ordem dentro de um grupo de cards. */
if (!reduceMotion) {
  inView('.reveal', (el) => {
    const order = Number(el.style.getPropertyValue('--d')) || 0;
    animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.9, ease: EASE_OUT, delay: order * 0.08 });
  }, { amount: 0.15, margin: '0px 0px -8% 0px' });
}

/* ---------- Números contando ---------- */
if (!reduceMotion) {
  document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = '0'; });
  inView('[data-count]', (el) => {
    animate(0, Number(el.dataset.count), {
      duration: 1.6,
      ease: EASE_OUT,
      onUpdate: (v) => { el.textContent = Math.round(v); },
    });
  }, { amount: 0.6 });
}

/* ---------- /na prática: abas e o "vídeo" do personagem ---------- */
(() => {
  const tablist = document.querySelector('[data-tabs]');
  if (!tablist) return;
  const section = tablist.closest('section');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const indicator = tablist.querySelector('[data-tab-indicator]');
  let current = 0;
  let token = 0;
  let visible = false;

  // o fundo amarelo desliza até a aba escolhida (em 2x2 no celular, em linha no desktop).
  // Posicionamento instantâneo vai direto no style: no Motion 14, uma mola
  // com duration: 0 trava a página.
  let pos = null;
  function moveIndicator(instant) {
    const t = tabs[current];
    const to = { x: t.offsetLeft, y: t.offsetTop, w: t.offsetWidth, h: t.offsetHeight };
    if (instant || reduceMotion || !pos) {
      indicator.style.transform = `translateX(${to.x}px) translateY(${to.y}px)`;
      indicator.style.width = `${to.w}px`;
      indicator.style.height = `${to.h}px`;
    } else {
      animate(indicator, {
        x: [pos.x, to.x],
        y: [pos.y, to.y],
        width: [pos.w, to.w],
        height: [pos.h, to.h],
      }, { type: 'spring', visualDuration: 0.4, bounce: 0.18 });
    }
    pos = to;
  }

  // Toca o vídeo do painel: barra de progresso, zoom lento no retrato,
  // legendas uma a uma e o adesivo do produto. Repete enquanto a aba
  // estiver aberta e a seção estiver na tela.
  const REEL_SECONDS = 9;
  async function play(panel) {
    const my = ++token;
    if (reduceMotion) return;
    const reel = panel.querySelector('[data-reel]');
    const bar = reel.querySelector('.reel-bar i');
    const img = reel.querySelector('img');
    const sticker = reel.querySelector('.reel-product');
    const caps = [...reel.querySelectorAll('.cap')];
    const step = (REEL_SECONDS * 1000) / caps.length;

    while (my === token) {
      caps.forEach((c) => { c.style.opacity = '0'; });
      sticker.style.opacity = '0';
      animate(bar, { scaleX: [0, 1] }, { duration: REEL_SECONDS, ease: 'linear' });
      animate(img, { scale: [1.02, 1.1] }, { duration: REEL_SECONDS, ease: 'linear' });

      for (let i = 0; i < caps.length; i++) {
        // a legenda anterior sai antes de a próxima entrar, para não sobrepor
        if (i > 0) {
          animate(caps[i - 1], { opacity: 0, y: -8 }, { duration: 0.18 });
          await wait(200);
          if (my !== token) return;
        }
        animate(caps[i], { opacity: [0, 1], y: [12, 0] }, { type: 'spring', visualDuration: 0.35, bounce: 0.3 });
        if (i === 0) {
          // o adesivo entra girando; o CSS já inclina -4deg, aqui só o giro extra
          wait(1100).then(() => {
            if (my === token) {
              animate(sticker, { opacity: [0, 1], scale: [0.5, 1], rotate: [-12, 0] }, { type: 'spring', visualDuration: 0.5, bounce: 0.5 });
            }
          });
        }
        await wait(step);
        if (my !== token) return;
      }
      await wait(1200);
    }
  }

  function select(i, focus) {
    current = i;
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    moveIndicator(false);
    if (focus) tabs[i].focus();
    if (visible) play(panels[i]);
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => select(i, false)));
  tablist.addEventListener('keydown', (e) => {
    const last = tabs.length - 1;
    const map = { ArrowRight: current === last ? 0 : current + 1, ArrowLeft: current === 0 ? last : current - 1, Home: 0, End: last };
    if (!(e.key in map)) return;
    e.preventDefault();
    select(map[e.key], true);
  });

  select(0, false);
  window.addEventListener('resize', () => moveIndicator(true));

  // o vídeo só roda com a seção na tela
  inView(section, () => {
    visible = true;
    play(panels[current]);
    return () => {
      visible = false;
      token++;
    };
  }, { amount: 0.25 });
})();

/* ---------- Acordeões (módulos e FAQ) ----------
   A exclusividade do grupo ("name" do <details>) passa a ser feita aqui,
   para que o item que fecha também anime. */
(() => {
  const items = [...document.querySelectorAll('details.acc')];
  if (!items.length) return;

  function open(d) {
    items.forEach((o) => {
      if (o !== d && o.dataset.group && o.dataset.group === d.dataset.group && o.classList.contains('is-open')) close(o);
    });
    d.classList.add('is-open');
    d.open = true;
    if (reduceMotion) return;
    const body = d.querySelector('.acc-body');
    animate(d.querySelector('.acc-icon'), { rotate: [0, 45] }, SPRING);
    animate(body, { height: [0, body.scrollHeight], opacity: [0, 1] }, { type: 'spring', visualDuration: 0.4, bounce: 0 })
      .then(() => { body.style.height = ''; });
  }

  function close(d) {
    d.classList.remove('is-open');
    if (reduceMotion) {
      d.open = false;
      return;
    }
    const body = d.querySelector('.acc-body');
    animate(d.querySelector('.acc-icon'), { rotate: [45, 0] }, SPRING);
    animate(body, { height: [body.offsetHeight, 0], opacity: [1, 0] }, { duration: 0.28, ease: EASE_OUT })
      .then(() => {
        if (!d.classList.contains('is-open')) d.open = false;
        body.style.height = '';
        body.style.opacity = '';
      });
  }

  items.forEach((d) => {
    d.dataset.group = d.getAttribute('name') || '';
    d.removeAttribute('name');
    if (d.open) d.classList.add('is-open');
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (d.classList.contains('is-open')) close(d);
      else open(d);
    });
  });
})();

/* ---------- Botões e abas: resposta ao toque ----------
   O botão afunda até a própria sombra dura e volta com mola;
   as abas só encolhem um pouco. */
if (!reduceMotion) {
  press('.btn', (el) => {
    el.classList.add('is-pressed');
    animate(el, { y: 3 }, { type: 'spring', visualDuration: 0.1, bounce: 0 });
    return () => {
      el.classList.remove('is-pressed');
      animate(el, { y: 0 }, { type: 'spring', visualDuration: 0.35, bounce: 0.5 });
    };
  });
  press('.tab', (el) => {
    animate(el, { scale: 0.95 }, { type: 'spring', visualDuration: 0.12, bounce: 0 });
    return () => animate(el, { scale: 1 }, { type: 'spring', visualDuration: 0.35, bounce: 0.45 });
  });
}

/* ---------- Brilho dos cards seguindo o cursor ---------- */
if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.glow').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- CTA fixo no mobile ----------
   Aparece depois do hero e some quando a oferta ou o CTA final
   já estão na tela, para não repetir o mesmo botão. */
(() => {
  const bar = document.querySelector('[data-sticky-cta]');
  if (!bar) return;
  const visible = new Set();
  let shown = false;
  bar.inert = true;

  function update() {
    const on = visible.size === 0;
    if (on === shown) return;
    shown = on;
    bar.inert = !on;
    bar.classList.toggle('is-on', on);
    if (reduceMotion) return;
    animate(bar, { y: on ? ['110%', '0%'] : ['0%', '110%'] }, on
      ? { type: 'spring', visualDuration: 0.45, bounce: 0.2 }
      : { duration: 0.25, ease: 'easeIn' });
  }

  // IntersectionObserver nativo (e não inView) porque ele informa o estado
  // inicial de cada seção, inclusive quando a página abre já rolada.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    }
    update();
  });
  ['topo', 'oferta', 'cta-final'].forEach((id) => {
    const section = document.getElementById(id);
    if (section) io.observe(section);
  });
})();
