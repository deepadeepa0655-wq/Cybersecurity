// Level 2: Phishing Detection Email Catcher
const Level2_Phishing = (function() {
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
          <span class="lvl-tag">LEVEL 2</span>
          <span class="lvl-title">✉️ PHISHING DETECTION</span>
        </div>
        <p class="game-instruction">Catch helpful messages. Avoid surprise prizes and requests for secrets.</p>

        <div class="mission-objective-progress">
          <div class="objective-progress-heading"><span>SAFE MESSAGES</span><strong id="mailProgressText">0 / 10</strong></div>
          <div class="objective-progress-track" role="progressbar" aria-label="Trusted messages intercepted" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0"><div class="objective-progress-fill" id="mailProgressFill"></div></div>
        </div>
        
        <div class="sky-arena" id="skyArena">
          <div class="city-skyline"></div>
          <div class="catcher-character" id="catcher">
            <div class="net-tool">🛡️</div>
          <div class="gateway-label">INBOX</div>
          </div>
        </div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">SAFE CAUGHT:</span> <span class="val" id="caughtVal">0 / 10</span></div>
          <div class="stat-item"><span class="lbl">SCORE:</span> <span class="val" id="scoreVal">0000</span></div>
          <div class="stat-item"><span class="lbl">STREAK:</span> <span class="val" id="comboVal">x0</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="round-feedback" id="roundFeedback" aria-live="polite"><span class="round-feedback-dot"></span><span id="roundFeedbackText">Read each sender before you intercept.</span></div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Pause when a message rushes you or asks for a secret.
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const arena = document.getElementById("skyArena");
    const catcher = document.getElementById("catcher");
    const caughtVal = document.getElementById("caughtVal");
    const scoreVal = document.getElementById("scoreVal");
    const comboVal = document.getElementById("comboVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");
    const progressFill = document.getElementById("mailProgressFill");
    const progressText = document.getElementById("mailProgressText");
    const progressTrack = progressFill?.parentElement;
    const feedback = document.getElementById("roundFeedback");
    const feedbackText = document.getElementById("roundFeedbackText");

    let catcherX = arena.clientWidth / 2;
    let targetX = catcherX;
    let caught = 0;
    let target = 10;
    let lives = 3;
    let score = 0;
    let combo = 0;
    let timeLeft = window.CyberGameRuntime?.getTimeLimitSeconds?.(150) || 150;
    timeVal.textContent = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
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

    function updateRoundScore() {
      scoreVal.textContent = String(score).padStart(4, "0");
      comboVal.textContent = `x${combo}`;
      comboVal.classList.toggle("combo-active", combo >= 3);
    }

    function setFeedback(message, tone = "neutral") {
      feedbackText.textContent = message;
      feedback.className = `round-feedback ${tone}`;
    }

    function pulseCatcher(result) {
      catcher.classList.remove("catcher-success", "catcher-danger");
      void catcher.offsetWidth;
      catcher.classList.add(result === "success" ? "catcher-success" : "catcher-danger");
    }

    updateLivesDisplay();
    updateRoundScore();

    pointerHandler = (e) => {
      const rect = arena.getBoundingClientRect();
      targetX = clampCatcherX(e.clientX - rect.left);
    };
    arena.addEventListener("pointermove", pointerHandler, { passive: true });

    const spawnItem = () => {
      const isSafe = Math.random() < 0.65;
      const itemEl = document.createElement("div");
      itemEl.className = "winged-email " + (isSafe ? "safe" : "phish");
      const messages = isSafe
        ? [{from:"Game Club",address:"games@club.example",subject:"Friday game night",preview:"See you in the clubhouse!"},{from:"School Library",address:"books@library.example",subject:"Your reading list is ready",preview:"The books you saved are waiting."},{from:"Class Team",address:"class@school.example",subject:"Art day tomorrow",preview:"Bring your favorite colors."}]
        : [{from:"Free Coins",address:"coins@free-rewards.example",subject:"Claim free game coins!",preview:"Sign in with your password to collect now."},{from:"Account Helper",address:"help@game-login.example",subject:"Your account will close",preview:"Enter your password right away."},{from:"Unknown Player",address:"winner@surprise.example",subject:"You won a mystery prize!",preview:"Open this file to see your prize."}];
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
            combo++;
            const points = 25 + Math.min(combo, 5) * 5;
            score += points;
            Sound.good();
            caughtVal.textContent = `${caught} / ${target}`;
            updateRoundScore();
            if (progressFill) progressFill.style.width = `${(caught / target) * 100}%`;
            if (progressText) progressText.textContent = `${caught} / ${target} TRUSTED MESSAGES`;
            if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(caught));
            setFeedback(combo >= 3 ? `CLEAN INTERCEPT · ${combo} IN A ROW` : "CLEAN INTERCEPT · TRUSTED MESSAGE", "success");
            pulseCatcher("success");
            createSplash(itemRect.left, itemRect.top, `+${points} · x${combo}`, "#38bdf8");
            if (caught >= target) {
              endGame(true);
              return;
            }
          } else {
            lives--;
            combo = 0;
            score = Math.max(0, score - 25);
            Sound.bad();
            updateLivesDisplay();
            updateRoundScore();
            setFeedback("PHISHING LURE INTERCEPTED · STREAK LOST", "danger");
            pulseCatcher("danger");
            createSplash(itemRect.left, itemRect.top, "TRAP · −25", "#ef4444");
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

        if (item.y > arenaRect.height + 140) {
          if (item.isSafe) {
            if (combo > 0) {
              combo = 0;
              updateRoundScore();
            }
            setFeedback("TRUSTED MESSAGE MISSED · REPOSITION FOR THE NEXT ONE", "neutral");
          } else {
            score += 15;
            updateRoundScore();
            setFeedback("PHISHING LURE AVOIDED · +15", "success");
            createSplash(itemRect.left, itemRect.top, "LURE AVOIDED +15", "#7ceac5");
          }
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

    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - speedScale());
      const displayTime = Math.ceil(timeLeft);
      const mins = String(Math.floor(displayTime / 60)).padStart(2, "0");
      const secs = String(displayTime % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(caught >= target);
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
          levelId: 2,
          won: won,
          score: won ? Math.max(300, score) : score,
          title: "Level 2: Phishing Detection",
          message: won 
            ? "Phishing attack intercepted! You successfully filtered out weaponized lures and safeguarded identity credentials." 
            : "Phishing lure triggered! Remember: genuine organizations never request credentials via email."
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
