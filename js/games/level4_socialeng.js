// Level 4: Social Engineering Awareness Interactive Simulator
const Level4_SocialEngineering = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const SCENARIOS = [
    {
      caller: "Game Helper",
      avatar: "🎮",
      urgency: "FREE GEMS!",
      message: "A pop-up says: ‘Tap this surprise link and sign in to claim free gems!’",
      options: [
        { text: "Close it and ask a trusted adult before tapping links.", correct: true, explanation: "Good choice. Surprise prizes can be a trick." },
        { text: "Type your game password into the pop-up.", correct: false, explanation: "Keep your password private, even from a pop-up." },
        { text: "Send the link to your friends so they can try it.", correct: false, explanation: "That could spread the same trick to your friends." }
      ]
    },
    {
      caller: "A player in chat",
      avatar: "💬",
      urgency: "SIGN-IN CODE?",
      message: "Someone asks you to read out the six-digit code that just appeared on your screen.",
      options: [
        { text: "Keep the code private and tell a trusted adult.", correct: true, explanation: "A sign-in code is a secret. Do not share it in chat." },
        { text: "Read the code to them so they can help.", correct: false, explanation: "A stranger could use that code to enter your account." },
        { text: "Post the code in the game group.", correct: false, explanation: "Keep sign-in codes private from everyone." }
      ]
    },
    {
      caller: "A caller says they are support",
      avatar: "📞",
      urgency: "ACT RIGHT NOW!",
      message: "They say your game account will be deleted unless you tell them your password.",
      options: [
        { text: "Hang up and check with a trusted adult.", correct: true, explanation: "Pause and check with someone you trust." },
        { text: "Tell them the password to save the account.", correct: false, explanation: "Real helpers do not need your password." },
        { text: "Share a sign-in code instead.", correct: false, explanation: "Sign-in codes are private too." }
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
      <div class="game-stage level4-theme">
        <div class="level-badge-header green">
          <span class="lvl-tag">LEVEL 8</span>
          <span class="lvl-title">🎭 THINK BEFORE YOU SHARE</span>
        </div>
        <p class="game-instruction">Spot fake calls, prize pop-ups, and requests for sign-in codes.</p>

        <!-- Interactive Chat Terminal -->
        <div class="chat-terminal-wrap" id="chatWrap"></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">CLUE:</span> <span class="val" id="caseVal">1 / 3</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <p class="quest-game-feedback" id="questSocialFeedback" aria-live="polite">Pick the safest next step.</p>
        <button type="button" class="quest-retry-button hidden" id="questSocialNext">Next clue</button>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const chatWrap = document.getElementById("chatWrap");
    const caseVal = document.getElementById("caseVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");
    const feedback = document.getElementById("questSocialFeedback");
    const nextButton = document.getElementById("questSocialNext");

    let currentCase = 0;
    let lives = 3;

    function renderCase() {
      chatWrap.innerHTML = "";
      const sc = SCENARIOS[currentCase];
      if (!sc) return endGame(true);
      caseVal.textContent = `${currentCase + 1} / ${SCENARIOS.length}`;
      feedback.textContent = "Pick the safest next step.";
      nextButton.classList.add("hidden");

      const card = document.createElement("div");
      card.className = "chat-box-card";
      card.innerHTML = `
        <div class="chat-header">
          <span class="caller-avatar">${sc.avatar}</span>
          <div class="caller-info">
            <div class="caller-name">${sc.caller}</div>
            <div class="caller-urgency">${sc.urgency}</div>
          </div>
        </div>
        <div class="chat-incoming-bubble">
          ${sc.message}
        </div>
        <div class="chat-decision-prompt">WHAT SHOULD YOU DO?</div>
        <div class="chat-options-list">
          ${sc.options.map((opt, i) => `
            <button class="chat-opt-btn" data-idx="${i}">
              ${opt.text}
            </button>
          `).join('')}
        </div>
      `;

      card.querySelectorAll(".chat-opt-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.idx);
          const choice = sc.options[idx];
          if (choice.correct) {
            Sound.good();
            btn.classList.add("correct");
            feedback.textContent = choice.explanation;
            card.querySelectorAll(".chat-opt-btn").forEach(option => { option.disabled = true; });
            nextButton.textContent = currentCase + 1 >= SCENARIOS.length ? "Finish" : "Next clue";
            nextButton.classList.remove("hidden");
          } else {
            Sound.bad();
            btn.classList.add("wrong");
            lives--;
            livesVal.textContent = "❤️".repeat(Math.max(0, lives));
            feedback.textContent = choice.explanation;
            btn.disabled = true;
            if (lives <= 0) endGame(false);
          }
        });
      });

      chatWrap.appendChild(card);
    }

    renderCase();

    nextButton.addEventListener("click", () => {
      currentCase++;
      if (currentCase >= SCENARIOS.length) endGame(true);
      else renderCase();
    });

    let timeLeft = window.CyberGameRuntime?.getTimeLimitSeconds?.(150) || 150;
    timeVal.textContent = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - (window.CyberGameRuntime?.getSpeedScale?.() || 1));
      const displayTime = Math.ceil(timeLeft);
      const mins = String(Math.floor(displayTime / 60)).padStart(2, "0");
      const secs = String(displayTime % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(currentCase >= SCENARIOS.length);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 4,
          won: won,
          score: won ? 350 : 80,
          title: "Level 4: Social Engineering Awareness",
          message: won
            ? "Impersonator neutralized! You maintained strict verification discipline against executive pretexting."
            : "Social engineering breach! Remember: authority and urgency never override security policy."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
