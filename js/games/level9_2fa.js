// Level 9: Two-Factor Authentication (2FA) & MFA Defense
// A two-stage simulation: reject an unsolicited push, then manually verify a live TOTP code.
const Level9_2FA = (function() {
  let missionInterval = null;
  let container = null;
  let onCompleteCallback = null;
  let controller = null;
  let finished = false;

  function getSettings() {
    return window.CyberGameRuntime?.settings || {};
  }

  function getSpeedScale() {
    return window.CyberGameRuntime?.getSpeedScale?.() || 1;
  }

  function init(containerEl, onComplete) {
    cleanup();
    container = containerEl;
    onCompleteCallback = onComplete;
    finished = false;
    controller = new AbortController();
    render();
  }

  function render() {
    const settings = getSettings();
    const difficulty = settings.difficulty || "normal";
    const difficultyLabel = difficulty.toUpperCase();

    container.innerHTML = `
      <div class="game-stage level9-theme mfa-defense-game">
        <div class="level-badge-header purple">
          <span class="lvl-tag">LEVEL 9 · ${difficultyLabel} MODE</span>
          <span class="lvl-title">🔑 MFA DEFENSE: PUSH &amp; TOTP</span>
        </div>
        <p class="game-instruction">Contain the unrecognized sign-in, then enter the changing authenticator code before its security window closes. This is a simulated training challenge—never share a real code.</p>

        <div class="mission-objective-progress">
          <div class="objective-progress-heading"><span>AUTHENTICATION CHECKPOINTS</span><strong id="mfaProgressText">0 / 2 SECURED</strong></div>
          <div class="objective-progress-track" role="progressbar" aria-label="Authentication checkpoints secured" aria-valuemin="0" aria-valuemax="2" aria-valuenow="0"><div class="objective-progress-fill" id="mfaProgressFill"></div></div>
        </div>

        <div class="totp-phone-sim" aria-label="Simulated authenticator device">
          <div class="phone-notch"></div>

          <section class="mfa-push-notification" id="pushNotif" aria-labelledby="pushTitle">
            <div class="push-header">
              <span id="pushTitle">⚠️ UNRECOGNIZED SIGN-IN REQUEST</span>
              <span class="pulse-dot" aria-hidden="true">●</span>
            </div>
            <div class="push-body">
              <strong>Location:</strong> Moscow, RU (IP: 185.220.101.4)<br>
              <strong>Device:</strong> Linux Firefox<br>
              <em>You did not initiate this request. Which response protects the account?</em>
            </div>
            <div class="push-actions">
              <button type="button" class="btn-deny-push" id="btnDenyPush">❌ REJECT &amp; REPORT ATTACK</button>
              <button type="button" class="btn-approve-push" id="btnApprovePush">✔ APPROVE SIGN-IN</button>
            </div>
          </section>

          <section class="totp-app-box hidden" id="totpBox" aria-labelledby="totpTitle">
            <div class="totp-header" id="totpTitle">CYBER SHIELD AUTHENTICATOR</div>
            <div class="totp-code-display" id="totpCode" aria-label="Current simulated authentication code">--- ---</div>
            <div class="totp-timer-bar" aria-label="Time remaining for this code"><div class="totp-timer-fill" id="totpBar"></div></div>
            <p class="totp-sub" id="totpCountdown">CODE WINDOW: 30 SECONDS</p>
            <form id="totpForm" class="totp-entry-form" novalidate>
              <label for="totpInput" class="sr-only">Enter the six digit simulated authenticator code</label>
              <input id="totpInput" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="ENTER 6-DIGIT CODE" aria-describedby="totpHelp">
              <button type="submit" class="btn-confirm-totp" id="btnConfirmTotp">VERIFY CODE</button>
            </form>
            <p class="totp-sub" id="totpHelp">The code refreshes when the meter reaches zero.</p>
          </section>
        </div>

        <div class="round-feedback" id="mfaFeedback" aria-live="polite"><span class="round-feedback-dot"></span><span id="mfaFeedbackText">Review the push request before taking action.</span></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">PROTOCOL</span><span class="val" id="mfaStatus">PUSH REQUEST REVIEW</span></div>
          <div class="stat-item"><span class="lbl">CHECKPOINTS</span><span class="val" id="checkpointVal">0 / 2</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT</span><span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">SHIELDS</span><span class="val" id="livesVal">♥♥♥</span></div>
        </div>

        <div class="game-tip-banner">💡 <strong>TRAINING TIP:</strong> An unexpected push is a warning—not a request to approve. Verify the sign-in independently, then use an authenticator code only in the service you initiated.</div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const settings = getSettings();
    const difficulty = settings.difficulty || "normal";
    const totalTime = 150;
    const initialLives = Math.max(1, Math.min(5, Number.parseInt(settings.startLives, 10) || 3));
    const signal = controller.signal;
    const pushNotif = container.querySelector("#pushNotif");
    const totpBox = container.querySelector("#totpBox");
    const denyButton = container.querySelector("#btnDenyPush");
    const approveButton = container.querySelector("#btnApprovePush");
    const totpForm = container.querySelector("#totpForm");
    const totpInput = container.querySelector("#totpInput");
    const totpCode = container.querySelector("#totpCode");
    const totpBar = container.querySelector("#totpBar");
    const totpCountdown = container.querySelector("#totpCountdown");
    const status = container.querySelector("#mfaStatus");
    const checkpointVal = container.querySelector("#checkpointVal");
    const progressFill = container.querySelector("#mfaProgressFill");
    const progressText = container.querySelector("#mfaProgressText");
    const progressTrack = progressFill?.parentElement;
    const timeVal = container.querySelector("#timeVal");
    const livesVal = container.querySelector("#livesVal");
    const feedback = container.querySelector("#mfaFeedback");
    const feedbackText = container.querySelector("#mfaFeedbackText");

    let lives = initialLives;
    let checkpoint = 0;
    let phase = "push";
    let timeRemaining = totalTime;
    let codeRemaining = 30;
    let currentCode = "";
    let lastTick = performance.now();

    function formatTime(seconds) {
      const safeSeconds = Math.max(0, Math.ceil(seconds));
      return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
    }

    function setFeedback(message, tone = "neutral") {
      feedbackText.textContent = message;
      feedback.className = `round-feedback ${tone}`;
    }

    function updateHUD() {
      const clampedCheckpoint = Math.min(2, checkpoint);
      checkpointVal.textContent = `${clampedCheckpoint} / 2`;
      progressText.textContent = `${clampedCheckpoint} / 2 SECURED`;
      progressFill.style.width = `${clampedCheckpoint * 50}%`;
      progressTrack?.setAttribute("aria-valuenow", String(clampedCheckpoint));
      timeVal.textContent = formatTime(timeRemaining);
      livesVal.textContent = lives > 0 ? "♥".repeat(lives) : "0";
      const remaining = Math.max(0, Math.ceil(codeRemaining));
      totpCountdown.textContent = `CODE WINDOW: ${String(remaining).padStart(2, "0")} SECONDS`;
      totpBar.style.width = `${Math.max(0, Math.min(100, (codeRemaining / 30) * 100))}%`;
    }

    function createCode() {
      currentCode = String(Math.floor(100000 + Math.random() * 900000));
      totpCode.textContent = `${currentCode.slice(0, 3)} ${currentCode.slice(3)}`;
      codeRemaining = 30;
      totpInput.value = "";
      totpInput.removeAttribute("aria-invalid");
      updateHUD();
    }

    function loseShield(message) {
      if (finished) return;
      lives -= 1;
      Sound.bad();
      updateHUD();
      setFeedback(message, "danger");
      if (lives <= 0) endGame(false, "Account session compromised. Reject unfamiliar requests and verify the current authenticator code carefully.");
    }

    function enterTotpStage() {
      if (finished || phase !== "push") return;
      phase = "totp";
      checkpoint = 1;
      pushNotif.classList.add("hidden");
      totpBox.classList.remove("hidden");
      status.textContent = "TOTP VERIFICATION";
      Sound.good();
      createCode();
      setFeedback("PUSH ATTACK REJECTED · ENTER THE LIVE SIX-DIGIT CODE", "success");
      totpInput.focus();
    }

    function handleApprove() {
      if (finished || phase !== "push" || approveButton.disabled) return;
      approveButton.disabled = true;
      approveButton.textContent = "⚠️ UNAUTHORIZED APPROVAL DETECTED";
      loseShield("UNAUTHORIZED APPROVAL · ONE SHIELD LOST. REJECT THE PUSH TO CONTAIN THE SESSION.");
    }

    function handleDeny() {
      if (finished || phase !== "push") return;
      denyButton.disabled = true;
      enterTotpStage();
    }

    function handleCodeSubmit(event) {
      event.preventDefault();
      if (finished || phase !== "totp") return;
      const entered = totpInput.value.replace(/\D/g, "");
      totpInput.value = entered;
      if (entered.length !== 6) {
        totpInput.setAttribute("aria-invalid", "true");
        setFeedback("ENTER ALL SIX DIGITS FROM THE CURRENT AUTHENTICATOR CODE.", "danger");
        return;
      }
      if (entered !== currentCode) {
        totpInput.setAttribute("aria-invalid", "true");
        loseShield("CODE MISMATCH · CHECK THE CURRENT WINDOW BEFORE RETRYING.");
        totpInput.select();
        return;
      }

      checkpoint = 2;
      status.textContent = "IDENTITY VERIFIED";
      Sound.win();
      updateHUD();
      setFeedback("TOTP VERIFIED · IDENTITY CHANNEL SECURED.", "success");
      endGame(true, "MFA fortress established! You rejected a push-fatigue attack and validated a changing authenticator code.");
    }

    denyButton.addEventListener("click", handleDeny, { signal });
    approveButton.addEventListener("click", handleApprove, { signal });
    totpForm.addEventListener("submit", handleCodeSubmit, { signal });
    totpInput.addEventListener("input", () => {
      totpInput.value = totpInput.value.replace(/\D/g, "").slice(0, 6);
      totpInput.removeAttribute("aria-invalid");
    }, { signal });

    updateHUD();
    missionInterval = window.setInterval(() => {
      if (finished) return;
      const now = performance.now();
      const elapsed = Math.min(1, (now - lastTick) / 1000);
      lastTick = now;
      const scaledElapsed = elapsed * getSpeedScale();
      timeRemaining -= scaledElapsed;

      if (phase === "totp") {
        codeRemaining -= scaledElapsed;
        if (codeRemaining <= 0) {
          createCode();
          setFeedback("AUTHENTICATOR WINDOW REFRESHED · USE THE NEW CODE.", "neutral");
        }
      }

      updateHUD();
      if (timeRemaining <= 0) {
        endGame(false, "Verification window expired. Slow down, reject unsolicited pushes, and confirm the active six-digit code.");
      }
    }, 250);

    function endGame(won, message) {
      if (finished) return;
      finished = true;
      clearInterval(missionInterval);
      missionInterval = null;
      controller?.abort();

      if (onCompleteCallback) {
        const timeBonus = Math.max(0, Math.floor(timeRemaining)) * 2;
        const lifeBonus = Math.max(0, lives) * 20;
        onCompleteCallback({
          levelId: 9,
          won,
          score: won ? Math.max(450, Math.min(600, 420 + timeBonus + lifeBonus)) : 0,
          title: "Level 9: Two-Factor Authentication",
          message
        });
      }
    }
  }

  function cleanup() {
    clearInterval(missionInterval);
    missionInterval = null;
    controller?.abort();
    controller = null;
  }

  return { init, cleanup };
})();
