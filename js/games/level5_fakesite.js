// Level 5: Fake Website Detective
const Level5_FakeSite = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const ROUNDS = [
    {
      brand: "Amazon Online Store",
      options: [
        {
          id: "a1",
          url: "https://www.amazon.in",
          display: "amazon.in",
          isReal: true,
          points: [
            "✔ HTTPS Secure Lock",
            "✔ Valid Digicert Certificate",
            "✔ Correct Spelling",
            "✔ Official Domain"
          ]
        },
        {
          id: "a2",
          url: "http://amaz0n-offer.com",
          display: "amaz0n-offer.com",
          isReal: false,
          points: [
            "✖ No HTTPS (Insecure)",
            "✖ Zero '0' in domain name",
            "✖ Suspicious discount lure",
            "✖ Untrusted Registrar"
          ]
        },
        {
          id: "a3",
          url: "https://amazon-secure.xyz",
          display: "amazon-secure.xyz",
          isReal: false,
          points: [
            "✖ Suspicious .xyz extension",
            "✖ Self-signed fake cert",
            "✖ Multiple ad redirects",
            "✖ Phishing credential harvester"
          ]
        }
      ]
    },
    {
      brand: "Online Banking Portal",
      options: [
        {
          id: "b1",
          url: "http://sbi-login-verify.net",
          display: "sbi-login-verify.net",
          isReal: false,
          points: [
            "✖ No official SSL encryption",
            "✖ Hyphenated lookalike domain",
            "✖ Asks for debit card PIN immediately",
            "✖ Hosted on rogue cloud server"
          ]
        },
        {
          id: "b2",
          url: "https://www.onlinesbi.sbi",
          display: "onlinesbi.sbi",
          isReal: true,
          points: [
            "✔ Official .sbi bank TLD",
            "✔ Extended Validation (EV) SSL",
            "✔ Verified Issuer",
            "✔ Official 2FA Gateway"
          ]
        },
        {
          id: "b3",
          url: "https://on1ine-sbi-portal.com",
          display: "on1ine-sbi-portal.com",
          isReal: false,
          points: [
            "✖ '1' substituted for 'l'",
            "✖ Typosquatting attack",
            "✖ Phishing credential clone",
            "✖ Unknown registrar"
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
          <span class="lvl-title">🌐 FAKE WEBSITE DETECTIVE</span>
        </div>
        <p class="game-instruction">Examine the URL, SSL badge, and indicators. Identify the REAL website!</p>

        <div class="detective-round-tag" id="roundHeader">CASE 1 OF 2: AMAZON PORTAL</div>

        <!-- Scrollable Browser Cards Carousel -->
        <div class="browser-cards-deck" id="cardsDeck"></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">CORRECT SITES:</span> <span class="val" id="correctVal">0 / 2</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">01:15</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Check URL spelling, HTTPS lock, and top-level domain carefully!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const deck = document.getElementById("cardsDeck");
    const roundHeader = document.getElementById("roundHeader");
    const correctVal = document.getElementById("correctVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let currentRoundIdx = 0;
    let correctCount = 0;
    let lives = 3;

    function renderRound() {
      deck.innerHTML = "";
      const current = ROUNDS[currentRoundIdx];
      roundHeader.textContent = `CASE ${currentRoundIdx + 1} OF ${ROUNDS.length}: ${current.brand.toUpperCase()}`;

      current.options.forEach(opt => {
        const card = document.createElement("div");
        card.className = "browser-inspect-card";
        card.innerHTML = `
          <div class="browser-window-header">
            <span class="mac-dot r"></span>
            <span class="mac-dot y"></span>
            <span class="mac-dot g"></span>
            <div class="browser-address-bar ${opt.isReal ? 'ssl-valid' : 'ssl-invalid'}">
              <span class="lock-icon">${opt.isReal ? '🔒' : '⚠️'}</span>
              <span class="address-text">${opt.url}</span>
            </div>
          </div>

          <div class="browser-preview-body">
            <h4 class="brand-heading">${opt.display}</h4>
            <ul class="checklist-items">
              ${opt.points.map(pt => `<li class="${pt.startsWith('✔') ? 'check' : 'cross'}">${pt}</li>`).join('')}
            </ul>
          </div>

          <div class="browser-action-footer">
            <button class="choice-btn real-btn" data-choice="real">
              REAL WEBSITE
            </button>
            <button class="choice-btn fake-btn" data-choice="fake">
              FAKE WEBSITE
            </button>
          </div>
        `;

        const btnReal = card.querySelector(".real-btn");
        const btnFake = card.querySelector(".fake-btn");

        btnReal.addEventListener("click", () => handleChoice(opt, true, card));
        btnFake.addEventListener("click", () => handleChoice(opt, false, card));

        deck.appendChild(card);
      });
    }

    function handleChoice(opt, choseReal, cardEl) {
      if (cardEl.classList.contains("evaluated")) return;
      cardEl.classList.add("evaluated");

      const isCorrect = (choseReal && opt.isReal) || (!choseReal && !opt.isReal);

      if (isCorrect) {
        Sound.good();
        cardEl.classList.add("correct-highlight");
        if (opt.isReal) {
          correctCount++;
          correctVal.textContent = `${correctCount} / ${ROUNDS.length}`;
          setTimeout(() => {
            currentRoundIdx++;
            if (currentRoundIdx >= ROUNDS.length) {
              endGame(true);
            } else {
              renderRound();
            }
          }, 800);
        }
      } else {
        Sound.bad();
        lives--;
        livesVal.textContent = "❤️".repeat(Math.max(0, lives));
        cardEl.classList.add("wrong-highlight");
        alert(opt.isReal ? "That was actually the REAL secure portal!" : "Careful! You marked a dangerous phishing site as safe!");
        if (lives <= 0) {
          endGame(false);
        }
      }
    }

    renderRound();

    // Timer (150s = 02:30)
    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) {
        endGame(correctCount >= ROUNDS.length);
      }
    }, 1000);

    function endGame(won) {
      cleanup();
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 5,
          won: won,
          score: won ? 400 : 90,
          title: "Level 5: Fake Website Detective",
          message: won
            ? "Phishing foiled! Your forensic inspection of SSL badges and homograph URLs intercepted fake portals."
            : "Credential harvested! Remember: attackers substitute zero for O and use deceptive TLDs."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
