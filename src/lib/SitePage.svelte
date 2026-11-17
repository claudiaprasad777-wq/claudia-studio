<script>
  // @ts-nocheck
  import { onMount } from 'svelte';

  let { page, content } = $props();

  onMount(() => {
    const navToggle = document.getElementById('navToggle');
    const primaryNav = document.getElementById('primaryNav');
    const closeNav = () => {
      primaryNav?.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    };

    const toggleNav = () => {
      const open = primaryNav?.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle?.addEventListener('click', toggleNav);
    primaryNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wideScreen = window.matchMedia('(min-width: 861px)');

    const setupParallax = (container, items) => {
      if (!container || !items.length || reducedMotion.matches) return () => {};
      let lastEvent;
      let ticking = false;
      const applyParallax = () => {
        ticking = false;
        if (!lastEvent || !wideScreen.matches) return;
        const bounds = container.getBoundingClientRect();
        const x = ((lastEvent.clientX - bounds.left) / bounds.width) * 2 - 1;
        const y = ((lastEvent.clientY - bounds.top) / bounds.height) * 2 - 1;
        items.forEach((element) => {
          const depth = Number.parseFloat(element.dataset.depth) || 1;
          element.style.setProperty('--tx', `${x * 16 * depth}px`);
          element.style.setProperty('--ty', `${y * 16 * depth}px`);
        });
      };
      const resetParallax = () => items.forEach((element) => {
        element.style.setProperty('--tx', '0px');
        element.style.setProperty('--ty', '0px');
      });
      const trackPointer = (event) => {
        lastEvent = event;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(applyParallax);
        }
      };
      container.addEventListener('mousemove', trackPointer);
      container.addEventListener('mouseleave', resetParallax);
      return () => {
        container.removeEventListener('mousemove', trackPointer);
        container.removeEventListener('mouseleave', resetParallax);
      };
    };

    const teardownHeroParallax = setupParallax(
      document.querySelector('.hero'),
      document.querySelectorAll('.hero-tags .tag, .hero-prop, .hero-badges')
    );
    const teardownBioParallax = setupParallax(
      document.querySelector('.bio'),
      document.querySelectorAll('.bio-prop')
    );

    const cards = document.querySelectorAll('.projects:not(.work-archive) .project-list .project-card');
    let observer;
    if (cards.length && !reducedMotion.matches && 'IntersectionObserver' in window) {
      cards.forEach((card) => card.classList.add('scroll-blur'));
      observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }), { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      cards.forEach((card) => observer.observe(card));
    }

    const businessCards = document.querySelectorAll('.business-card');
    const flipCard = (event) => {
      if (event.target.closest('a')) return;
      event.currentTarget.classList.toggle('is-flipped');
    };
    const keyFlipCard = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.currentTarget.classList.toggle('is-flipped');
      }
    };
    businessCards.forEach((card) => {
      card.addEventListener('click', flipCard);
      card.addEventListener('keydown', keyFlipCard);
    });

    // Config 2026 — floating photos drift toward the cursor
    const teardownConfigParallax = setupParallax(
      document.querySelector('.config-hero'),
      document.querySelectorAll('.config-float')
    );

    // Case-study pages — highlight the chapter on screen in the sticky list
    let tocObserver;
    const tocLinks = document.querySelectorAll('.case-toc a');
    if (tocLinks.length && 'IntersectionObserver' in window) {
      const byId = new Map([...tocLinks].map((a) => [a.getAttribute('href').slice(1), a]));
      tocObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove('is-active'));
        byId.get(entry.target.id)?.classList.add('is-active');
      }), { rootMargin: '-35% 0px -55% 0px' });
      document.querySelectorAll('.case-step').forEach((step) => tocObserver.observe(step));
    }

    // Print Work — category filter
    const printButtons = document.querySelectorAll('.prints-filter__btn');
    const filterPrints = (event) => {
      const btn = event.currentTarget;
      const filter = btn.dataset.filter;
      printButtons.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      document.querySelectorAll('.print-card').forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
      });
    };
    printButtons.forEach((btn) => btn.addEventListener('click', filterPrints));

    // Config 2026 — stage clips play muted while on screen
    let clipObserver;
    const stageClips = document.querySelectorAll('.stage-clip');
    if (stageClips.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
      clipObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      }), { threshold: 0.5 });
      stageClips.forEach((clip) => clipObserver.observe(clip));
    }

    // Art exhibition — click a frame for viewing mode; arrows/Esc to navigate
    const viewer = document.getElementById('exhibitViewer');
    const viewerCleanup = [];
    if (viewer) {
      const pieces = [...document.querySelectorAll('.exhibit-piece')];
      const art = viewer.querySelector('.exhibit-viewer__art');
      const titleEl = viewer.querySelector('.exhibit-viewer__title');
      const metaEl = viewer.querySelector('.exhibit-viewer__meta');
      let current = 0;
      let opener = null;
      const show = (i) => {
        current = (i + pieces.length) % pieces.length;
        const piece = pieces[current];
        const frame = piece.querySelector('.exhibit-frame');
        art.replaceChildren(frame.firstElementChild.cloneNode(true));
        art.style.setProperty('--ar', frame.style.aspectRatio || '3 / 4');
        titleEl.textContent = piece.dataset.title || '';
        metaEl.textContent = piece.dataset.meta || '';
      };
      const close = () => {
        viewer.hidden = true;
        document.body.style.overflow = '';
        opener?.focus();
      };
      const on = (el, type, fn) => {
        el.addEventListener(type, fn);
        viewerCleanup.push(() => el.removeEventListener(type, fn));
      };
      pieces.forEach((piece, i) => {
        const frame = piece.querySelector('.exhibit-frame');
        on(frame, 'click', () => {
          opener = frame;
          show(i);
          viewer.hidden = false;
          document.body.style.overflow = 'hidden';
          viewer.querySelector('.exhibit-viewer__close').focus();
        });
      });
      on(viewer.querySelector('.exhibit-viewer__close'), 'click', close);
      on(viewer.querySelector('.exhibit-viewer__nav--prev'), 'click', () => show(current - 1));
      on(viewer.querySelector('.exhibit-viewer__nav--next'), 'click', () => show(current + 1));
      on(viewer, 'click', (e) => { if (e.target === viewer) close(); });
      on(document, 'keydown', (e) => {
        if (viewer.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
      });
      viewerCleanup.push(() => { document.body.style.overflow = ''; });
    }

    // Fun bits — scroll reveal, card tilt, click sparkles
    const setupFun = () => {
      const cleanups = [];
      if (reducedMotion.matches) return () => {};

      // 1. pop things in as they scroll into view (staggered per group)
      if ('IntersectionObserver' in window) {
        const revealTargets = document.querySelectorAll([
          '.section-heading', '.case-step', '.case-cover', '.print-card', '.print-process__steps li',
          '.swag-item', '.config-photo', '.stage-clip', '.takeaway', '.config-section__title',
          '.logo-tile', '.logo-detail__tiles', '.logo-detail__wide', '.logo-detail__system',
          '.bio-block__title', '.now-note', '.timeline__item', '.bio-card', '.off-polaroid',
          '.work-group-title', '.work-more__tile', '.exhibit-room__sign', '.config-teaser__card',
          '.projects.work-archive .project-card', '.case-insight', '.case-hmw', '.case-film', '.case-results li', '.case-ticket', '.case-window', '.case-next'
        ].join(','));
        const counts = new Map();
        const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealTargets.forEach((el) => {
          if (el.closest('.hero') || el.classList.contains('scroll-blur')) return;
          const n = counts.get(el.parentElement) || 0;
          counts.set(el.parentElement, n + 1);
          el.style.setProperty('--i', Math.min(n, 6));
          el.classList.add('pop-in');
          revealObserver.observe(el);
        });
        cleanups.push(() => revealObserver.disconnect());
      }

      // 2. cards tilt toward the cursor
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.print-card, .work-more__tile, .bio-card, .logo-detail__tile').forEach((card) => {
          card.classList.add('tilt');
          const move = (e) => {
            const b = card.getBoundingClientRect();
            const x = (e.clientX - b.left) / b.width - 0.5;
            const y = (e.clientY - b.top) / b.height - 0.5;
            card.classList.add('is-tilting');
            card.style.transform = `perspective(800px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`;
          };
          const leave = () => {
            card.classList.remove('is-tilting');
            card.style.transform = '';
          };
          card.addEventListener('pointermove', move);
          card.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            card.removeEventListener('pointermove', move);
            card.removeEventListener('pointerleave', leave);
          });
        });
      }

      // 3. little confetti sparkles on playful clicks
      const sparkColors = ['#b3455f', '#6b6f2f', '#2f6280', '#f7d7de', '#e4e7c3', '#d3e4f0'];
      const sparkle = (e) => {
        if (!e.target.closest('.btn, .pill, .prints-filter__btn, .now-note, .logo-swatch, .off-polaroid')) return;
        for (let i = 0; i < 10; i += 1) {
          const dot = document.createElement('span');
          const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
          const dist = 28 + Math.random() * 26;
          dot.className = 'click-spark';
          dot.style.left = `${e.clientX}px`;
          dot.style.top = `${e.clientY}px`;
          dot.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
          dot.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
          dot.style.setProperty('--spark', sparkColors[i % sparkColors.length]);
          dot.addEventListener('animationend', () => dot.remove(), { once: true });
          document.body.appendChild(dot);
        }
      };
      document.addEventListener('click', sparkle);
      cleanups.push(() => document.removeEventListener('click', sparkle));

      return () => cleanups.forEach((fn) => fn());
    };
    // Project pages — reading progress bar in the project's accent colour
    const caseArticle = document.querySelector('article.case');
    let teardownProgress = () => {};
    if (caseArticle) {
      const bar = document.createElement('div');
      bar.className = 'case-progress';
      bar.setAttribute('aria-hidden', 'true');
      caseArticle.prepend(bar);
      let queued = false;
      const update = () => {
        queued = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max) : 0);
      };
      const onScroll = () => {
        if (!queued) { queued = true; requestAnimationFrame(update); }
      };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      teardownProgress = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        bar.remove();
      };
    }

    // Homepage banner — grid squares light up as pixel trails under the cursor
    // and grid lines darken nearby (never behind the middle content)
    const setupPixelGrid = () => {
      const hero = document.querySelector('.hero');
      if (!hero || reducedMotion.matches || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
      const CELL = 40; // matches .grid-bg background-size
      const colors = ['#1e1e1e', '#555555', '#8a8a8a', '#bdbdbd', '#e2e2e2', '#ffffff'];
      const glyphs = 'CLAUDIA*+#=~:.';
      const canvas = document.createElement('canvas');
      canvas.className = 'pixel-grid';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
      const ctx = canvas.getContext('2d');
      const cells = new Map(); // "col,row" -> { life, color, glyph }
      // keep the middle content (title, intro, button) completely still and clear
      const calmZones = [...hero.querySelectorAll('.hero-heading, .hero-copy')];
      let calmRects = [];
      const updateCalm = () => {
        calmRects = calmZones.map((el) => {
          const b = el.getBoundingClientRect();
          return { l: b.left - 12, t: b.top - 12, r: b.right + 12, b: b.bottom + 12 };
        });
      };
      const inCalm = (x, y, w = 0, h = 0) => calmRects.some((z) => x < z.r && x + w > z.l && y < z.b && y + h > z.t);
      let pointer = null;
      let raf = 0;
      let last = performance.now();
      let dpr = 1;

      const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();

      const light = (col, row, strength) => {
        if (inCalm(col * CELL, row * CELL, CELL, CELL)) return;
        const key = `${col},${row}`;
        const cell = cells.get(key);
        if (cell) { cell.life = Math.max(cell.life, strength); return; }
        cells.set(key, {
          life: strength,
          age: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
          glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        });
      };

      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // darker grid lines in a soft circle around the cursor
        if (pointer) {
          const r = 150;
          const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, r);
          g.addColorStop(0, 'rgba(30,30,30,0.14)');
          g.addColorStop(1, 'rgba(30,30,30,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.beginPath();
          const x0 = Math.floor((pointer.x - r) / CELL) * CELL;
          const y0 = Math.floor((pointer.y - r) / CELL) * CELL;
          for (let x = x0; x <= pointer.x + r; x += CELL) { ctx.moveTo(x + 0.5, pointer.y - r); ctx.lineTo(x + 0.5, pointer.y + r); }
          for (let y = y0; y <= pointer.y + r; y += CELL) { ctx.moveTo(pointer.x - r, y + 0.5); ctx.lineTo(pointer.x + r, y + 0.5); }
          ctx.stroke();
          calmRects.forEach((z) => ctx.clearRect(z.l, z.t, z.r - z.l, z.b - z.t));
        }

        // fading pixel squares with a tiny glyph inside
        ctx.font = '400 11px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        cells.forEach((cell, key) => {
          cell.life -= dt / 1.8;
          cell.age += dt;
          if (cell.life <= 0) { cells.delete(key); return; }
          const [col, row] = key.split(',').map(Number);
          const x = col * CELL;
          const y = row * CELL;
          // ease in over a quarter second, then fade out slowly
          const fadeIn = Math.min(1, cell.age / 0.25);
          const strength = fadeIn * fadeIn * (3 - 2 * fadeIn) * Math.min(1, cell.life * 1.4);
          const dark = /^#(1e|55)/.test(cell.color);
          const pad = 5 + (1 - strength) * 5;
          ctx.globalAlpha = strength * (dark ? 0.18 : 0.55);
          ctx.fillStyle = cell.color;
          ctx.fillRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2);
          if (cell.color === '#ffffff') {
            ctx.globalAlpha = strength * 0.25;
            ctx.strokeStyle = '#1e1e1e';
            ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, CELL - pad * 2 - 1, CELL - pad * 2 - 1);
          }
          ctx.globalAlpha = strength * 0.3;
          ctx.fillStyle = '#1e1e1e';
          ctx.fillText(cell.glyph, x + CELL / 2, y + CELL / 2 + 1);
        });
        ctx.globalAlpha = 1;

        raf = cells.size || pointer ? requestAnimationFrame(frame) : 0;
      };
      const wake = () => {
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      };

      const move = (e) => {
        const prev = pointer;
        pointer = { x: e.clientX, y: e.clientY };
        updateCalm();
        const col = Math.floor(pointer.x / CELL);
        const row = Math.floor(pointer.y / CELL);
        light(col, row, 1);
        // a few scattered neighbours so the trail looks like a pixel creature
        const speed = prev ? Math.hypot(pointer.x - prev.x, pointer.y - prev.y) : 0;
        const extra = Math.min(2, Math.floor(speed / 40));
        for (let i = 0; i < extra; i += 1) {
          light(col + Math.round((Math.random() - 0.5) * 2.4), row + Math.round((Math.random() - 0.5) * 2.4), 0.45 + Math.random() * 0.3);
        }
        wake();
      };
      const leave = () => {
        pointer = null;
      };

      hero.addEventListener('pointermove', move);
      hero.addEventListener('pointerleave', leave);
      window.addEventListener('resize', resize);
      return () => {
        cancelAnimationFrame(raf);
        hero.removeEventListener('pointermove', move);
        hero.removeEventListener('pointerleave', leave);
        window.removeEventListener('resize', resize);
        canvas.remove();
      };
    };
    const teardownPixelGrid = setupPixelGrid();

    const teardownFun = setupFun();

    return () => {
      teardownFun();
      teardownPixelGrid();
      teardownProgress();
      navToggle?.removeEventListener('click', toggleNav);
      teardownHeroParallax();
      teardownBioParallax();
      teardownConfigParallax();
      tocObserver?.disconnect();
      clipObserver?.disconnect();
      printButtons.forEach((btn) => btn.removeEventListener('click', filterPrints));
      viewerCleanup.forEach((fn) => fn());
      observer?.disconnect();
      businessCards.forEach((card) => {
        card.removeEventListener('click', flipCard);
        card.removeEventListener('keydown', keyFlipCard);
      });
    };
  });

  // instagram's own embed.js only scans+renders .instagram-media blockquotes
  // that exist in the DOM when it runs; since raw <script> tags inside
  // {@html} content never execute, load it ourselves and call
  // window.instgrm.Embeds.process() whenever a page with an embed mounts —
  // re-reading content.html keeps this reactive across client-side nav too.
  $effect(() => {
    if (typeof document === 'undefined' || !content.html.includes('instagram-media')) return;

    const process = () => window.instgrm?.Embeds?.process();
    if (window.instgrm) {
      process();
      return;
    }

    let script = document.getElementById('instagram-embed-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'instagram-embed-script';
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', process, { once: true });
  });
</script>

<svelte:head>
  <title>{content.title}</title>
</svelte:head>

<div class:home-page={page === 'index'}>
  {@html content.html}
</div>
