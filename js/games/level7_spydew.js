// Level 7: Spy Device Hunt
const Level7_SpyDevice = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const OBJECTS = [
    { id: 1, name: "Keyboard cable", isBug: true, icon: "⌨️", detail: "A hidden gadget is attached. Tell a trusted adult." },
    { id: 2, name: "Room alarm", isBug: true, icon: "🚨", detail: "This alarm looks different. Ask an adult to check it." },
    { id: 3, name: "Power strip", isBug: true, icon: "🔌", detail: "A strange add-on is hiding here. Do not touch it." },
    { id: 4, name: "Desk plant", isBug: false, icon: "🪴", detail: "Just a plant. Nothing strange here." },
    { id: 5, name: "Wall clock", isBug: false, icon: "🕰️", detail: "Just a regular clock." },
    { id: 6, name: "Coffee mug", isBug: false, icon: "☕", detail: "Just a mug." },
    { id: 7, name: "Bookshelf", isBug: false, icon: "📚", detail: "Just some books." },
    { id: 8, name: "Whiteboard", isBug: false, icon: "📋", detail: "Just a whiteboard." }
  ];

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level7-theme">
        <div class="level-badge-header green">
          <span class="lvl-tag">LEVEL 6</span>
          <span class="lvl-title">🕵️ SPY GADGET SEARCH</span>
        </div>
        <p class="game-instruction">Tap clues to find three hidden gadgets. Never touch strange devices in real life.</p>

        <!-- Room Scene Grid -->
        <div class="spy-room-arena" id="roomArena">
          <div class="room-grid" id="roomGrid"></div>
        </div>

        <!-- Inspection Result Toast -->
        <div class="spy-inspect-status" id="inspectToast">Tap any office fixture to sweep for surveillance hardware.</div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">GADGETS FOUND:</span> <span class="val" id="bugsVal">0 / 3</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> If a gadget seems out of place, leave it and tell a trusted adult.
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const grid = document.getElementById("roomGrid");
    const toast = document.getElementById("inspectToast");
    const bugsVal = document.getElementById("bugsVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let bugsFound = 0;
    let lives = 3;

    OBJECTS.sort(() => Math.random() - 0.5).forEach(obj => {
      const tile = document.createElement("div");
      tile.className = "room-inspect-tile";
      tile.innerHTML = `
        <div class="obj-icon">${obj.icon}</div>
        <div class="obj-name">${obj.name}</div>
      `;

      tile.addEventListener("click", () => {
        if (tile.classList.contains("inspected")) return;
        tile.classList.add("inspected");

        toast.textContent = obj.detail;

        if (obj.isBug) {
          Sound.win();
          tile.classList.add("found-bug");
          bugsFound++;
          bugsVal.textContent = `${bugsFound} / 3`;
          if (bugsFound >= 3) {
            endGame(true);
          }
        } else {
          Sound.scan();
          tile.classList.add("clean-fixture");
        }
      });

      grid.appendChild(tile);
    });

    let timeLeft = window.CyberGameRuntime?.getTimeLimitSeconds?.(150) || 150;
    timeVal.textContent = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - (window.CyberGameRuntime?.getSpeedScale?.() || 1));
      const displayTime = Math.ceil(timeLeft);
      const mins = String(Math.floor(displayTime / 60)).padStart(2, "0");
      const secs = String(displayTime % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(bugsFound >= 3);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 7,
          won: won,
          score: won ? 380 : 80,
          title: "Level 7: Spy Device Hunt",
          message: won
            ? "Meeting room sanitized! All covert surveillance implants were successfully purged."
            : "Surveillance eavesdropped on confidential data! Always physically inspect workstation cabling."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
