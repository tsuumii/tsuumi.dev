const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

particlesJS('particles', {
  particles: {
    number: { value: 70, density: { enable: true, value_area: 900 } },
    color: { value: '#ffffff' },
    shape: { type: 'circle' },
    opacity: { value: 0.35, random: true },
    size: { value: 1.6, random: true },
    line_linked: { enable: true, distance: 140, color: '#ffffff', opacity: 0.08, width: 1 },
    move: { enable: !reduceMotion, speed: 0.6, direction: 'none', random: true, out_mode: 'out' }
  },
  interactivity: {
    detect_on: 'window',
    events: {
      onhover: { enable: true, mode: 'grab' },
      onclick: { enable: true, mode: 'push' },
      resize: true
    },
    modes: {
      grab: { distance: 160, line_linked: { opacity: 0.25 } },
      push: { particles_nb: 3 }
    }
  },
  retina_detect: true
});

// split the name into letters that each wander on their own loop; the
// outer span holds a fixed tilt so the drift animation doesn't overwrite it
const name = document.querySelector('[data-drift]');
const text = name.textContent;
name.setAttribute('aria-label', text);
name.textContent = '';
Array.from(text).forEach((ch, i) => {
  const outer = document.createElement('span');
  outer.className = 'tl';
  outer.setAttribute('aria-hidden', 'true');
  outer.style.transform = `rotate(${(Math.random() * 9 - 4.5).toFixed(2)}deg)`;

  const inner = document.createElement('span');
  inner.className = 'tl-drift';
  inner.style.setProperty('--dx', (Math.random() * 6 - 3).toFixed(1) + 'px');
  inner.style.setProperty('--dy', (Math.random() * 6 - 3).toFixed(1) + 'px');
  inner.style.setProperty('--i', i);
  inner.style.setProperty('--dur', (5 + Math.random() * 4).toFixed(2) + 's');
  inner.style.setProperty('--delay', (-Math.random() * 9).toFixed(2) + 's');
  inner.textContent = ch;

  outer.appendChild(inner);
  name.appendChild(outer);
});

// github contributions, drawn as a monochrome grid; hidden if the fetch fails
(async () => {
  const wrap = document.querySelector('[data-contrib]');
  try {
    const res = await fetch('https://github-contributions-api.jogruber.de/v4/tsuumii?y=last');
    if (!res.ok) throw new Error(res.status);
    const { total, contributions } = await res.json();
    const grid = wrap.querySelector('[data-contrib-grid]');
    const months = wrap.querySelector('[data-contrib-months]');
    const pad = new Date(contributions[0].date + 'T00:00').getDay();
    const weeks = Math.ceil((pad + contributions.length) / 7);
    wrap.style.setProperty('--weeks', weeks);

    for (let i = 0; i < pad; i++) grid.appendChild(document.createElement('i'));
    let lastMonth = -1;
    contributions.forEach((day, i) => {
      const date = new Date(day.date + 'T00:00');
      const cell = document.createElement('span');
      cell.dataset.l = day.level;
      cell.title = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
      grid.appendChild(cell);

      // label a month at the first week column it starts in, skipping a
      // partial first month so labels don't collide at the left edge
      const week = Math.floor((pad + i) / 7);
      if (date.getMonth() !== lastMonth && (pad + i) % 7 === 0 && week < weeks - 2) {
        if (lastMonth !== -1 || date.getDate() <= 7) {
          const label = document.createElement('span');
          label.textContent = date.toLocaleDateString('en', { month: 'short' }).toLowerCase();
          label.style.gridColumn = week + 1;
          months.appendChild(label);
        }
        lastMonth = date.getMonth();
      }
    });

    wrap.querySelector('[data-contrib-total]').textContent = `${total.lastYear} contributions in the last year`;
    wrap.classList.add('ready');
  } catch {
    wrap.hidden = true;
  }
})();

// copy-to-clipboard buttons; the check icon shows briefly on success
document.querySelectorAll('[data-copy]').forEach((btn) => {
  let timer;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
    } catch {
      return;
    }
    btn.classList.add('copied');
    clearTimeout(timer);
    timer = setTimeout(() => {
      btn.classList.remove('copied');
    }, 1800);
  });
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();

// show the latest commit on main, and reload once a newer commit has
// actually been deployed: a new sha alone isn't enough, since pages takes
// a minute or so to publish, so we also wait for the served files to change
(() => {
  const REPO = 'tsuumii/tsuumi.dev';
  const POLL_MS = 3 * 60 * 1000;
  const FILES = [location.pathname, 'style.css', 'script.js'];
  const link = document.querySelector('[data-version]');
  let currentSha = null;
  let snapshot = null;

  async function latestCommit() {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  // cache: 'reload' also refreshes the http cache, so the reload that
  // follows picks up the new css/js instead of a stale copy
  async function deployedFiles() {
    const texts = await Promise.all(FILES.map((f) =>
      fetch(f, { cache: 'reload' }).then((r) => (r.ok ? r.text() : ''))
    ));
    return texts.join('\n');
  }

  async function check() {
    if (document.hidden) return;
    try {
      const { sha } = await latestCommit();
      if (sha === currentSha || !snapshot) return;
      if ((await deployedFiles()) !== snapshot) location.reload();
    } catch {}
  }

  (async () => {
    try {
      const commit = await latestCommit();
      currentSha = commit.sha;
      link.textContent = `v${commit.sha.slice(0, 7)}`;
      link.href = commit.html_url;
      link.title = commit.commit.message.split('\n')[0];
      link.hidden = false;
    } catch {
      return;
    }
    if (location.protocol === 'file:') return;
    try { snapshot = await deployedFiles(); } catch {}
    setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', check);
  })();
})();
