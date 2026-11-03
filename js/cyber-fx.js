/**
 * CyberFX — Lightweight, Zero-Dependency Cyber Animation & FX Engine
 * Designed for High-Impact Visuals with LESS CODING.
 * 
 * Usage Examples:
 *   CyberFX.pop(element);
 *   CyberFX.shake(element);
 *   CyberFX.glitch(element);
 *   CyberFX.shieldDeflect(element);
 *   CyberFX.confetti();
 *   CyberFX.countUp(scoreElement, 0, 250);
 *   CyberFX.toast('System firewall breach intercepted!', 'danger');
 *   
 * Or declarative HTML (Zero JavaScript):
 *   <button data-fx="pop">Click Me</button>
 *   <div class="anim-cyber-pulse">Always Pulsing</div>
 */

const CyberFX = (function() {
  'use strict';

  let toastDock = null;

  // 1. One-Shot Class Helper with auto-removal on animationend
  function triggerAnimation(target, className) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.classList.remove(className);
    // Force DOM reflow to allow re-triggering the same animation consecutively
    void el.offsetWidth;
    el.classList.add(className);

    function cleanup() {
      el.classList.remove(className);
      el.removeEventListener('animationend', cleanup);
    }
    el.addEventListener('animationend', cleanup);
  }

  // 2. Element Shake (Error / Warning)
  function shake(target) {
    triggerAnimation(target, 'anim-shake');
  }

  // 3. Element Pop (Click / Upgrade / Win)
  function pop(target) {
    triggerAnimation(target, 'anim-pop');
  }

  // 4. Tada Celebration (Big Unlock)
  function tada(target) {
    triggerAnimation(target, 'anim-tada');
  }

  // 5. Chromatic Glitch
  function glitch(target) {
    triggerAnimation(target, 'anim-glitch');
  }

  // 6. Shield Deflect Wave
  function shieldDeflect(target) {
    triggerAnimation(target, 'anim-shield-deflect');
  }

  // 7. HUD Toast Notification System
  function toast(message, type = 'info', duration = 3200) {
    if (!toastDock) {
      toastDock = document.createElement('div');
      toastDock.className = 'cyber-toast-dock';
      toastDock.setAttribute('role', 'region');
      toastDock.setAttribute('aria-label', 'Notifications');
      toastDock.setAttribute('aria-live', 'off');
      document.body.appendChild(toastDock);
    }

    const icons = {
      success: '✅',
      danger: '⚠️',
      warning: '⚡',
      info: '🛡️'
    };
    const safeType = Object.prototype.hasOwnProperty.call(icons, type) ? type : 'info';
    const toastEl = document.createElement('div');
    toastEl.className = `cyber-toast toast-${safeType}`;
    toastEl.setAttribute('role', safeType === 'danger' ? 'alert' : 'status');
    toastEl.setAttribute('aria-live', safeType === 'danger' ? 'assertive' : 'polite');
    toastEl.setAttribute('aria-atomic', 'true');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = icons[safeType];
    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = String(message ?? '').slice(0, 240);
    toastEl.append(icon, text);

    toastDock.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.add('cyber-toast-fadeout');
      setTimeout(() => {
        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      }, 350);
    }, duration);
  }

  // 8. Smooth Rolling Score Counter
  function countUp(element, startVal = 0, endVal = 100, duration = 1000) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const start = Number(startVal) || 0;
    const end = Number(endVal) || 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quartic curve for a satisfying fast start and gentle snap
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (end - start) * easeProgress);

      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = end.toLocaleString();
        pop(el);
      }
    }

    requestAnimationFrame(updateCounter);
  }

  // 9. Cyber Confetti Particle Burst (Celebration)
  function confetti(options = {}) {
    const particleCount = options.count || 65;
    const colors = options.colors || ['#00e5ff', '#b026ff', '#39ff14', '#ff3860', '#ffbe0b'];

    const canvas = document.createElement('canvas');
    canvas.className = 'cyber-confetti-canvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2 + 50,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 6,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        opacity: 1
      });
    }

    let animFrame;
    function render() {
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.opacity > 0 && p.y < height) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (alive) {
        animFrame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animFrame);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    }

    render();
  }

  // 10. Matrix Digital Stream Background Engine (Ultra-lightweight)
  function matrixRain(canvasTarget) {
    const canvas = typeof canvasTarget === 'string' ? document.querySelector(canvasTarget) : canvasTarget;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.offsetWidth || 300);
    let height = (canvas.height = canvas.offsetHeight || 300);

    const characters = '01ABCDEF01アイウエオカキクケコサシスセソタチツテト';
    const fontSize = 12;
    const columns = Math.floor(width / fontSize);
    const drops = Array(columns).fill(1);

    let animationId = null;

    function draw() {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.12)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00e5ff';
      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    }

    draw();

    return {
      stop: () => cancelAnimationFrame(animationId),
      resize: (newW, newH) => {
        width = canvas.width = newW;
        height = canvas.height = newH;
      }
    };
  }

  // 11. Declarative Auto-Binder (Zero JavaScript from developer)
  function initAuto() {
    // Pop on click
    document.querySelectorAll('[data-fx="pop"]').forEach(el => {
      el.addEventListener('click', () => pop(el));
    });

    // Shake on click
    document.querySelectorAll('[data-fx="shake"]').forEach(el => {
      el.addEventListener('click', () => shake(el));
    });

    // Glitch on hover
    document.querySelectorAll('[data-fx="glitch"]').forEach(el => {
      el.addEventListener('mouseenter', () => glitch(el));
    });

    // Auto counter on scroll/view
    document.querySelectorAll('[data-fx="counter"]').forEach(el => {
      const target = Number(el.dataset.target) || 0;
      countUp(el, 0, target, 1200);
    });
  }

  // Auto-bind once DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAuto);
    } else {
      initAuto();
    }
  }

  // Public API
  return {
    shake,
    pop,
    tada,
    glitch,
    shieldDeflect,
    toast,
    countUp,
    confetti,
    matrixRain,
    initAuto
  };
})();

// Attach to window if running in browser
if (typeof window !== 'undefined') {
  window.CyberFX = CyberFX;
}
