// Level 12 (Bonus): Zero Trust Architecture & Least Privilege
const Level12_ZeroTrust = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const ACCESS_REQUESTS = [
    {
      user: "Contractor Dev: Liam",
      context: "Connecting from unrecognized foreign IP without corporate VPN or Device Health Certificate",
      requestedResource: "Production Customer Credit Card Vault",
      correctDecision: "DENY",
      reason: "Zero Trust: Never Trust, Always Verify. Unmanaged device without posture compliance must be blocked."
    },
    {
      user: "HR Specialist: Sarah",
      context: "Verified FIDO2 YubiKey + Managed Corporate Laptop + Compliant EDR Antivirus",
      requestedResource: "Internal Employee Payroll Management",
      correctDecision: "APPROVE",
      reason: "Compliant posture: Identity, device compliance, and principle of least privilege all satisfied."
    },
    {
      user: "Marketing Intern: Dave",
      context: "Valid corporate account, but requested Root Domain Controller Admin access",
      requestedResource: "Active Directory Domain Controller",
      correctDecision: "DENY",
      reason: "Principle of Least Privilege (PoLP): Users only receive permissions required for their specific role."
    }
  ];

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level3-theme">
        <div class="level-badge-header green">
          <span class="lvl-tag">BONUS LEVEL 12</span>
          <span class="lvl-title">🛡️ ZERO TRUST ARCHITECTURE</span>
        </div>
        <p class="game-instruction">Enforce Zero Trust Policy: Never Trust, Always Verify. Evaluate device posture and least privilege!</p>

        <div class="zt-decision-deck" id="ztDeck"></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">REQUESTS EVALUATED:</span> <span class="val" id="ztVal">0 / 3</span></div>
          <div class="stat-item"><span class="lbl">TIME:</span> <span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Zero Trust assumes the network is hostile. Verify identity, device health, and least privilege for every single access request!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const deck = document.getElementById("ztDeck");
    const ztVal = document.getElementById("ztVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let currentIdx = 0;
    let lives = 3;

    function renderRequest() {
      deck.innerHTML = "";
      const r = ACCESS_REQUESTS[currentIdx];
      ztVal.textContent = `${currentIdx} / ${ACCESS_REQUESTS.length}`;

      const card = document.createElement("div");
      card.className = "bait-scenario-card";
      card.innerHTML = `
        <div class="bait-icon">🔐</div>
        <h3 class="bait-title">${r.user}</h3>
        <p class="bait-desc">
          <strong>Requested Asset:</strong> ${r.requestedResource}<br>
          <strong>Security Telemetry:</strong> ${r.context}
        </p>
        <div class="inspect-actions" style="margin-top: 14px;">
          <button class="btn-keep-app" id="btnApproveZT" style="background:var(--green); color:#000; font-weight:bold;">
            ✔ GRANT ACCESS
          </button>
          <button class="btn-uninstall-spy" id="btnDenyZT" style="background:var(--crimson); font-weight:bold;">
            ✖ BLOCK & CHALLENGE
          </button>
        </div>
      `;

      card.querySelector("#btnApproveZT").addEventListener("click", () => handleDecision("APPROVE", r));
      card.querySelector("#btnDenyZT").addEventListener("click", () => handleDecision("DENY", r));

      deck.appendChild(card);
    }

    function handleDecision(decision, r) {
      if (decision === r.correctDecision) {
        Sound.good();
        alert(`✅ CORRECT ENFORCEMENT: ${r.reason}`);
        currentIdx++;
        if (currentIdx >= ACCESS_REQUESTS.length) endGame(true);
        else renderRequest();
      } else {
        Sound.bad();
        lives--;
        livesVal.textContent = "❤️".repeat(Math.max(0, lives));
        alert(`❌ ZERO TRUST VIOLATION: ${r.reason}`);
        if (lives <= 0) endGame(false);
      }
    }

    renderRequest();

    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(currentIdx >= ACCESS_REQUESTS.length);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 12,
          won: won,
          score: won ? 500 : 100,
          title: "Level 12: Zero Trust Architecture",
          message: won
            ? "Zero Trust Perimeter Achieved! You enforced rigorous device health verification and prevented lateral privilege escalation."
            : "Trust exploited! Never grant implicit access based on internal network location."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
