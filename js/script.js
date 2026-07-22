document.addEventListener('DOMContentLoaded', () => {

  // ===== BACKGROUND MUSIC =====
  (function initMusic() {
    const audio = document.getElementById('bg-music');
    const toggleBtn = document.getElementById('music-toggle');
    const iconSvg = document.getElementById('music-icon-svg');
    if (!audio || !toggleBtn || !iconSvg) return;

    const ICON_PLAYING = '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8 8 0 0 1 0 12"/>';
    const ICON_MUTED = '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9l6 6M22 9l-6 6"/>';

    const reflectState = () => {
      iconSvg.innerHTML = audio.paused ? ICON_MUTED : ICON_PLAYING;
      toggleBtn.setAttribute('aria-label', audio.paused ? 'Bật nhạc nền' : 'Tắt nhạc nền');
    };

    const attemptAutoplay = () => {
      audio.play().then(reflectState).catch(() => {
        reflectState();
        // Most browsers block sound autoplay before any user gesture —
        // start playing on the first tap/click/keypress instead.
        const gestureEvents = ['click', 'touchstart', 'keydown'];
        const resume = () => {
          gestureEvents.forEach((evt) => document.removeEventListener(evt, resume));
          audio.play().then(reflectState).catch(() => {});
        };
        gestureEvents.forEach((evt) => document.addEventListener(evt, resume, { passive: true }));
      });
    };

    toggleBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(reflectState).catch(() => {});
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', reflectState);
    audio.addEventListener('pause', reflectState);

    reflectState();
    attemptAutoplay();
  })();

  // ===== COUNTDOWN =====
  const countdownEl = document.getElementById('countdown-clock');
  if (countdownEl) {
    const targetDate = new Date(countdownEl.dataset.weddingDate).getTime();
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');

    const pad = (n) => String(n).padStart(2, '0');

    const tick = () => {
      const diff = targetDate - Date.now();

      if (diff <= 0) {
        daysEl.textContent = hoursEl.textContent = minutesEl.textContent = secondsEl.textContent = '00';
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      daysEl.textContent = pad(days);
      hoursEl.textContent = pad(hours);
      minutesEl.textContent = pad(minutes);
      secondsEl.textContent = pad(seconds);
    };

    tick();
    var timer = setInterval(tick, 1000);
  }

  // ===== SCROLL / SNAP REVEAL =====
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ===== HORIZONTAL AUTO-SLIDING CAROUSELS =====
  function initCarousel(root) {
    const track = root.querySelector('.carousel');
    const dotsWrap = root.querySelector('.carousel-dots');
    if (!track || !dotsWrap) return;

    const items = Array.from(track.children);
    if (!items.length) return;

    // Scrolls the track horizontally only — never use scrollIntoView() here,
    // since its `block` option can also drag the outer vertical feed back to this slide.
    const scrollToItem = (index) => {
      const delta = items[index].getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({ left: track.scrollLeft + delta, behavior: 'smooth' });
    };

    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Ảnh ${i + 1}`);
      dot.addEventListener('click', () => scrollToItem(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    let currentIndex = 0;

    const closestIndex = () => {
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closest = 0;
      let min = Infinity;
      items.forEach((item, i) => {
        const r = item.getBoundingClientRect();
        const dist = Math.abs((r.left + r.width / 2) - center);
        if (dist < min) { min = dist; closest = i; }
      });
      return closest;
    };

    track.addEventListener('scroll', () => {
      currentIndex = closestIndex();
      dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }, { passive: true });

    let autoplayTimer = null;
    let userInteracting = false;
    let isSlideVisible = true;

    const startAutoplay = () => {
      clearInterval(autoplayTimer);
      autoplayTimer = setInterval(() => {
        if (userInteracting || !isSlideVisible) return;
        const next = (currentIndex + 1) % items.length;
        scrollToItem(next);
      }, 3800);
    };

    ['pointerdown', 'touchstart'].forEach((evt) => {
      track.addEventListener(evt, () => { userInteracting = true; }, { passive: true });
    });
    ['pointerup', 'touchend'].forEach((evt) => {
      track.addEventListener(evt, () => {
        setTimeout(() => { userInteracting = false; }, 3000);
      }, { passive: true });
    });

    // Pause autoplay whenever this carousel's slide has scrolled out of view,
    // so it can't tug the page's vertical scroll back to itself later.
    const parentSlide = root.closest('.slide');
    if (parentSlide && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { isSlideVisible = entry.isIntersecting; });
      }, { threshold: 0.6 }).observe(parentSlide);
    }

    startAutoplay();
  }

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);

  // ===== GIFT QR — bride / groom tabs =====
  const qrImage = document.getElementById('qr-image');
  const qrFallbackPath = document.getElementById('qr-fallback-path');
  const qrTabs = document.querySelectorAll('.qr-tab');

  if (qrImage) {
    const markBroken = () => qrImage.closest('.qr-frame').classList.add('is-broken');

    const loadQr = (src, label) => {
      const frame = qrImage.closest('.qr-frame');
      frame.classList.remove('is-broken');
      qrImage.src = src;
      qrImage.alt = `Mã QR mừng cưới ${label}`;
      if (qrFallbackPath) qrFallbackPath.textContent = src;
    };

    qrImage.addEventListener('error', markBroken);
    if (qrImage.complete && qrImage.naturalWidth === 0) markBroken();

    qrTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        qrTabs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        loadQr(tab.dataset.qrSrc, tab.dataset.qrLabel);
      });
    });
  }

  // ===== LIVE WISHES TICKER (reads the wishes Google Sheet via JSONP) =====
  (function initWishesFeed() {
    const feedEl = document.getElementById('wishes-feed');
    if (!feedEl) return;

    const SHEET_ID = '1dsgZl27P4VHeiq0QpEJD5_DP8hPYKLm_KO0BdG35roM';
    const GID = '1241714880';
    const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${GID}`;

    let wishes = [];
    let rotationIndex = 0;
    let isPageVisible = true;

    // The gviz endpoint has no CORS headers, so fetch() would be blocked —
    // load it as a <script> with a JSONP callback instead.
    function fetchWishesJsonp() {
      return new Promise((resolve, reject) => {
        const callbackName = `__wishesCb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
        const script = document.createElement('script');
        let settled = false;

        const cleanup = () => {
          delete window[callbackName];
          script.remove();
        };

        window[callbackName] = (json) => {
          settled = true;
          cleanup();
          resolve(json);
        };

        script.onerror = () => {
          if (!settled) { cleanup(); reject(new Error('wishes jsonp failed')); }
        };
        script.src = `${BASE_URL}&tqx=out:json;responseHandler:${callbackName}`;
        document.body.appendChild(script);

        setTimeout(() => {
          if (!settled) { cleanup(); reject(new Error('wishes jsonp timeout')); }
        }, 8000);
      });
    }

    function extractWishes(json) {
      if (!json || !json.table || !Array.isArray(json.table.rows)) return [];
      const labels = json.table.cols.map((c) => (c.label || '').toLowerCase());
      const nameIdx = labels.findIndex((l) => l.includes('tên') || l.includes('ten') || l.includes('name'));
      const msgIdx = labels.findIndex((l) => l.includes('chúc') || l.includes('chuc') || l.includes('message'));
      const ni = nameIdx === -1 ? 1 : nameIdx;
      const mi = msgIdx === -1 ? 2 : msgIdx;

      return json.table.rows
        .map((row) => {
          const cells = row.c || [];
          const name = cells[ni] && cells[ni].v != null ? String(cells[ni].v).trim() : '';
          const message = cells[mi] && cells[mi].v != null ? String(cells[mi].v).trim() : '';
          return { name, message };
        })
        .filter((w) => w.message);
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function showBubble(wish) {
      const bubble = document.createElement('div');
      bubble.className = 'wish-bubble';
      bubble.innerHTML = `<span class="wish-name">${escapeHtml(wish.name || 'Ẩn danh')}</span>${escapeHtml(wish.message)}`;
      feedEl.appendChild(bubble);

      while (feedEl.children.length > 3) {
        feedEl.removeChild(feedEl.firstChild);
      }

      requestAnimationFrame(() => bubble.classList.add('is-visible'));

      setTimeout(() => {
        bubble.classList.add('is-leaving');
        bubble.classList.remove('is-visible');
        setTimeout(() => bubble.remove(), 500);
      }, 5200);
    }

    function tick() {
      if (!wishes.length || !isPageVisible) return;
      showBubble(wishes[rotationIndex % wishes.length]);
      rotationIndex += 1;
    }

    async function refreshWishes() {
      try {
        const json = await fetchWishesJsonp();
        const list = extractWishes(json);
        if (list.length) wishes = list;
      } catch (e) {
        // network hiccup — keep showing whatever we already have
      }
    }

    document.addEventListener('visibilitychange', () => {
      isPageVisible = document.visibilityState === 'visible';
    });

    refreshWishes().then(() => {
      tick();
      setInterval(tick, 4200);
    });
    setInterval(refreshWishes, 15000);
  })();

  // ===== MODALS =====
  document.querySelectorAll('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById(btn.dataset.openModal);
      if (modal) modal.classList.add('is-open');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => {
      const modal = el.closest('.modal');
      if (modal) modal.classList.remove('is-open');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.is-open').forEach((m) => m.classList.remove('is-open'));
    }
  });
});
