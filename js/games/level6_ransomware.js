// Level 6: Ransomware Escape Incident Response
const Level6_Ransomware = (function() {
  let countdownTimer = null;
  let container = null;
  let onCompleteCallback = null;

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level6-theme">
        <div class="level-badge-header navy">
          <span class="lvl-tag">LEVEL 6</span>
          <span class="lvl-title">💽 RANSOMWARE ESCAPE</span>
        </div>
        <p class="game-instruction">Your workstation files are being encrypted! Choose the proper incident response steps.</p>

        <!-- Ransomware Laptop Display -->
        <div class="ransomware-laptop-sim">
          <div class="laptop-screen" id="ransomScreen">
            <div class="lock-skull-icon">🔒💀</div>
            <h2 class="ransom-alert-title">YOUR FILES ARE LOCKED!</h2>
            <p class="ransom-demand-text">PAY $500 IN BITCOIN TO UNLOCK YOUR FILES!</p>
            <div class="digital-countdown-clock" id="clockDisplay">01:45</div>
            <div class="ransom-warning-sub">DO NOT RESTART OR FILES WILL BE DESTROYED</div>
          </div>
          <div class="laptop-keyboard-base">
            <div class="trackpad"></div>
          </div>
        </div>

        <!-- Incident Response Actions Grid -->
        <div class="ransom-actions-dock">
          <button class="ir-action-btn green-btn" id="actDisconnect">
            <span class="ir-icon">📶</span>
            <span class="ir-text">Disconnect from the Internet</span>
          </button>

          <button class="ir-action-btn green-btn" id="actBackup">
            <span class="ir-icon">💾</span>
            <span class="ir-text">Restore files from Backup</span>
          </button>

          <button class="ir-action-btn red-btn" id="actPay">
            <span class="ir-icon">💀</span>
            <span class="ir-text">Pay the Ransom</span>
          </button>

          <button class="ir-action-btn red-btn" id="actOpenMail">
            <span class="ir-icon">✉️</span>
            <span class="ir-text">Open Unknown Email</span>
          </button>
        </div>

        <div class="incident-playbook-status" id="playbookStatus">
          PROTOCOL STATUS: <span class="step-tag">Step 1 — Immediate Containment</span>
        </div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">STEPS COMPLETED:</span> <span class="val" id="stepsVal">0 / 2</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Think before you click. Good choices like air-gapping and immutable backups save your data!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const clockDisplay = document.getElementById("clockDisplay");
    const ransomScreen = document.getElementById("ransomScreen");
    const playbookStatus = document.getElementById("playbookStatus");
    const stepsVal = document.getElementById("stepsVal");
    const livesVal = document.getElementById("livesVal");

    const actDisconnect = document.getElementById("actDisconnect");
    const actBackup = document.getElementById("actBackup");
    const actPay = document.getElementById("actPay");
    const actOpenMail = document.getElementById("actOpenMail");

    let lives = 3;
    let disconnected = false;
    let restored = false;
    let totalSeconds = 105; // 01:45

    function updateLives() {
      livesVal.textContent = "❤️".repeat(Math.max(0, lives));
    }

    // Step 1: Disconnect Internet
    actDisconnect.addEventListener("click", () => {
      if (disconnected) return;
      disconnected = true;
      Sound.good();
      actDisconnect.classList.add("completed");
      actDisconnect.innerHTML = `<span class="ir-icon">✅</span><span class="ir-text">Air-Gap Established (Safe)</span>`;
      playbookStatus.innerHTML = `PROTOCOL STATUS: <span class="step-tag green">Step 2 — Restore from Secure Backup</span>`;
      stepsVal.textContent = "1 / 2";
      ransomScreen.classList.add("contained");
    });

    // Step 2: Restore from Backup
    actBackup.addEventListener("click", () => {
      if (!disconnected) {
        Sound.bad();
        lives--;
        updateLives();
        alert("⚠️ WARNING: You must disconnect from the network first! Restoring while infected can corrupt the backup drive.");
        if (lives <= 0) endGame(false);
        return;
      }

      if (restored) return;
      restored = true;
      Sound.win();
      actBackup.classList.add("completed");
      actBackup.innerHTML = `<span class="ir-icon">✅</span><span class="ir-text">Files Restored 100% (Clean)</span>`;
      stepsVal.textContent = "2 / 2";
      ransomScreen.innerHTML = `
        <div class="lock-skull-icon green">🛡️</div>
        <h2 class="ransom-alert-title green">SYSTEM RESTORED!</h2>
        <p class="ransom-demand-text green">All files recovered from offline immutable backup.</p>
        <div class="digital-countdown-clock green">SUCCESS</div>
      `;
      setTimeout(() => endGame(true), 1200);
    });

    // Mistake 1: Pay Ransom
    actPay.addEventListener("click", () => {
      Sound.bad();
      lives--;
      updateLives();
      alert("❌ NEVER PAY THE RANSOM! Attackers frequently take the Bitcoin and never send decryption keys, while funding criminal syndicates.");
      if (lives <= 0) endGame(false);
    });

    // Mistake 2: Open Unknown Email
    actOpenMail.addEventListener("click", () => {
      Sound.bad();
      lives--;
      updateLives();
      alert("❌ FATAL ERROR! Opening another unverified email executed a secondary wiper script!");
      if (lives <= 0) endGame(false);
    });

    // Countdown Timer
    countdownTimer = setInterval(() => {
      totalSeconds--;
      const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const secs = String(totalSeconds % 60).padStart(2, "0");
      clockDisplay.textContent = `${mins}:${secs}`;

      if (totalSeconds <= 0) {
        endGame(false);
      }
    }, 1000);

    function endGame(won) {
      cleanup();
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 6,
          won: won,
          score: won ? 500 : 100,
          title: "Level 6: Ransomware Escape",
          message: won
            ? "Air-gap triumph! Your structured incident playbook recovered critical enterprise systems without ransom payments."
            : "Files permanently encrypted! Always maintain offline backups and isolate suspect workstations immediately."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(countdownTimer);
  }

  return { init, cleanup };
})();
