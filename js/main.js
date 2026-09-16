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

// Hero parallax — the glass tags, vinyl, palette, camera, and designer
// badges each drift toward the cursor at their own depth, so the whole
// cluster reads as layered rather than flat.
const hero = document.querySelector(".hero");
const parallaxEls = document.querySelectorAll(
  ".hero-tags .tag, .hero-prop, .hero-badges"
);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isWideEnough = window.matchMedia("(min-width: 861px)"); // matches the CSS breakpoint that drops absolute positioning

const MAX_OFFSET = 16; // px of travel at the very edge of the hero

if (hero && parallaxEls.length && !prefersReducedMotion.matches) {
  let ticking = false;
  let lastEvent = null;

  const applyParallax = () => {
    ticking = false;
    if (!lastEvent || !isWideEnough.matches) return;

    const rect = hero.getBoundingClientRect();
    // -1 (left/top edge) to 1 (right/bottom edge), 0 at hero's center
    const nx = ((lastEvent.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((lastEvent.clientY - rect.top) / rect.height) * 2 - 1;

    parallaxEls.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 1;
      el.style.setProperty("--tx", `${nx * MAX_OFFSET * depth}px`);
      el.style.setProperty("--ty", `${ny * MAX_OFFSET * depth}px`);
    });
  };

  hero.addEventListener("mousemove", (event) => {
    lastEvent = event;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  });

  hero.addEventListener("mouseleave", () => {
    parallaxEls.forEach((el) => {
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    });
  });
}

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
