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
    const hero = document.querySelector('.hero');
    const parallaxItems = document.querySelectorAll('.hero-tags .tag, .hero-prop, .hero-badges');
    const wideScreen = window.matchMedia('(min-width: 861px)');
    let lastEvent;
    let ticking = false;
    const applyParallax = () => {
      ticking = false;
      if (!lastEvent || !wideScreen.matches || !hero) return;
      const bounds = hero.getBoundingClientRect();
      const x = ((lastEvent.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = ((lastEvent.clientY - bounds.top) / bounds.height) * 2 - 1;
      parallaxItems.forEach((element) => {
        const depth = Number.parseFloat(element.dataset.depth) || 1;
        element.style.setProperty('--tx', `${x * 16 * depth}px`);
        element.style.setProperty('--ty', `${y * 16 * depth}px`);
      });
    };
    const resetParallax = () => parallaxItems.forEach((element) => {
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
    if (hero && parallaxItems.length && !reducedMotion.matches) {
      hero.addEventListener('mousemove', trackPointer);
      hero.addEventListener('mouseleave', resetParallax);
    }

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
      hero?.removeEventListener('mousemove', trackPointer);
      hero?.removeEventListener('mouseleave', resetParallax);
      observer?.disconnect();
      businessCards.forEach((card) => {
        card.removeEventListener('click', flipCard);
        card.removeEventListener('keydown', keyFlipCard);
      });
    };
  });
</script>

<svelte:head>
  <title>{content.title}</title>
</svelte:head>

<div class:home-page={page === 'index'}>
  {@html content.html}
</div>
