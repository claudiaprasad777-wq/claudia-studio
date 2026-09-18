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

    return () => {
      navToggle?.removeEventListener('click', toggleNav);
      teardownHeroParallax();
      teardownBioParallax();
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
