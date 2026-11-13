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

    return () => {
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
