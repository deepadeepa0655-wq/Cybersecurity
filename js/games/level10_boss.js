// Level 10: Final Cyber Security Challenge (ShadowX Boss Gauntlet)
const Level10_Boss = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const ATTACKS = [
    { name: "Credential Phishing Lure", icon: "✉️", counter: "Audit Headers", tool: "🔍", alert: "ShadowX unleashed spoofed CEO emails across corporate mailboxes!" },
    { name: "Ransomware Lateral Infection", icon: "🔒", counter: "Air-Gap Network", tool: "📶", alert: "Ransomware spreading through server subnet!" },
    { name: "MFA Bombing Push Attack", icon: "📱", counter: "Reject Unsolicited 2FA", tool: "❌", alert: "Continuous push prompts flooding executive phones!" },
    { name: "Hardware Keylogger Implant", icon: "⌨️", counter: "Inspect Physical Ports", tool: "🕵️", alert: "Hardware covert dongle discovered in server room!" },
    { name: "Typosquatted Lookalike Domain", icon: "🌐", counter: "Enforce HTTPS EV-SSL", tool: "🔒", alert: "Fake employee portal harvest link deployed!" }
  ];

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level10-theme">
        <div class="level-badge-header crimson">
          <span class="lvl-tag">LEVEL 10</span>
          <span class="lvl-title">👾 FINAL CYBER SECURITY CHALLENGE</span>
        </div>
        <p class="game-instruction">Defend against multi-vector Advanced Persistent Threats (APTs) orchestrated by ShadowX!</p>

        <!-- Boss Arena -->
        <div class="boss-gauntlet-arena">
          <div class="boss-avatar-pulse">👾</div>
          <h3 class="boss-name-title">SHADOW-X SYNCHRONIZED BREACH</h3>
          
          <!-- Boss HP Gauge -->
          <div class="boss-hp-track">
            <div class="boss-hp-fill" id="bossHpBar" style="width: 100%;"></div>
          </div>
          <div class="boss-hp-num" id="bossHpVal">SHADOWX INTEGRITY: 100%</div>

          <!-- Active Attack Alert Banner -->
          <div class="boss-attack-banner" id="bossAttackBanner">
            INITIALIZING MULTI-VECTOR ASSAULT...
          </div>
        </div>

        <!-- Defense Countermeasures Tool Dock -->
        <div class="boss-counter-dock" id="counterDock"></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">VECTORS REPELLED:</span> <span class="val" id="repelledVal">0 / 5</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">02:00</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Select the matching tactical defense for each incoming threat vector!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const bossHpBar = document.getElementById("bossHpBar");
    const bossHpVal = document.getElementById("bossHpVal");
    const banner = document.getElementById("bossAttackBanner");
    const counterDock = document.getElementById("counterDock");
    const repelledVal = document.getElementById("repelledVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let bossHp = 100;
    let repelled = 0;
    let lives = 3;
    let currentAttack = null;

    // Render defense tools
    ATTACKS.forEach(atk => {
      const btn = document.createElement("button");
      btn.className = "boss-tool-btn";
      btn.innerHTML = `<span class="icon">${atk.tool}</span><span class="lbl">${atk.counter}</span>`;
      btn.addEventListener("click", () => handleCounter(atk.counter));
      counterDock.appendChild(btn);
    });

    function nextVector() {
      if (repelled >= ATTACKS.length) {
        endGame(true);
        return;
      }
      currentAttack = ATTACKS[repelled];
      banner.innerHTML = `<span class="atk-ic">${currentAttack.icon}</span> <strong>${currentAttack.name}:</strong> ${currentAttack.alert}`;
      banner.classList.add("danger-pulse");
      Sound.alarm();
    }

    function handleCounter(chosenCounter) {
      if (!currentAttack) return;
      if (chosenCounter === currentAttack.counter) {
        Sound.good();
        repelled++;
        bossHp = Math.max(0, bossHp - 20);
        bossHpBar.style.width = bossHp + "%";
        bossHpVal.textContent = `SHADOWX INTEGRITY: ${bossHp}%`;
        repelledVal.textContent = `${repelled} / ${ATTACKS.length}`;
        banner.classList.remove("danger-pulse");

        if (bossHp <= 0) {
          endGame(true);
        } else {
          setTimeout(nextVector, 700);
        }
      } else {
        Sound.bad();
        lives--;
        livesVal.textContent = "❤️".repeat(Math.max(0, lives));
        alert(`❌ MISMATCHED DEFENSE! You needed: ${currentAttack.counter}`);
        if (lives <= 0) endGame(false);
      }
    }

    nextVector();

    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(bossHp <= 0);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 10,
          won: won,
          score: won ? 600 : 120,
          title: "Level 10: Final Challenge",
          message: won
            ? "LEGENDARY TRIUMPH! You repelled all coordinated attack vectors and defeated ShadowX. Your Official Cyber Defense Certificate is now unlocked!"
            : "Grid compromised by ShadowX APT! Review all 10 defense protocols and retaliate."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
