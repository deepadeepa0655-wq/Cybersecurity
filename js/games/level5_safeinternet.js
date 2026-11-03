// Level 5: Safe Internet Browsing & Web Security Inspector
const Level5_SafeInternet = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const CASES = [
    {
      targetSite: "Secure Online Banking Portal",
      options: [
        {
          url: "https://www.chase.com",
          domain: "chase.com",
          isSafe: true,
          checks: [
            "✔ Valid DigiCert Extended Validation (EV) SSL",
            "✔ Official Top-Level Domain (.com)",
            "✔ Zero Typos or Number Substitutions",
            "✔ Secure 256-bit AES Encryption"
          ]
        },
        {
          url: "http://chase-bank-verify-account.cc",
          domain: "chase-bank-verify-account.cc",
          isSafe: false,
          checks: [
            "✖ Insecure HTTP (Cleartext Data Transmission)",
            "✖ Suspicious .cc island TLD",
            "✖ Hyphenated credential phishing trap",
            "✖ No Verified Identity Certificate"
          ]
        }
      ]
    },
    {
      targetSite: "Software Driver & Utility Download",
      options: [
        {
          url: "https://freedriverupdate-fastinstaller.xyz",
          domain: "freedriverupdate-fastinstaller.xyz",
          isSafe: false,
          checks: [
            "✖ High-risk .xyz extension",
            "✖ Adware / Bundled Trojan Injector",
            "✖ Aggressive pop-up redirections",
            "✖ Self-signed untrusted certificate"
          ]
        },
        {
          url: "https://www.nvidia.com/drivers",
          domain: "nvidia.com",
          isSafe: true,
          checks: [
            "✔ Official Hardware Vendor Portal",
            "✔ Cryptographically Signed Package Signatures",
            "✔ Verified SHA256 Checksums",
            "✔ Valid Wildcard TLS Certificate"
          ]
        }
      ]
    }
  ];

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level5-theme">
        <div class="level-badge-header crimson">
          <span class="lvl-tag">LEVEL 5</span>
          <span class="lvl-title">🌐 SAFE INTERNET BROWSING</span>
        </div>
        <p class="game-instruction">Inspect SSL certificates, domain spelling, and download safety. Pick the SAFE portal!</p>

        <div class="detective-round-tag" id="browsingRoundTag">CASE 1 OF 2: SECURE BANKING</div>

        <div class="browser-cards-deck" id="safeBrowseDeck"></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">SITES VERIFIED:</span> <span class="val" id="sitesVal">0 / 2</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">01:15</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> HTTPS encrypts communications, but always verify domain spelling (.com vs .cc) and official vendor sources!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const deck = document.getElementById("safeBrowseDeck");
    const roundTag = document.getElementById("browsingRoundTag");
    const sitesVal = document.getElementById("sitesVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let currentCaseIdx = 0;
    let verifiedCount = 0;
    let lives = 3;

    function renderCase() {
      deck.innerHTML = "";
      const current = CASES[currentCaseIdx];
      roundTag.textContent = `CASE ${currentCaseIdx + 1} OF ${CASES.length}: ${current.targetSite.toUpperCase()}`;

      current.options.forEach(opt => {
        const card = document.createElement("div");
        card.className = "browser-inspect-card";
        card.innerHTML = `
          <div class="browser-window-header">
            <span class="mac-dot r"></span>
            <span class="mac-dot y"></span>
            <span class="mac-dot g"></span>
            <div class="browser-address-bar ${opt.isSafe ? 'ssl-valid' : 'ssl-invalid'}">
              <span class="lock-icon">${opt.isSafe ? '🔒' : '⚠️'}</span>
              <span class="address-text">${opt.url}</span>
            </div>
          </div>

          <div class="browser-preview-body">
            <h4 class="brand-heading">${opt.domain}</h4>
            <ul class="checklist-items">
              ${opt.checks.map(c => `<li class="${c.startsWith('✔') ? 'check' : 'cross'}">${c}</li>`).join('')}
            </ul>
          </div>

          <div class="browser-action-footer">
            <button class="choice-btn real-btn" data-choice="safe">
              ✔ SECURE & TRUSTED
            </button>
            <button class="choice-btn fake-btn" data-choice="unsafe">
              ✖ UNTRUSTED / THREAT
            </button>
          </div>
        `;

        const btnSafe = card.querySelector(".real-btn");
        const btnUnsafe = card.querySelector(".fake-btn");

        btnSafe.addEventListener("click", () => evaluate(opt, true, card));
        btnUnsafe.addEventListener("click", () => evaluate(opt, false, card));

        deck.appendChild(card);
      });
    }

    function evaluate(opt, choseSafe, cardEl) {
      if (cardEl.classList.contains("evaluated")) return;
      cardEl.classList.add("evaluated");

      const isCorrect = (choseSafe && opt.isSafe) || (!choseSafe && !opt.isSafe);

      if (isCorrect) {
        Sound.good();
        cardEl.classList.add("correct-highlight");
        if (opt.isSafe) {
          verifiedCount++;
          sitesVal.textContent = `${verifiedCount} / ${CASES.length}`;
          setTimeout(() => {
            currentCaseIdx++;
            if (currentCaseIdx >= CASES.length) endGame(true);
            else renderCase();
          }, 700);
        }
      } else {
        Sound.bad();
        lives--;
        livesVal.textContent = "❤️".repeat(Math.max(0, lives));
        cardEl.classList.add("wrong-highlight");
        alert(opt.isSafe ? "That was actually an authentic trusted domain!" : "Danger! You trusted an insecure phishing/trojan mirror!");
        if (lives <= 0) endGame(false);
      }
    }

    renderCase();

    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(verifiedCount >= CASES.length);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 5,
          won: won,
          score: won ? 400 : 80,
          title: "Level 5: Safe Internet Browsing",
          message: won
            ? "Perimeter secure! Your rigorous SSL/TLS verification and domain audits stopped rogue download mirrors."
            : "Insecure browsing detected! Remember to verify SSL certificates and avoid high-risk TLDs."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
