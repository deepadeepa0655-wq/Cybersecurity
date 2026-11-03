// Level 4: Strong Password Builder Platformer
const Level4_Password = (function() {
  let timerInterval = null;
  let animFrame = null;
  let container = null;
  let onCompleteCallback = null;
  let keyHandler = null;
  let touchControls = null;
  let touchControlHandler = null;

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level4-theme">
        <div class="level-badge-header amber">
          <span class="lvl-tag">LEVEL 4</span>
          <span class="lvl-title">🔒 STRONG PASSWORD BUILDER</span>
        </div>
        <p class="game-instruction">Collect each character type with <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>, and jump with <kbd>Space</kbd>. On touch screens, use the controls below.</p>

        <!-- Platformer Arena -->
        <div class="platformer-arena" id="runnerArena">
          <div class="sunset-backdrop"></div>
          
          <div class="runner-track" id="runnerTrack">
            <!-- Floating Platforms and Blocks -->
            <div class="floating-island island-1" style="left: 12%; bottom: 35px;">
              <div class="char-block uppercase" data-type="upper" data-char="A">
                <span class="val">A</span>
                <span class="cat">UPPERCASE</span>
              </div>
            </div>

            <div class="floating-island island-2" style="left: 32%; bottom: 85px;">
              <div class="char-block lowercase" data-type="lower" data-char="a">
                <span class="val">a</span>
                <span class="cat">LOWERCASE</span>
              </div>
            </div>

            <div class="floating-island island-3" style="left: 54%; bottom: 45px;">
              <div class="char-block number" data-type="num" data-char="7">
                <span class="val">7</span>
                <span class="cat">NUMBER</span>
              </div>
            </div>

            <div class="floating-island island-4" style="left: 74%; bottom: 100px;">
              <div class="char-block special" data-type="spec" data-char="#">
                <span class="val">#</span>
                <span class="cat">SPECIAL</span>
              </div>
            </div>

            <!-- Golden Key at right -->
            <div class="password-key-goal" id="keyGoal" style="left: 90%; bottom: 70px;">
              <div class="key-glow">🔑</div>
              <span class="key-label">PASSWORD KEY</span>
            </div>

            <!-- Hero Runner Sprite -->
            <div class="runner-hero" id="heroRunner" style="left: 5%; bottom: 30px;">
              🏃
            </div>
          </div>
        </div>

        <div class="mobile-touch-controls" aria-label="Password platformer movement controls">
          <button type="button" data-platformer-action="left" aria-label="Move left">◀</button>
          <button type="button" data-platformer-action="jump" aria-label="Jump">JUMP</button>
          <button type="button" data-platformer-action="right" aria-label="Move right">▶</button>
        </div>

        <!-- Live Password Construction Deck -->
        <div class="password-construction-box">
          <div class="pass-label">YOUR PASSWORD:</div>
          <div class="pass-slots" id="passSlots">
            <span class="slot" id="s0">_</span>
            <span class="slot" id="s1">_</span>
            <span class="slot" id="s2">_</span>
            <span class="slot" id="s3">_</span>
            <span class="slot" id="s4">_</span>
            <span class="slot" id="s5">_</span>
            <span class="slot" id="s6">_</span>
            <span class="slot" id="s7">_</span>
          </div>
          <!-- Strength Gauge -->
          <div class="strength-meter-wrap">
            <div class="strength-label">STRENGTH: <span id="strengthText">WEAK</span></div>
            <div class="meter-bar-track">
              <div class="meter-bar-fill" id="meterFill" style="width: 10%;"></div>
            </div>
          </div>
        </div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">CHARS COLLECTED:</span> <span class="val" id="collectedVal">0 / 4</span></div>
          <div class="stat-item"><span class="lbl">TIME:</span> <span class="val" id="timeVal">02:30</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Use a combination of Uppercase, Lowercase, Numbers and Special Characters!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const hero = document.getElementById("heroRunner");
    const track = document.getElementById("runnerTrack");
    const charBlocks = document.querySelectorAll(".char-block");
    const keyGoal = document.getElementById("keyGoal");
    const passSlots = document.querySelectorAll(".pass-slots .slot");
    const meterFill = document.getElementById("meterFill");
    const strengthText = document.getElementById("strengthText");
    const collectedVal = document.getElementById("collectedVal");
    const timeVal = document.getElementById("timeVal");

    let heroX = 5; // percentage
    let heroY = 30; // px
    let collected = [];
    const needed = ["upper", "lower", "num", "spec"];

    function updateHero() {
      hero.style.left = heroX + "%";
      hero.style.bottom = heroY + "px";
    }

    function jumpHero() {
      Sound.jump();
      heroY = 120;
      updateHero();
      setTimeout(() => {
        heroY = 30;
        updateHero();
        checkCollisions();
      }, 350);
    }

    keyHandler = (event) => {
      if (event.repeat) return;
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", " "].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") heroX = Math.max(2, heroX - 7);
      else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") heroX = Math.min(92, heroX + 7);
      else if (event.key === " ") jumpHero();
      updateHero();
      checkCollisions();
    };
    document.addEventListener("keydown", keyHandler);

    touchControls = container.querySelector(".mobile-touch-controls");
    touchControlHandler = (event) => {
      const button = event.target.closest("[data-platformer-action]");
      if (!button) return;
      event.preventDefault();
      if (button.dataset.platformerAction === "left") heroX = Math.max(2, heroX - 7);
      else if (button.dataset.platformerAction === "right") heroX = Math.min(92, heroX + 7);
      else if (button.dataset.platformerAction === "jump") jumpHero();
      updateHero();
      checkCollisions();
    };
    touchControls?.addEventListener("click", touchControlHandler);

    function checkCollisions() {
      charBlocks.forEach(btn => {
        if (!btn.classList.contains("collected")) {
          const rectA = hero.getBoundingClientRect();
          const rectB = btn.getBoundingClientRect();
          const hit = !(
            rectA.right < rectB.left ||
            rectA.left > rectB.right ||
            rectA.bottom < rectB.top ||
            rectA.top > rectB.bottom
          );
          if (hit) {
            collectBlock(btn);
          }
        }
      });

      if (collected.length >= 4) {
        const rectA = hero.getBoundingClientRect();
        const rectKey = keyGoal.getBoundingClientRect();
        const hitKey = !(
          rectA.right < rectKey.left ||
          rectA.left > rectKey.right
        );
        if (hitKey) {
          endGame(true);
        }
      }
    }

    function collectBlock(btn) {
      if (btn.classList.contains("collected")) return;
      btn.classList.add("collected");
      Sound.good();
      const type = btn.dataset.type;
      const char = btn.dataset.char;
      collected.push({ type, char });

      // Update password display
      collected.forEach((item, idx) => {
        if (passSlots[idx]) {
          passSlots[idx].textContent = item.char;
          passSlots[idx].classList.add("filled");
        }
      });

      collectedVal.textContent = `${collected.length} / 4`;

      // Update strength meter
      const pct = (collected.length / 4) * 100;
      meterFill.style.width = pct + "%";
      if (pct === 25) {
        strengthText.textContent = "FAIR (25%)";
        meterFill.style.background = "#f59e0b";
      } else if (pct === 50) {
        strengthText.textContent = "GOOD (50%)";
        meterFill.style.background = "#eab308";
      } else if (pct === 75) {
        strengthText.textContent = "STRONG (75%)";
        meterFill.style.background = "#10b981";
      } else if (pct >= 100) {
        strengthText.textContent = "FORTRESS (100%)";
        meterFill.style.background = "#00f0ff";
        keyGoal.classList.add("unlocked");
      }

      if (collected.length >= 4) {
        setTimeout(() => endGame(true), 800);
      }
    }

    // Timer (90s = 01:30)
    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) {
        endGame(collected.length >= 4);
      }
    }, 1000);

    function endGame(won) {
      cleanup();
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 4,
          won: won,
          score: won ? 350 : 80,
          title: "Level 4: Strong Password Builder",
          message: won
            ? "Fortress unlocked! Your multi-character entropy password defies brute-force dictionary attacks."
            : "Password cracked! Remember to weave uppercase, lowercase, numbers, and symbols together."
        });
      }
    }
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
