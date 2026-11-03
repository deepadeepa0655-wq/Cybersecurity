// Level 8: Baiting Attack Countermeasure Engine
const Level8_Baiting = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const CASES = [
    {
      title: "Found Hardware: Parking Lot Flash Drive",
      icon: "💾",
      scenario: "You find an unlabeled high-capacity USB thumb drive on the sidewalk outside company headquarters. A handwritten label reads: 'Q4 Executive Bonuses & Salaries'.",
      options: [
        { text: "Plug it into your workstation to see whose files they are.", correct: false, reason: "Fatal! Attackers intentionally drop infected media in parking lots to exploit human curiosity." },
        { text: "Take it directly to the IT Security Desk without plugging it into any device.", correct: true, reason: "Spot on! Security teams inspect unknown media inside isolated air-gapped sandboxes." },
        { text: "Format the drive quickly so you can keep the free storage.", correct: false, reason: "Dangerous! Malicious firmware (Rubber Ducky) can execute HID keystroke payloads the instant it is inserted." }
      ]
    },
    {
      title: "Promotional Mailer: Free High-Speed Charger",
      icon: "🎁",
      scenario: "Your team receives a mystery promotional package labeled 'Complimentary Smart USB Charging Cable' from an unverified vendor.",
      options: [
        { text: "Discard or submit to Security; malicious cables (O.MG cables) harbor covert wireless keystroke injection chips.", correct: true, reason: "Excellent vigilance! Hardware trojans can be embedded directly inside ordinary-looking USB cables." },
        { text: "Plug it into your corporate laptop to charge your mobile phone.", correct: false, reason: "Severe risk! Weaponized USB cables establish covert WiFi backdoors into host machines." }
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
      <div class="game-stage level8-theme">
        <div class="level-badge-header amber">
          <span class="lvl-tag">LEVEL 8</span>
          <span class="lvl-title">🎁 BAITING DEFENSE PROTOCOL</span>
        </div>
        <p class="game-instruction">Curiosity kills digital defense. Resist physical and digital bait traps!</p>

        <div class="bait-case-deck" id="baitDeck"></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">TRAPS DEFUSED:</span> <span class="val" id="trapsVal">0 / 2</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Never plug found USB drives or unknown hardware into any device!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const deck = document.getElementById("baitDeck");
    const trapsVal = document.getElementById("trapsVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let currentCase = 0;
    let lives = 3;

    function renderCase() {
      deck.innerHTML = "";
      const c = CASES[currentCase];
      trapsVal.textContent = `${currentCase} / ${CASES.length}`;

      const card = document.createElement("div");
      card.className = "bait-scenario-card";
      card.innerHTML = `
        <div class="bait-icon">${c.icon}</div>
        <h3 class="bait-title">${c.title}</h3>
        <p class="bait-desc">${c.scenario}</p>
        <div class="bait-options-group">
          ${c.options.map((opt, i) => `
            <button class="bait-btn" data-idx="${i}">
              ${opt.text}
            </button>
          `).join('')}
        </div>
      `;

      card.querySelectorAll(".bait-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.idx);
          const choice = c.options[idx];
          if (choice.correct) {
            Sound.good();
            alert(`✅ DEFUSED: ${choice.reason}`);
            currentCase++;
            if (currentCase >= CASES.length) endGame(true);
            else renderCase();
          } else {
            Sound.bad();
            lives--;
            livesVal.textContent = "❤️".repeat(Math.max(0, lives));
            alert(`❌ COMPROMISED: ${choice.reason}`);
            if (lives <= 0) endGame(false);
          }
        });
      });

      deck.appendChild(card);
    }

    renderCase();

    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(currentCase >= CASES.length);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 8,
          won: won,
          score: won ? 350 : 70,
          title: "Level 8: Baiting Awareness",
          message: won
            ? "Bait resisted! You thwarted curiosity lures and preserved hardware perimeter integrity."
            : "Infected by rogue media! Remember: free media often carries severe cyber payloads."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
