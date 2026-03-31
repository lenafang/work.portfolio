// Scroll reveal — observe + immediately check elements already in viewport
const ro = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
}), { threshold: 0.05 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
// Fallback: force-reveal elements already in viewport on load (fixes sub-pages)
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 100 && r.bottom > 0) el.classList.add('visible');
    });
  }, 80);
});

// Animated counter for stats (only fires on homepage)
function animateCount(el, target, duration) {
  let start = 0, step = target / (duration / 16);
  const tick = () => {
    start = Math.min(start + step, target);
    const em = el.querySelector('em');
    if (em) {
      el.childNodes[0].textContent = Math.floor(start);
    }
    if (start < target) requestAnimationFrame(tick);
  };
  tick();
}
const statCells = document.querySelectorAll('.stat-cell');
if (statCells.length) {
  const statsObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target.querySelector('.stat-n[data-target]');
        if (el) { animateCount(el, parseInt(el.dataset.target), 800); statsObs.unobserve(e.target); }
      }
    });
  }, { threshold: 0.5 });
  statCells.forEach(c => statsObs.observe(c));
}

// Scroll depth tracking
const scrollMilestones = [25, 50, 75, 90];
const reached = new Set();
window.addEventListener('scroll', () => {
  const pct = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
  scrollMilestones.forEach(m => {
    if (pct >= m && !reached.has(m)) {
      reached.add(m);
      if (typeof gtag !== 'undefined') gtag('event', 'scroll_depth', { depth: m + '%' });
    }
  });
}, { passive: true });

// Close mobile nav on link click
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => document.querySelector('nav').classList.remove('nav-open'));
});

// ── GA TRACKING ──

// Section visibility tracking (impression / time spent)
(function() {
  if (typeof gtag === 'undefined') return;
  const sectionTimers = {};
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id;
      if (!id) return;
      if (entry.isIntersecting) {
        // Fire section_view event on first impression
        if (!sectionTimers[id]) {
          gtag('event', 'section_view', { section_name: id, page: location.pathname });
        }
        sectionTimers[id] = Date.now();
      } else if (sectionTimers[id]) {
        // Fire time_on_section when leaving
        const duration = Math.round((Date.now() - sectionTimers[id]) / 1000);
        if (duration > 1) {
          gtag('event', 'section_dwell', { section_name: id, duration_seconds: duration, page: location.pathname });
        }
        sectionTimers[id] = null;
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

  // Track remaining time on page unload
  window.addEventListener('beforeunload', () => {
    Object.keys(sectionTimers).forEach(id => {
      if (sectionTimers[id]) {
        const duration = Math.round((Date.now() - sectionTimers[id]) / 1000);
        if (duration > 1) {
          gtag('event', 'section_dwell', { section_name: id, duration_seconds: duration, page: location.pathname });
        }
      }
    });
  });
})();

// External link click tracking
document.querySelectorAll('a[href^="http"], a[href^="mailto:"]').forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'outbound_click', {
        link_url: link.href,
        link_text: link.textContent.trim().slice(0, 50),
        page: location.pathname
      });
    }
  });
});

// Nav click tracking
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'nav_click', {
        link_text: link.textContent.trim(),
        link_url: link.getAttribute('href'),
        page: location.pathname
      });
    }
  });
});

// CTA button click tracking
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'cta_click', {
        button_text: btn.textContent.trim().slice(0, 50),
        button_url: btn.getAttribute('href'),
        page: location.pathname
      });
    }
  });
});

// Key project cross-link tracking (experience → projects)
document.querySelectorAll('.tl-proj-link').forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'project_link_click', {
        project_name: link.textContent.trim(),
        target_anchor: link.getAttribute('href'),
        page: location.pathname
      });
    }
  });
});

// Flow chart toggle tracking
document.querySelectorAll('.flow-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      const isOpen = btn.closest('.proj-card').classList.contains('flow-open');
      gtag('event', 'flow_chart_toggle', {
        action: isOpen ? 'close' : 'open',
        page: location.pathname
      });
    }
  });
});

// Company card click tracking
document.querySelectorAll('.co-badge').forEach(card => {
  card.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'company_card_click', {
        company_name: card.querySelector('.co-name')?.textContent.replace(/\n/g, ' ').trim(),
        link_url: card.getAttribute('href'),
        page: location.pathname
      });
    }
  });
});

// City card click tracking
document.querySelectorAll('.city-card').forEach(card => {
  card.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'city_card_click', {
        city_name: card.querySelector('.city-name')?.textContent.trim(),
        link_url: card.getAttribute('href'),
        page: location.pathname
      });
    }
  });
});

// Page engagement time (total time on page)
(function() {
  if (typeof gtag === 'undefined') return;
  const pageStart = Date.now();
  window.addEventListener('beforeunload', () => {
    const total = Math.round((Date.now() - pageStart) / 1000);
    gtag('event', 'page_engagement', { total_seconds: total, page: location.pathname });
  });
})();

// Auto-detect traffic source from referrer (for LinkedIn Featured etc.)
(function() {
  if (typeof gtag === 'undefined') return;
  var ref = document.referrer.toLowerCase();
  var params = new URLSearchParams(location.search);
  // Only fire if no UTM already set (avoid double counting)
  if (!params.get('utm_source')) {
    var source = 'direct';
    if (ref.includes('linkedin.com')) source = 'linkedin';
    else if (ref.includes('google.com')) source = 'google';
    else if (ref.includes('indeed.com')) source = 'indeed';
    else if (ref.includes('greenhouse.io')) source = 'greenhouse';
    else if (ref.includes('ashbyhq.com')) source = 'ashby';
    else if (ref.includes('lever.co')) source = 'lever';
    else if (ref) source = ref.split('/')[2] || 'referral';
    gtag('event', 'traffic_source', { source: source, referrer: ref || 'none', page: location.pathname });
  }
})();
