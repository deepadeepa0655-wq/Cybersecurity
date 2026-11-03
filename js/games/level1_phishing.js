// Level 1: Phishing Email Catcher
const Level1_Phishing = (function() {
  let timerInterval = null;
  let spawnInterval = null;
  let animFrame = null;
  let container = null;
  let onCompleteCallback = null;
  let keyHandler = null;
  let keyUpHandler = null;
  let pointerHandler = null;
  let configChangeHandler = null;

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level1-theme">
        <div class="level-badge-header blue">
          <span class="lvl-tag">LEVEL 1</span>
          <span class="lvl-title">✉️ PHISHING EMAIL CATCHER</span>
        </div>
        <p class="game-instruction">Route trusted messages through the secure gateway. Use your mouse or <kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd>; inspect the sender, subject, and preview.</p>
        
        <div class="sky-arena" id="skyArena">
          <div class="city-skyline"></div>
          <div class="catcher-character" id="catcher">
            <div class="net-tool">🛡️</div>
            <div class="gateway-label">MAIL GATEWAY</div>
          </div>
        </div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">SAFE CAUGHT:</span> <span class="val" id="caughtVal">0 / 10</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">01:20</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Always check the sender's full address and domain before clicking!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const arena = document.getElementById("skyArena");
    const catcher = document.getElementById("catcher");
    const caughtVal = document.getElementById("caughtVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let catcherX = arena.clientWidth / 2;
    let targetX = catcherX;
    let caught = 0;
    let target = 10;
    let lives = 3;
    let timeLeft = 80;
    let items = [];
    const pressedKeys = new Set();
    let previousFrame = 0;

    function speedScale() {
      return window.CyberGameRuntime?.getSpeedScale?.() || 1;
    }

    function clampCatcherX(x) {
      const halfWidth = catcher.offsetWidth / 2;
      return Math.max(halfWidth, Math.min(arena.clientWidth - halfWidth, x));
    }

    function updateLivesDisplay() {
      livesVal.textContent = "❤️".repeat(Math.max(0, lives));
    }
    updateLivesDisplay();

    // Pointer input updates a target; the gateway follows it with smooth, physical movement.
    pointerHandler = (e) => {
      const rect = arena.getBoundingClientRect();
      targetX = clampCatcherX(e.clientX - rect.left);
    };
    arena.addEventListener("pointermove", pointerHandler, { passive: true });

    // Spawning items
    const spawnItem = () => {
      const isSafe = Math.random() < 0.65;
      const itemEl = document.createElement("div");
      itemEl.className = "winged-email " + (isSafe ? "safe" : "phish");
      const messages = isSafe
        ? [{from:"IT Service Desk",address:"helpdesk@northstar.example",subject:"Scheduled account maintenance",preview:"Routine update window: Thursday, 22:00–23:00."},{from:"Maya Chen",address:"maya.chen@northstar.example",subject:"Updated project brief",preview:"I added the latest notes to the shared document."},{from:"Cloud Storage",address:"notify@cloud-storage.example",subject:"Your shared folder is ready",preview:"The folder you were invited to is now available."}]
        : [{from:"Northstar Security",address:"security@northstar-alerts.example",subject:"Urgent: mailbox expires today",preview:"Sign in immediately to prevent account suspension."},{from:"Payroll Team",address:"payroll@northstar-payroll.co",subject:"Review your salary adjustment",preview:"Open the attached form and confirm your bank details."},{from:"IT Support",address:"support@northstar-login.example",subject:"Verify password to restore access",preview:"Your mailbox will be disabled unless you verify now."}];
      const message = messages[Math.floor(Math.random() * messages.length)];
      itemEl.innerHTML = `<span class="mail-sender"></span><span class="mail-address"></span><span class="mail-subject"></span><span class="mail-preview"></span>`;
      itemEl.querySelector('.mail-sender').textContent = message.from;
      itemEl.querySelector('.mail-address').textContent = message.address;
      itemEl.querySelector('.mail-subject').textContent = message.subject;
      itemEl.querySelector('.mail-preview').textContent = message.preview;
      
      const cardHalfWidth = itemEl.offsetWidth / 2 || 125;
      const arenaWidth = arena.clientWidth;
      const minX = Math.min(cardHalfWidth, arenaWidth / 2);
      const maxX = Math.max(minX, arenaWidth - cardHalfWidth);
      const startX = minX + Math.random() * (maxX - minX);
      itemEl.style.left = startX + "px";
      itemEl.style.top = "-130px";
      arena.appendChild(itemEl);

      items.push({
        el: itemEl,
        x: startX,
        y: -130,
        vx: (Math.random() - 0.5) * 22,
        vy: 38 + Math.random() * 22 + caught * 0.7,
        gravity: 82 + Math.random() * 24,
        isSafe: isSafe
      });
    };

    function startSpawnLoop() {
      clearInterval(spawnInterval);
      spawnInterval = setInterval(spawnItem, 850 / speedScale());
    }
    startSpawnLoop();
    configChangeHandler = () => startSpawnLoop();
    window.addEventListener("gameconfigchange", configChangeHandler);

    // Game Loop
    function loop(timestamp = 0) {
      const delta = previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.05) : 0;
      previousFrame = timestamp;
      const simDelta = delta * speedScale();
      const moveDirection = (pressedKeys.has("ArrowRight") || pressedKeys.has("d") || pressedKeys.has("D") ? 1 : 0)
        - (pressedKeys.has("ArrowLeft") || pressedKeys.has("a") || pressedKeys.has("A") ? 1 : 0);
      if (moveDirection) targetX = clampCatcherX(targetX + moveDirection * 520 * simDelta);
      catcherX += (targetX - catcherX) * (1 - Math.exp(-13 * simDelta));
      catcherX = clampCatcherX(catcherX);
      catcher.style.left = catcherX + "px";

      const arenaRect = arena.getBoundingClientRect();
      const catcherRect = catcher.getBoundingClientRect();

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.vy += item.gravity * simDelta;
        item.y += item.vy * simDelta;
        item.x += item.vx * simDelta;
        const itemHalfWidth = item.el.offsetWidth / 2;
        if (item.x < itemHalfWidth || item.x > arena.clientWidth - itemHalfWidth) {
          item.x = Math.max(itemHalfWidth, Math.min(arena.clientWidth - itemHalfWidth, item.x));
          item.vx *= -0.72;
        }
        item.el.style.left = item.x + "px";
        item.el.style.top = item.y + "px";
        item.el.style.transform = `translateX(-50%) rotate(${Math.max(-5, Math.min(5, item.vx * 0.16))}deg)`;

        // Collision with catcher
        const itemRect = item.el.getBoundingClientRect();
        const hit = !(
          itemRect.right < catcherRect.left ||
          itemRect.left > catcherRect.right ||
          itemRect.bottom < catcherRect.top ||
          itemRect.top > catcherRect.bottom
        );

        if (hit) {
          if (item.isSafe) {
            caught++;
            Sound.good();
            caughtVal.textContent = `${caught} / ${target}`;
            createSplash(itemRect.left, itemRect.top, "+25 SAFE!", "#38bdf8");
            if (caught >= target) {
              endGame(true);
              return;
            }
          } else {
            lives--;
            Sound.bad();
            updateLivesDisplay();
            createSplash(itemRect.left, itemRect.top, "⚠️ PHISHING!", "#ef4444");
            arena.classList.add("danger-flash");
            setTimeout(() => arena.classList.remove("danger-flash"), 250);
            if (lives <= 0) {
              endGame(false);
              return;
            }
          }
          item.el.remove();
          items.splice(i, 1);
          continue;
        }

        // Out of bounds
        if (item.y > arenaRect.height + 140) {
          item.el.remove();
          items.splice(i, 1);
        }
      }

      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);

    keyHandler = (event) => {
      if (!["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) return;
      event.preventDefault();
      pressedKeys.add(event.key);
    };
    keyUpHandler = (event) => pressedKeys.delete(event.key);
    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keyup", keyUpHandler);

    // Timer
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) {
        endGame(caught >= target);
      }
    }, 1000);

    function createSplash(x, y, text, color) {
      const splash = document.createElement("div");
      splash.className = "hit-splash";
      splash.textContent = text;
      splash.style.color = color;
      splash.style.left = x + "px";
      splash.style.top = y + "px";
      document.body.appendChild(splash);
      setTimeout(() => splash.remove(), 700);
    }

    function endGame(won) {
      cleanup();
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 1,
          won: won,
          score: won ? 250 : 50,
          title: "Level 1: Phishing Email Catcher",
          message: won 
            ? "Outstanding reflexes Agent! You protected the organization from fraudulent lures." 
            : "Malicious phishing payload executed! Remember to inspect email senders carefully."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    cancelAnimationFrame(animFrame);
    if (keyHandler) document.removeEventListener("keydown", keyHandler);
    if (keyUpHandler) document.removeEventListener("keyup", keyUpHandler);
    if (configChangeHandler) window.removeEventListener("gameconfigchange", configChangeHandler);
    if (pointerHandler) document.getElementById("skyArena")?.removeEventListener("pointermove", pointerHandler);
    keyHandler = null;
    keyUpHandler = null;
    configChangeHandler = null;
    pointerHandler = null;
  }

  return { init, cleanup };
})();
