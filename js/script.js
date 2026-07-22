document.addEventListener('DOMContentLoaded', () => {

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

    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Ảnh ${i + 1}`);
      dot.addEventListener('click', () => {
        items[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
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

    const startAutoplay = () => {
      clearInterval(autoplayTimer);
      autoplayTimer = setInterval(() => {
        if (userInteracting) return;
        const next = (currentIndex + 1) % items.length;
        items[next].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
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

    startAutoplay();
  }

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);

  // ===== GIFT QR FALLBACK =====
  const qrImage = document.getElementById('qr-image');
  if (qrImage) {
    const markBroken = () => qrImage.closest('.qr-frame').classList.add('is-broken');
    if (qrImage.complete && qrImage.naturalWidth === 0) {
      markBroken();
    } else {
      qrImage.addEventListener('error', markBroken);
    }
  }

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
