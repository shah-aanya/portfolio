try {
  gsap.registerPlugin(ScrollTrigger);
  initAnimations();
} catch (e) {
  console.warn('Animations unavailable:', e);
}

// Carousel runs unconditionally — no GSAP dependency
initCarousels();

function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track  = carousel.querySelector('.carousel-track');
    const imgs   = track.querySelectorAll('img');
    const dotsEl = carousel.querySelector('.carousel-dots');
    const prev   = carousel.querySelector('.carousel-btn--prev');
    const next   = carousel.querySelector('.carousel-btn--next');

    let current = 0;

    imgs.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });

    const dots = dotsEl.querySelectorAll('.carousel-dot');

    function goTo(index) {
      current = (index + imgs.length) % imgs.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));

    let startX = 0;
    carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });
  });
}

function initAnimations() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Nav morph on scroll ──────────────────────────────────
  const nav = document.querySelector('.nav');
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', updateNav, { passive: true });

  // ── Nav active section (IntersectionObserver) ────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-label[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-label[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  if (reduced) return;

  // ── Bento card scroll reveal ─────────────────────────────
  gsap.utils.toArray('.bento-card').forEach((card, i) => {
    gsap.from(card, {
      y: 48,
      opacity: 0,
      duration: 0.65,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      delay: i * 0.08,
    });
  });

  // ── Sparkle cursor trail ─────────────────────────────────
  let particleCount = 0;
  let lastSparkleTime = 0;
  const MAX_PARTICLES  = 20;
  const THROTTLE_MS    = 45;

  const style = getComputedStyle(document.documentElement);
  const sparkColors = [
    style.getPropertyValue('--olive').trim()  || '#6B7C45',
    style.getPropertyValue('--orange').trim() || '#D4845A',
  ];

  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastSparkleTime < THROTTLE_MS) return;
    if (particleCount >= MAX_PARTICLES) return;
    lastSparkleTime = now;

    const size  = 4 + Math.random() * 4;
    const color = sparkColors[Math.floor(Math.random() * sparkColors.length)];
    const dx    = (Math.random() - 0.5) * 22;
    const dy    = -(8 + Math.random() * 12);

    const spark = document.createElement('span');
    spark.className = 'sparkle-particle';
    spark.style.cssText = [
      `left:${e.clientX - size / 2}px`,
      `top:${e.clientY - size / 2}px`,
      `width:${size}px`,
      `height:${size}px`,
      `background:${color}`,
      'opacity:1',
    ].join(';');

    document.body.appendChild(spark);
    particleCount++;

    requestAnimationFrame(() => {
      spark.style.opacity = '0';
      spark.style.transform = `translate(${dx}px,${dy}px) scale(0.2)`;
    });

    spark.addEventListener('transitionend', () => {
      spark.remove();
      particleCount--;
    }, { once: true });
  });
}
