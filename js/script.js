if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.addEventListener('DOMContentLoaded', () => {

  // Always start on the hero slide — guards against mobile browsers
  // restoring a previous scroll offset inside the .feed container.
  const feed = document.getElementById('feed');
  if (feed) feed.scrollTop = 0;

  // ===== GUEST PERSONALIZATION (?to=Ten+Khach in the link) =====
  (function initGuestName() {
    const guestName = new URLSearchParams(window.location.search).get('to');
    if (!guestName || !guestName.trim()) return;
    const name = guestName.trim().slice(0, 60);

    const heroGuest = document.getElementById('hero-guest');
    const heroGuestName = document.getElementById('hero-guest-name');
    if (heroGuest && heroGuestName) {
      heroGuestName.textContent = name;
      heroGuest.hidden = false;
    }

    const ticketPassenger = document.getElementById('ticket-passenger');
    if (ticketPassenger) ticketPassenger.textContent = name;

    document.title = `Thiệp mời ${name} — Ngọc Tuyền & Lan Anh`;
  })();

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

  // ===== FLY-IN TEXT STAGGER (assigns --fly-i per .reveal group so lines cascade in) =====
  document.querySelectorAll('.reveal').forEach((root) => {
    const group = root.matches('.fly-in-l, .fly-in-r') ? [root] : Array.from(root.querySelectorAll('.fly-in-l, .fly-in-r'));
    group.forEach((el, i) => el.style.setProperty('--fly-i', i));
  });

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

  // ===== AUTO SCROLL (slow ambient scroll once past the hero slide) =====
  (function initAutoScroll() {
    const hero = document.getElementById('hero');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!feed || !hero || prefersReduced) return;

    const SPEED = 20; // px per second — slow, ambient pace
    const RESUME_DELAY = 2500; // ms of inactivity before auto-scroll resumes

    let lastTime = null;
    let paused = false;
    let resumeTimer = null;
    // scrollTop only stores whole pixels, so sub-pixel per-frame deltas
    // (20px/s at 60fps is ~0.3px/frame) would round away to nothing if we
    // accumulated directly on feed.scrollTop — track our own float instead.
    let virtualTop = feed.scrollTop;

    const isOutsideHero = () => feed.scrollTop >= hero.offsetHeight - 4;
    const isAtBottom = () => feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 2;
    const isModalOpen = () => document.querySelector('.modal.is-open');

    const step = (time) => {
      if (lastTime === null) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // something other than us moved the scroll position (a manual drag,
      // a thumb-click's scrollIntoView, tapping a nav link) — resync instead
      // of fighting it or snapping back to our stale position next frame
      if (Math.abs(feed.scrollTop - virtualTop) > 1) {
        virtualTop = feed.scrollTop;
      } else if (!paused && isOutsideHero() && !isAtBottom() && !isModalOpen()) {
        virtualTop += SPEED * dt;
        feed.scrollTop = virtualTop;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    const pause = () => {
      paused = true;
      lastTime = null;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, RESUME_DELAY);
    };
    ['wheel', 'touchstart', 'touchmove', 'pointerdown'].forEach((evt) => {
      feed.addEventListener(evt, pause, { passive: true });
    });
  })();

  // ===== PASSPORT COVER (tap or swipe left to open) =====
  (function initPassportCover() {
    const wrap = document.querySelector('.passport-wrap');
    const cover = document.getElementById('passport-cover');
    if (!wrap || !cover) return;

    const open = () => wrap.classList.add('is-open');
    cover.addEventListener('click', open);

    let touchStartX = 0;
    let touchStartY = 0;
    cover.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    cover.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (dx < -30 && Math.abs(dx) > Math.abs(dy)) open();
    }, { passive: true });
  })();

  // ===== GALLERY COVER AUTO-SLIDE (before opening the full album) =====
  (function initGalleryAutoSlide() {
    const gallerySlide = document.getElementById('gallery');
    const cover = document.querySelector('.gallery-cover');
    const img = cover ? cover.querySelector('img') : null;
    const caption = cover ? cover.querySelector('.gallery-cover-caption') : null;
    const thumbs = Array.from(document.querySelectorAll('.album-thumb'));
    if (!gallerySlide || !img || !caption || !thumbs.length) return;

    const FADE_MS = 650;
    const HOLD_MS = 4000;
    let index = 0;
    let timer = null;

    const showNext = () => {
      index = (index + 1) % thumbs.length;
      const thumb = thumbs[index];

      img.style.opacity = '0';
      setTimeout(() => {
        img.src = thumb.dataset.src;
        img.alt = thumb.dataset.caption;
        caption.innerHTML = `<span>${thumb.dataset.stop}</span>${thumb.dataset.caption}`;
        const reveal = () => { img.style.opacity = '1'; };
        if (img.decode) img.decode().then(reveal).catch(reveal);
        else reveal();
      }, FADE_MS);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !timer) {
            timer = setInterval(showNext, HOLD_MS);
            observer.disconnect();
          }
        });
      }, { threshold: 0.3 });
      observer.observe(gallerySlide);
    } else {
      timer = setInterval(showNext, HOLD_MS);
    }
  })();

  // ===== ALBUM VIEWER (full-screen photo + thumbnail strip) =====
  (function initAlbumViewer() {
    const mainImg = document.getElementById('album-viewer-image');
    const caption = document.getElementById('album-viewer-caption');
    const thumbs = Array.from(document.querySelectorAll('.album-thumb'));
    const modal = document.getElementById('album-modal');
    const stage = document.querySelector('.album-viewer-main');
    if (!mainImg || !caption || !thumbs.length) return;

    let activeIndex = Math.max(0, thumbs.findIndex((t) => t.classList.contains('is-active')));

    const selectThumb = (index) => {
      activeIndex = (index + thumbs.length) % thumbs.length;
      const thumb = thumbs[activeIndex];

      mainImg.src = thumb.dataset.src;
      caption.innerHTML = `<span>${thumb.dataset.stop}</span>${thumb.dataset.caption}`;

      thumbs.forEach((t, i) => {
        t.classList.toggle('is-active', i === activeIndex);
        t.setAttribute('aria-selected', String(i === activeIndex));
      });
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    };

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => selectThumb(i));
    });

    // arrow-key navigation while the viewer is open
    document.addEventListener('keydown', (e) => {
      if (!modal || !modal.classList.contains('is-open')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); selectThumb(activeIndex + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); selectThumb(activeIndex - 1); }
    });

    // swipe left/right on the photo to move between images
    if (stage) {
      let touchStartX = 0;
      let touchStartY = 0;

      stage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
      }, { passive: true });

      stage.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        selectThumb(activeIndex + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }
  })();

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

  // ===== FLOATING HEARTS ("Thả tim") =====
  (function initHearts() {
    const heartBtn = document.getElementById('heart-btn');
    const heartIcon = document.getElementById('heart-icon');
    const layer = document.getElementById('hearts-layer');
    const frame = document.querySelector('.app-frame');
    if (!heartBtn || !layer) return;

    const HEART_PATH = 'M12 21s-6.72-4.35-9.43-8.49C.4 9.5 1.5 5.8 5 5c2.2-.5 4 .8 5 2.2C11 5.8 12.8 4.5 15 5c3.5.8 4.6 4.5 2.43 7.51C18.72 16.65 12 21 12 21z';
    const COLORS = ['#ff6b81', '#ff8fa3', '#e6c76a', '#c9a227'];

    function spawnHeart() {
      // Burst outward from the center of the screen (the app frame), not the button —
      // reads as a fireworks-style heart burst instead of a trail from one corner.
      const originRect = (frame || document.body).getBoundingClientRect();
      const startX = originRect.left + originRect.width / 2;
      const startY = originRect.top + originRect.height / 2;

      const size = 16 + Math.random() * 18;
      // Spread across the upper half-circle (0 = right, 90° = straight up, 180° = left)
      // so every heart drifts outward and up, never down.
      const angle = Math.random() * Math.PI;
      const spread = Math.min(window.innerWidth, window.innerHeight) * 0.5;
      const burstDist = 60 + Math.random() * spread * 0.5;
      const burstX = Math.round(Math.cos(angle) * burstDist);
      const burstY = Math.round(-Math.sin(angle) * burstDist);
      const driftX = Math.round(burstX * 1.5);
      const driftY = Math.round(burstY * 1.6 - (160 + Math.random() * 220));
      const rotStart = Math.round((Math.random() - 0.5) * 30);
      const rotEnd = rotStart + Math.round((Math.random() - 0.5) * 90);
      const duration = (1.9 + Math.random() * 1.3).toFixed(2);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      const heart = document.createElement('span');
      heart.className = 'heart-particle';
      heart.style.left = `${startX - size / 2}px`;
      heart.style.top = `${startY - size / 2}px`;
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;
      heart.style.color = color;
      heart.style.animationDuration = `${duration}s`;
      heart.style.setProperty('--heart-burst-x', `${burstX}px`);
      heart.style.setProperty('--heart-burst-y', `${burstY}px`);
      heart.style.setProperty('--heart-drift-x', `${driftX}px`);
      heart.style.setProperty('--heart-drift-y', `${driftY}px`);
      heart.style.setProperty('--heart-rot-start', `${rotStart}deg`);
      heart.style.setProperty('--heart-rot-end', `${rotEnd}deg`);
      heart.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${HEART_PATH}"/></svg>`;

      layer.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove());
    }

    heartBtn.addEventListener('click', () => {
      if (heartIcon) {
        heartIcon.classList.remove('is-pulsing');
        void heartIcon.offsetWidth;
        heartIcon.classList.add('is-pulsing');
      }
      const count = 14 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        setTimeout(spawnHeart, i * 60);
      }
    });
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

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && feed) feed.scrollTop = 0;
  });
});
