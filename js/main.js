// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const primaryNav = document.getElementById("primaryNav");

if (navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Parallax — hero tags/props/badges and the bio-page polaroid props each
// drift toward the cursor at their own depth, so each cluster reads as
// layered rather than flat.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isWideEnough = window.matchMedia("(min-width: 861px)"); // matches the CSS breakpoint that drops absolute positioning

const MAX_OFFSET = 16; // px of travel at the very edge of the container

function setupParallax(container, els) {
  if (!container || !els.length || prefersReducedMotion.matches) return;

  let ticking = false;
  let lastEvent = null;

  const applyParallax = () => {
    ticking = false;
    if (!lastEvent || !isWideEnough.matches) return;

    const rect = container.getBoundingClientRect();
    // -1 (left/top edge) to 1 (right/bottom edge), 0 at container's center
    const nx = ((lastEvent.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((lastEvent.clientY - rect.top) / rect.height) * 2 - 1;

    els.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 1;
      el.style.setProperty("--tx", `${nx * MAX_OFFSET * depth}px`);
      el.style.setProperty("--ty", `${ny * MAX_OFFSET * depth}px`);
    });
  };

  container.addEventListener("mousemove", (event) => {
    lastEvent = event;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  });

  container.addEventListener("mouseleave", () => {
    els.forEach((el) => {
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    });
  });
}

setupParallax(
  document.querySelector(".hero"),
  document.querySelectorAll(".hero-tags .tag, .hero-prop, .hero-badges")
);
setupParallax(
  document.querySelector(".bio"),
  document.querySelectorAll(".bio-prop")
);

// Project card scroll-reveal — cards sit blurred until they scroll into
// view, then sharpen into place. The .scroll-blur class only gets added
// here (JS-driven), so a page with JS disabled never sees a blurred card.
// Scoped to the home page's featured cards only (:not(.work-archive)) —
// the full Work archive stays instantly scannable.
const scrollCards = document.querySelectorAll(
  ".projects:not(.work-archive) .project-list .project-card"
);

if (scrollCards.length && !prefersReducedMotion.matches) {
  if ("IntersectionObserver" in window) {
    scrollCards.forEach((card) => card.classList.add("scroll-blur"));

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    scrollCards.forEach((card) => revealObserver.observe(card));
  }
}

// Business card flip — CSS :hover already flips it for mouse users; this
// adds tap-to-flip (no hover on touch) and Enter/Space (keyboard, since the
// card is role="button" tabindex="0"). Clicks on the back face's real links
// are left alone so they navigate/open mail normally instead of re-toggling.
document.querySelectorAll(".business-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    card.classList.toggle("is-flipped");
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      card.classList.toggle("is-flipped");
    }
  });
});

// Config 2026 — floating swag drifts toward the cursor (same parallax as the hero)
setupParallax(
  document.querySelector(".config-hero"),
  document.querySelectorAll(".config-float")
);

// Case-study pages — highlight the chapter currently on screen in the
// sticky "On this page" list.
const tocLinks = document.querySelectorAll(".case-toc a");
if (tocLinks.length && "IntersectionObserver" in window) {
  const byId = new Map([...tocLinks].map((a) => [a.getAttribute("href").slice(1), a]));
  const tocObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove("is-active"));
        byId.get(entry.target.id)?.classList.add("is-active");
      });
    },
    { rootMargin: "-35% 0px -55% 0px" }
  );
  document.querySelectorAll(".case-step").forEach((step) => tocObserver.observe(step));
}

// Print Work — category filter
const printButtons = document.querySelectorAll(".prints-filter__btn");
printButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    printButtons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll(".print-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

// Art exhibition — click a framed piece to open "viewing mode";
// arrows / keyboard step through every piece in the exhibition.
const viewer = document.getElementById("exhibitViewer");
if (viewer) {
  const pieces = [...document.querySelectorAll(".exhibit-piece")];
  const art = viewer.querySelector(".exhibit-viewer__art");
  const titleEl = viewer.querySelector(".exhibit-viewer__title");
  const metaEl = viewer.querySelector(".exhibit-viewer__meta");
  let current = 0;
  let opener = null;

  const show = (i) => {
    current = (i + pieces.length) % pieces.length;
    const piece = pieces[current];
    const frame = piece.querySelector(".exhibit-frame");
    const content = frame.firstElementChild.cloneNode(true);
    art.replaceChildren(content);
    art.style.setProperty("--ar", frame.style.aspectRatio || "3 / 4");
    titleEl.textContent = piece.dataset.title || "";
    metaEl.textContent = piece.dataset.meta || "";
  };
  const open = (i, from) => {
    opener = from;
    show(i);
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    viewer.querySelector(".exhibit-viewer__close").focus();
  };
  const close = () => {
    viewer.hidden = true;
    document.body.style.overflow = "";
    opener?.focus();
  };

  pieces.forEach((piece, i) => {
    const frame = piece.querySelector(".exhibit-frame");
    frame.addEventListener("click", () => open(i, frame));
  });
  viewer.querySelector(".exhibit-viewer__close").addEventListener("click", close);
  viewer.querySelector(".exhibit-viewer__nav--prev").addEventListener("click", () => show(current - 1));
  viewer.querySelector(".exhibit-viewer__nav--next").addEventListener("click", () => show(current + 1));
  viewer.addEventListener("click", (e) => { if (e.target === viewer) close(); });
  document.addEventListener("keydown", (e) => {
    if (viewer.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
}

// Config 2026 — stage clips play (muted) while on screen, pause when not
const stageClips = document.querySelectorAll(".stage-clip");
if (stageClips.length && "IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const clipObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      });
    },
    { threshold: 0.5 }
  );
  stageClips.forEach((clip) => clipObserver.observe(clip));
}

// Fun bits (mirrors SitePage.svelte)
{
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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
          el.classList.add('reveal');
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

    const teardownFun = setupFun();

}
