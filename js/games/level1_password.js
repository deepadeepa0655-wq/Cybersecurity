// Level 1: Cyber Sprint — collect the four passphrase tokens and reach the vault.
const Level1_Password = (function() {
  let timerInterval = null;
  let animFrame = null;
  let container = null;
  let onCompleteCallback = null;
  let keyHandler = null;
  let touchControls = null;
  let touchControlHandler = null;

  const tokenTypes = [
    { id: "upper", glyph: "A", label: "UPPERCASE" },
    { id: "lower", glyph: "a", label: "LOWERCASE" },
    { id: "num", glyph: "7", label: "NUMBER" },
    { id: "spec", glyph: "#", label: "SYMBOL" }
  ];

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level4-theme cyber-sprint-game">
        <div class="level-badge-header amber">
          <span class="lvl-tag">LEVEL 1 · RACE</span>
          <span class="lvl-title">🏁 CYBER SPRINT: TOKEN RUN</span>
        </div>
        <p class="game-instruction">Switch lanes with <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>, and jump with <kbd>Space</kbd>. On touch screens, use the controls below. Collect all four token types, then reach the vault.</p>

        <div class="mission-objective-progress sprint-objectives">
          <div class="sprint-objective-row">
            <div class="objective-progress-heading"><span>PASSPHRASE TOKENS</span><strong id="runnerProgressText">0 / 4 SECURED</strong></div>
            <div class="objective-progress-track" role="progressbar" aria-label="Passphrase tokens secured" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0"><div class="objective-progress-fill" id="runnerProgressFill"></div></div>
          </div>
          <div class="sprint-objective-row">
            <div class="objective-progress-heading"><span>VAULT DISTANCE</span><strong id="vaultDistanceText">0 / 650 M</strong></div>
            <div class="objective-progress-track" role="progressbar" aria-label="Distance to the vault" aria-valuemin="0" aria-valuemax="650" aria-valuenow="0"><div class="objective-progress-fill distance-fill" id="vaultDistanceFill"></div></div>
          </div>
        </div>

        <div class="runner-race-arena" id="runnerArena" aria-label="Three-lane cyber sprint track">
          <div class="runner-city-glow"></div>
          <div class="runner-race-road" id="runnerTrack">
            <div class="runner-lane-divider divider-one"></div>
            <div class="runner-lane-divider divider-two"></div>
            <div class="runner-lane-glow" id="activeLaneGlow"></div>
            <div class="runner-vault-gate" id="keyGoal"><span class="vault-gate-icon">🔐</span><span>SECURE VAULT</span></div>
            <div class="runner-object-layer" id="runnerObjectLayer"></div>
            <div class="runner-hero running" id="heroRunner" aria-label="Runner">🏃</div>
            <div class="runner-road-distance" id="roadDistanceMark">0 M</div>
          </div>
        </div>

        <div class="mobile-touch-controls" aria-label="Sprint movement controls">
          <button type="button" data-sprint-action="left" aria-label="Move one lane left">◀</button>
          <button type="button" data-sprint-action="jump" aria-label="Jump">JUMP</button>
          <button type="button" data-sprint-action="right" aria-label="Move one lane right">▶</button>
        </div>

        <div class="runner-token-deck" aria-label="Collected passphrase tokens">
          <div class="runner-token-deck-title"><span>VAULT KEY BUILD</span><span>FOUR TOKEN TYPES REQUIRED</span></div>
          <div class="runner-token-slots">
            <div class="runner-token-slot" data-token="upper"><span>UPPERCASE</span><strong class="slot" id="s0">◌</strong></div>
            <div class="runner-token-slot" data-token="lower"><span>LOWERCASE</span><strong class="slot" id="s1">◌</strong></div>
            <div class="runner-token-slot" data-token="num"><span>NUMBER</span><strong class="slot" id="s2">◌</strong></div>
            <div class="runner-token-slot" data-token="spec"><span>SYMBOL</span><strong class="slot" id="s3">◌</strong></div>
          </div>
        </div>

        <div class="game-footer-stats runner-race-stats">
          <div class="stat-item"><span class="lbl">TOKENS</span><span class="val" id="collectedVal">0 / 4</span></div>
          <div class="stat-item"><span class="lbl">RACE SCORE</span><span class="val" id="runnerScoreVal">0000</span></div>
          <div class="stat-item"><span class="lbl">DISTANCE</span><span class="val" id="distanceVal">0 M</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT</span><span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">SHIELDS</span><span class="val" id="livesVal">♥♥♥</span></div>
        </div>

        <div class="round-feedback" id="runnerFeedback" aria-live="polite"><span class="round-feedback-dot"></span><span id="runnerFeedbackText">Race is live. Choose your lane and watch the road.</span></div>
        <div class="game-tip-banner">💡 <strong>RACE TIP:</strong> Coins contain one password character type. Repeated coins add score; malware costs a shield unless you jump or change lanes.</div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const arena = document.getElementById("runnerArena");
    const track = document.getElementById("runnerTrack");
    const objectLayer = document.getElementById("runnerObjectLayer");
    const hero = document.getElementById("heroRunner");
    const laneGlow = document.getElementById("activeLaneGlow");
    const keyGoal = document.getElementById("keyGoal");
    const collectedVal = document.getElementById("collectedVal");
    const scoreVal = document.getElementById("runnerScoreVal");
    const distanceVal = document.getElementById("distanceVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");
    const progressFill = document.getElementById("runnerProgressFill");
    const progressText = document.getElementById("runnerProgressText");
    const progressTrack = progressFill.parentElement;
    const distanceFill = document.getElementById("vaultDistanceFill");
    const distanceText = document.getElementById("vaultDistanceText");
    const roadDistanceMark = document.getElementById("roadDistanceMark");
    const feedback = document.getElementById("runnerFeedback");
    const feedbackText = document.getElementById("runnerFeedbackText");
    const lanes = [22, 50, 78];
    const tokenSlots = tokenTypes.map((_, index) => document.getElementById(`s${index}`));
    const tokenCards = [...document.querySelectorAll(".runner-token-slot")];

    let laneIndex = 1;
    let heroY = 0;
    let heroVelocityY = 0;
    let distance = 0;
    let timeLeft = window.CyberGameRuntime?.getTimeLimitSeconds?.(150) || 150;
    timeVal.textContent = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
    let lives = 3;
    let score = 0;
    let combo = 0;
    let previousFrame = 0;
    let simTime = 0;
    let nextSpawnAt = 650;
    let nearVaultNoticeShown = false;
    let finished = false;
    let coinBag = [];
    const objects = [];
    const collectedTypes = new Set();
    const finishDistance = 650;
    const hardLimitDistance = 850;
    const groundY = 26;

    function speedScale() {
      return window.CyberGameRuntime?.getSpeedScale?.() || 1;
    }

    function setFeedback(message, tone = "neutral") {
      feedbackText.textContent = message;
      feedback.className = `round-feedback ${tone}`;
    }

    function showSplash(x, y, message, color) {
      const splash = document.createElement("div");
      splash.className = "hit-splash";
      splash.textContent = message;
      splash.style.color = color;
      splash.style.left = `${x}px`;
      splash.style.top = `${y}px`;
      document.body.appendChild(splash);
      setTimeout(() => splash.remove(), 720);
    }

    function updateHUD() {
      const secured = collectedTypes.size;
      collectedVal.textContent = `${secured} / 4`;
      scoreVal.textContent = String(score).padStart(4, "0");
      distanceVal.textContent = `${Math.floor(distance)} M`;
      roadDistanceMark.textContent = `${Math.floor(distance)} M`;
      livesVal.textContent = lives > 0 ? "♥".repeat(lives) : "0";
      progressFill.style.width = `${(secured / tokenTypes.length) * 100}%`;
      progressTrack.setAttribute("aria-valuenow", String(secured));
      progressText.textContent = `${secured} / 4 ${secured === 1 ? "TOKEN" : "TOKENS"} SECURED`;
      const distancePct = Math.min(100, (distance / finishDistance) * 100);
      distanceFill.style.width = `${distancePct}%`;
      distanceText.textContent = `${Math.min(finishDistance, Math.floor(distance))} / ${finishDistance} M`;
      distanceFill.parentElement.setAttribute("aria-valuenow", String(Math.min(finishDistance, Math.floor(distance))));
      laneGlow.style.left = `${lanes[laneIndex]}%`;
      hero.style.left = `${lanes[laneIndex]}%`;
      hero.style.bottom = `${groundY + heroY}px`;
      hero.classList.toggle("runner-airborne", heroY > 2);
      track.style.setProperty("--road-speed", `${Math.max(0.2, 0.52 - (210 + distance * 0.08) / 1100)}s`);
    }

    function refillCoinBag() {
      coinBag = [...tokenTypes];
      for (let i = coinBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coinBag[i], coinBag[j]] = [coinBag[j], coinBag[i]];
      }
    }

    function spawnObject() {
      const lane = Math.floor(Math.random() * lanes.length);
      const hazardChance = Math.min(0.37, 0.2 + distance / 3800);
      const isHazard = distance > 25 && Math.random() < hazardChance;
      const el = document.createElement("div");
      el.style.left = `${lanes[lane]}%`;
      el.style.top = "-76px";

      if (isHazard) {
        el.className = "runner-object runner-hazard";
        el.innerHTML = '<span class="runner-object-icon">☣</span><span class="runner-object-label">MALWARE</span>';
        objectLayer.appendChild(el);
        objects.push({ el, lane, y: -76, kind: "hazard", resolved: false });
        return;
      }

      if (!coinBag.length) refillCoinBag();
      const type = coinBag.pop();
      el.className = "runner-object runner-coin";
      el.innerHTML = `<span class="runner-coin-rim"><span class="runner-coin-glyph">${type.glyph}</span></span><span class="runner-object-label">${type.label}</span>`;
      objectLayer.appendChild(el);
      objects.push({ el, lane, y: -76, kind: "coin", type, resolved: false });
    }

    function collectCoin(item) {
      combo++;
      const isNewToken = !collectedTypes.has(item.type.id);
      const points = isNewToken ? 55 + Math.min(combo, 5) * 5 : 15 + Math.min(combo, 5) * 5;
      score += points;
      collectedTypes.add(item.type.id);
      const tokenIndex = tokenTypes.findIndex(type => type.id === item.type.id);
      if (tokenSlots[tokenIndex]) tokenSlots[tokenIndex].textContent = item.type.glyph;
      const tokenCard = tokenCards.find(card => card.dataset.token === item.type.id);
      tokenCard?.classList.add("secured");
      Sound.good();
      updateHUD();
      setFeedback(isNewToken ? `${item.type.label} TOKEN SECURED · VAULT KEY UPDATED` : `COIN STREAK x${combo} · +${points}`, "success");
      if (collectedTypes.size === tokenTypes.length) {
        keyGoal.classList.remove("vault-near");
        keyGoal.classList.add("vault-unlocked");
        setFeedback("ALL TOKENS SECURED · SPRINT TO THE VAULT", "success");
      }
      const rect = item.el.getBoundingClientRect();
      showSplash(rect.left + rect.width / 2, rect.top, `+${points}`, "#ffe48a");
    }

    function resolveObstacle(item) {
      if (item.kind === "coin") {
        if (item.lane === laneIndex) collectCoin(item);
        else {
          combo = 0;
          setFeedback("COIN MISSED · SHIFT LANES TO COLLECT THE NEXT ONE", "neutral");
        }
        return;
      }

      if (item.lane !== laneIndex || heroY >= 58) {
        score += 20;
        updateHUD();
        Sound.select();
        setFeedback(heroY >= 58 && item.lane === laneIndex ? "CLEAN JUMP · MALWARE CLEARED" : "MALWARE AVOIDED · +20", "success");
        const rect = item.el.getBoundingClientRect();
        showSplash(rect.left + rect.width / 2, rect.top, "+20 EVADE", "#79f2d3");
        return;
      }

      lives--;
      combo = 0;
      score = Math.max(0, score - 35);
      Sound.bad();
      arena.classList.add("race-hit");
      setTimeout(() => arena.classList.remove("race-hit"), 300);
      updateHUD();
      setFeedback("MALWARE COLLISION · SHIELD LOST", "danger");
      const rect = item.el.getBoundingClientRect();
      showSplash(rect.left + rect.width / 2, rect.top, "SHIELD −1", "#ff789b");
      if (lives <= 0) endGame(false);
    }

    function endGame(won) {
      if (finished) return;
      finished = true;
      clearInterval(timerInterval);
      cancelAnimationFrame(animFrame);
      if (keyHandler) document.removeEventListener("keydown", keyHandler);
      if (touchControls && touchControlHandler) touchControls.removeEventListener("click", touchControlHandler);
      touchControls = null;
      touchControlHandler = null;
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 1,
          won,
          score: won ? Math.max(250, score) : score,
          title: "Level 1: Cyber Sprint",
          message: won
            ? `You secured all four passphrase tokens and reached the vault at ${Math.floor(distance)} meters.`
            : `Race ended at ${Math.floor(distance)} meters. Secure all four character types, avoid malware, and reach the vault.`
        });
      }
    }

    function moveLane(direction) {
      laneIndex = Math.max(0, Math.min(lanes.length - 1, laneIndex + direction));
      if (window.Sound) Sound.select();
      updateHUD();
    }

    function jumpRunner() {
      if (finished || heroY > 1) return;
      heroVelocityY = 590;
      Sound.jump();
    }

    keyHandler = (event) => {
      if (finished || event.repeat) return;
      const key = event.key;
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", " "].includes(key)) event.preventDefault();
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(key)) {
        const direction = key === "ArrowLeft" || key.toLowerCase() === "a" ? -1 : 1;
        moveLane(direction);
      } else if (key === " " && heroY <= 1) {
        jumpRunner();
      }
    };
    document.addEventListener("keydown", keyHandler);

    touchControls = container.querySelector(".mobile-touch-controls");
    touchControlHandler = (event) => {
      const button = event.target.closest("[data-sprint-action]");
      if (!button || finished) return;
      event.preventDefault();
      if (button.dataset.sprintAction === "left") moveLane(-1);
      else if (button.dataset.sprintAction === "right") moveLane(1);
      else if (button.dataset.sprintAction === "jump") jumpRunner();
    };
    touchControls?.addEventListener("click", touchControlHandler);

    function loop(timestamp = 0) {
      if (finished) return;
      const delta = previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.05) : 0;
      previousFrame = timestamp;
      const simDelta = delta * speedScale();
      simTime += simDelta * 1000;
      const runSpeed = 210 + Math.min(distance * 0.08, 105);
      distance += runSpeed * simDelta * 0.045;
      if (distance >= finishDistance && collectedTypes.size < tokenTypes.length && !nearVaultNoticeShown) {
        nearVaultNoticeShown = true;
        keyGoal.classList.add("vault-near");
        const missingTokens = tokenTypes.length - collectedTypes.size;
        setFeedback(`VAULT SEALED · SECURE ${missingTokens} MORE TOKEN ${missingTokens === 1 ? "TYPE" : "TYPES"}`, "danger");
      }
      heroY += heroVelocityY * simDelta;
      heroVelocityY -= 1500 * simDelta;
      if (heroY <= 0) {
        heroY = 0;
        heroVelocityY = 0;
      }
      updateHUD();

      if (simTime >= nextSpawnAt) {
        spawnObject();
        nextSpawnAt = simTime + Math.max(660, 970 - distance * 0.38);
      }

      const impactLine = track.clientHeight - 92;
      for (let i = objects.length - 1; i >= 0; i--) {
        const item = objects[i];
        item.y += runSpeed * simDelta;
        item.el.style.top = `${item.y}px`;
        const approach = Math.min(1, Math.max(0, (item.y + 76) / impactLine));
        const scale = 0.58 + approach * 0.52;
        item.el.style.transform = `translateX(-50%) scale(${scale})`;
        if (!item.resolved && item.y >= impactLine) {
          item.resolved = true;
          resolveObstacle(item);
          item.el.classList.add(item.kind === "coin" ? "runner-coin-collected" : "runner-hazard-cleared");
          item.el.remove();
          objects.splice(i, 1);
          if (finished) return;
          continue;
        }
        if (item.y > track.clientHeight + 80) {
          item.el.remove();
          objects.splice(i, 1);
        }
      }

      if (distance >= finishDistance && collectedTypes.size === tokenTypes.length) {
        endGame(true);
        return;
      }
      if (distance >= hardLimitDistance) {
        endGame(false);
        return;
      }

      animFrame = requestAnimationFrame(loop);
    }

    updateHUD();
    animFrame = requestAnimationFrame(loop);
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - speedScale());
      const displayTime = Math.ceil(timeLeft);
      const minutes = String(Math.floor(displayTime / 60)).padStart(2, "0");
      const seconds = String(displayTime % 60).padStart(2, "0");
      timeVal.textContent = `${minutes}:${seconds}`;
      if (timeLeft <= 0) endGame(false);
    }, 1000);
  }

  function cleanup() {
    clearInterval(timerInterval);
    cancelAnimationFrame(animFrame);
    if (keyHandler) document.removeEventListener("keydown", keyHandler);
    if (touchControls && touchControlHandler) touchControls.removeEventListener("click", touchControlHandler);
    keyHandler = null;
    touchControls = null;
    touchControlHandler = null;
  }

  return { init, cleanup };
})();
