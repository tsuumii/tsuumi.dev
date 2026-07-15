(() => {
  function rng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  // Renders each depth layer as ONE element painted via a long box-shadow
  // list rather than one DOM node per star — hundreds of stars for the
  // cost of a handful of elements. Offsets are in vw/vh (viewport-relative,
  // not tied to this element's own box) so they scatter across the screen
  // regardless of where the 1px host sits.
  function makeStars(container, seed) {
    const r = rng(seed);
    const layers = [
      [260, '#c7d4ff', 'rgba(199,212,255,.8)', 12, 5],
      [140, '#c7d4ff', 'rgba(199,212,255,.85)', 26, 7],
      [60, '#e9f0ff', 'rgba(233,240,255,.95)', 44, 10],
    ];
    layers.forEach(([count, color, glow, depth, haloBlur]) => {
      const shadows = [];
      for (let i = 0; i < count; i++) {
        const x = (r() * 116 - 8).toFixed(2);
        const y = (r() * 116 - 8).toFixed(2);
        // two shadows per star: a crisp core dot, plus a blurred halo of
        // the same point for the actual glow.
        shadows.push(`${x}vw ${y}vh 0 ${color}`);
        shadows.push(`${x}vw ${y}vh ${haloBlur}px ${glow}`);
      }
      const layer = document.createElement('div');
      layer.dataset.starLayer = '';
      layer.dataset.depth = depth;
      layer.style.position = 'absolute';
      layer.style.top = '0';
      layer.style.left = '0';
      layer.style.width = '1px';
      layer.style.height = '1px';
      layer.style.borderRadius = '50%';
      layer.style.boxShadow = shadows.join(',');
      layer.style.willChange = 'transform';
      layer.style.pointerEvents = 'none';
      container.appendChild(layer);
    });
  }

  function shoot(bg) {
    if (Math.random() > 0.9) return;
    const roll = Math.random();
    const count = roll < 0.12 ? 3 : roll < 0.4 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'shoot';
      star.style.top = (Math.random() * 45).toFixed(1) + '%';
      star.style.left = (30 + Math.random() * 55).toFixed(1) + '%';
      star.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's';
      bg.appendChild(star);
      setTimeout(() => star.remove(), 1000);
    }
  }

  function startTyping() {
    document.querySelectorAll('[data-typed]').forEach((el) => {
      let texts;
      try {
        texts = JSON.parse(el.getAttribute('data-texts') || 'null');
      } catch (e) {
        texts = null;
      }
      if (!Array.isArray(texts) || !texts.length) {
        texts = [el.getAttribute('data-text') || ''];
      }

      const typeSpeed = parseInt(el.getAttribute('data-speed'), 10) || 42;
      const deleteSpeed = parseInt(el.getAttribute('data-delete-speed'), 10) || Math.round(typeSpeed * 0.6);
      const startDelay = parseInt(el.getAttribute('data-delay'), 10) || 200;
      const holdDelay = parseInt(el.getAttribute('data-hold'), 10) || 2200;
      const betweenDelay = parseInt(el.getAttribute('data-between'), 10) || 450;

      el.style.display = 'inline-block';
      el.style.textAlign = 'left';
      el.style.whiteSpace = 'nowrap';
      el.style.borderRight = '2px solid #b8a4ff';
      el.style.animation = 'blink 1.1s steps(1) infinite';

      // Freeze the box at the widest of all the strings it'll cycle
      // through, so switching between them never jitters/recenters (same
      // reasoning as the original single-text width freeze).
      let maxWidth = 0;
      texts.forEach((t) => {
        el.textContent = t;
        maxWidth = Math.max(maxWidth, el.getBoundingClientRect().width);
      });
      el.style.width = maxWidth + 'px';
      el.textContent = '';

      let textIndex = 0;

      function typeNext() {
        const full = texts[textIndex];
        let i = 0;
        const t = setInterval(() => {
          el.textContent = full.slice(0, ++i);
          if (i >= full.length) {
            clearInterval(t);
            setTimeout(deleteCurrent, holdDelay);
          }
        }, typeSpeed);
      }

      function deleteCurrent() {
        const full = texts[textIndex];
        let i = full.length;
        const t = setInterval(() => {
          el.textContent = full.slice(0, --i);
          if (i <= 0) {
            clearInterval(t);
            textIndex = (textIndex + 1) % texts.length;
            setTimeout(typeNext, betweenDelay);
          }
        }, deleteSpeed);
      }

      setTimeout(typeNext, startDelay);
    });
  }

  function loadImageSlot(slotSelector, src) {
    const slot = document.querySelector(slotSelector);
    if (!slot) return;
    const img = new Image();
    img.onload = () => {
      slot.style.backgroundImage = `url(${src})`;
      slot.textContent = '';
    };
    img.onerror = () => {};
    img.src = src;
  }

  function spawnFallStars(layer, count) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'fall-star';
      const size = 1.4 + Math.random() * 2.2;
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.width = size.toFixed(2) + 'px';
      s.style.height = (size * (9 + Math.random() * 6)).toFixed(2) + 'px';
      s.style.animationDuration = (0.55 + Math.random() * 0.85).toFixed(2) + 's';
      s.style.animationDelay = (Math.random() * 0.9).toFixed(2) + 's';
      layer.appendChild(s);
    }
  }

  function initIntro() {
    const intro = document.querySelector('[data-intro]');
    const enterBtn = document.querySelector('[data-intro-enter]');
    const starLayer = document.querySelector('[data-intro-stars]');
    if (!intro || !enterBtn) {
      document.body.classList.add('site-entered');
      startTyping();
      return;
    }

    document.documentElement.classList.add('lock-scroll');
    let entered = false;

    function enter() {
      if (entered) return;
      entered = true;

      enterBtn.style.pointerEvents = 'none';
      enterBtn.style.animation = 'none';
      enterBtn.style.opacity = '0';

      spawnFallStars(starLayer, 80);

      setTimeout(() => {
        document.body.classList.remove('pre-enter');
        document.body.classList.add('site-entered');
        startTyping();
        intro.classList.add('leaving');
        document.documentElement.classList.remove('lock-scroll');
      }, 1250);

      setTimeout(() => {
        intro.remove();
      }, 2400);
    }

    intro.addEventListener('click', enter);
    intro.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enter();
      }
    });
  }

  // Single pointer-reactive system driving tilt targets, star-layer
  // parallax, and aurora parallax off ONE mousemove listener and ONE rAF
  // loop, instead of three separate ones. Tilt-target rects are cached and
  // only remeasured on resize/scroll (throttled to one remeasure per
  // frame) rather than read every single animation frame — getBoundingClientRect
  // forces a layout, so reading it 14+ times per frame, 60 times a second,
  // was the single most expensive thing on the page.
  function initPointerFX(bg) {
    const tiltEls = Array.from(document.querySelectorAll('[data-tilt]'));
    const starLayers = Array.from(bg.querySelectorAll('[data-star-layer]'));
    const auroras = Array.from(document.querySelectorAll('[data-aurora]'));

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    function measureTilt() {
      tiltEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        el._cx = r.left + r.width / 2;
        el._cy = r.top + r.height / 2;
        el._hw = (r.width || 1) / 2;
        el._hh = (r.height || 1) / 2;
      });
    }
    measureTilt();

    let measureQueued = false;
    function queueMeasure() {
      if (measureQueued) return;
      measureQueued = true;
      requestAnimationFrame(() => {
        measureTilt();
        measureQueued = false;
      });
    }
    window.addEventListener('resize', queueMeasure);
    window.addEventListener('scroll', queueMeasure, { passive: true });

    tiltEls.forEach((el) => {
      el._tiltX = 0;
      el._tiltY = 0;
      el._lift = 0;
      if (el.classList.contains('icon-link')) {
        el.addEventListener('mouseenter', () => { el._hover = true; });
        el.addEventListener('mouseleave', () => { el._hover = false; });
      }
    });

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function loop() {
      const dx = (mouseX - window.innerWidth / 2) / window.innerWidth;
      const dy = (mouseY - window.innerHeight / 2) / window.innerHeight;

      starLayers.forEach((l) => {
        const d = parseFloat(l.getAttribute('data-depth')) || 0;
        l.style.transform = `translate3d(${(-dx * d).toFixed(2)}px, ${(-dy * d).toFixed(2)}px, 0)`;
      });

      auroras.forEach((a, i) => {
        const strength = 34 + i * 16;
        a.style.transform = `translate3d(${(dx * strength).toFixed(1)}px, ${(dy * strength * 0.65).toFixed(1)}px, 0)`;
      });

      tiltEls.forEach((el) => {
        const tx = Math.max(-1, Math.min(1, (mouseX - el._cx) / (el._hw * 3)));
        const ty = Math.max(-1, Math.min(1, (mouseY - el._cy) / (el._hh * 3)));
        const max = parseFloat(el.getAttribute('data-tilt-max')) || 8;
        const targetY = tx * max;
        const targetX = -ty * max;
        const targetLift = el._hover ? -4 : 0;

        el._tiltX += (targetX - el._tiltX) * 0.08;
        el._tiltY += (targetY - el._tiltY) * 0.08;
        el._lift += (targetLift - el._lift) * 0.15;

        el.style.transform = `perspective(600px) translateY(${el._lift.toFixed(2)}px) rotateX(${el._tiltX.toFixed(2)}deg) rotateY(${el._tiltY.toFixed(2)}deg)`;
      });

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Everything up to the first scroll (name, links) morphs into a small
  // floating pill once you've scrolled past the hero: the icon links are
  // cloned (not hand-duplicated in markup) into the pill's own nav so
  // there's one source of truth for hrefs/icons.
  function initPillBar() {
    const bar = document.querySelector('[data-pill-bar]');
    const hero = document.querySelector('.hero');
    if (!bar || !hero) return;

    const linksHost = bar.querySelector('[data-pill-links]');
    document.querySelectorAll('.links .icon-link').forEach((a) => {
      const clone = a.cloneNode(true);
      clone.classList.add('pill-icon-link');
      clone.removeAttribute('data-tilt');
      clone.removeAttribute('data-tilt-max');
      linksHost.appendChild(clone);
    });

    // Hovering the pill and using the (vertical) wheel scrolls the icon
    // row horizontally instead of scrolling the page. Eased toward a
    // target via rAF (same lerp approach as the tilt engine) rather than
    // snapping scrollLeft straight to the wheel delta, so it glides
    // instead of jumping.
    let targetScroll = 0;
    let glideRunning = false;
    function glide() {
      const current = linksHost.scrollLeft;
      const next = current + (targetScroll - current) * 0.22;
      if (Math.abs(targetScroll - next) < 0.5) {
        linksHost.scrollLeft = targetScroll;
        glideRunning = false;
        return;
      }
      linksHost.scrollLeft = next;
      requestAnimationFrame(glide);
    }
    bar.addEventListener('wheel', (e) => {
      const maxScroll = linksHost.scrollWidth - linksHost.clientWidth;
      if (maxScroll <= 0) return;
      e.preventDefault();
      if (!glideRunning) targetScroll = linksHost.scrollLeft;
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY + e.deltaX));
      if (!glideRunning) {
        glideRunning = true;
        requestAnimationFrame(glide);
      }
    }, { passive: false });

    let visible = false;
    function check() {
      const showPast = hero.getBoundingClientRect().bottom < window.innerHeight * 0.4;
      if (showPast !== visible) {
        visible = showPast;
        bar.classList.toggle('visible', visible);
      }
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
  }

  // Splits the tsuumi text into per-letter spans, each with its own fixed
  // scatter rotation (outer span) and its own slow, independent wander
  // (inner span). Split into two nested elements per letter rather than
  // one, for the same reason as the avatar/about-me-section tilt wrappers elsewhere:
  // a CSS animation owns `transform` for its whole element, so a static
  // rotate() and an animated translate() can't share one span without the
  // animation silently erasing the rotation.
  function initDriftText() {
    const el = document.querySelector('[data-tsuumi]');
    if (!el) return;
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';

    Array.from(text).forEach((ch) => {
      const rot = (Math.random() * 12 - 6).toFixed(2);
      const dx = (Math.random() * 12 - 6).toFixed(1);
      const dy = (Math.random() * 14 - 7).toFixed(1);
      const dur = (5 + Math.random() * 4).toFixed(2);
      const delay = (-Math.random() * 9).toFixed(2);

      const outer = document.createElement('span');
      outer.className = 'tl';
      outer.setAttribute('aria-hidden', 'true');
      outer.style.transform = `rotate(${rot}deg)`;

      const inner = document.createElement('span');
      inner.className = 'tl-drift';
      inner.style.setProperty('--dx', dx + 'px');
      inner.style.setProperty('--dy', dy + 'px');
      // Two comma-separated values, matching the CSS `animation-name:
      // letterDrift, gradientShift` order: drift keeps its own randomized
      // timing, gradientShift stays fixed and at zero delay on every
      // letter so the sweep stays perfectly synced across the whole word.
      inner.style.animationDuration = dur + 's, 5s';
      inner.style.animationDelay = delay + 's, 0s';
      inner.textContent = ch === ' ' ? ' ' : ch;

      outer.appendChild(inner);
      el.appendChild(outer);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const bg = document.querySelector('[data-bg]');
    makeStars(bg, 606);

    loadImageSlot('[data-avatar]', 'assets/avatar.png');
    initPointerFX(bg);
    initIntro();
    initPillBar();
    initDriftText();

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

    window.addEventListener('scroll', () => {
      bg.style.transform = `translateY(${(-window.scrollY * 0.32).toFixed(1)}px)`;
    }, { passive: true });

    setInterval(() => shoot(bg), 1300);
    setTimeout(() => shoot(bg), 900);
  });
})();
