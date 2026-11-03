// CyberQuest Level 4: inspect pretend files and leave surprise downloads alone.
const QuestLevel4Files = (function() {
  let container;
  let onComplete;
  let ended = false;
  let safeFound = 0;
  let hearts = 3;
  let score = 0;

  const files = [
    { name: "homework.pdf", icon: "📄", safe: true, clue: "Homework" },
    { name: "photo.png", icon: "🖼️", safe: true, clue: "Photo" },
    { name: "class-notes.docx", icon: "📝", safe: true, clue: "Notes" },
    { name: "free-gems.exe", icon: "☣️", safe: false, clue: "Surprise app" },
    { name: "bonus-player.exe", icon: "☣️", safe: false, clue: "Unknown app" },
    { name: "mystery-files.zip", icon: "📦", safe: false, clue: "Unknown file" }
  ];

  function finish(won) {
    if (ended) return;
    ended = true;
    onComplete?.({ levelId: 4, won, score: won ? score + 100 : score });
  }

  function updateStats() {
    const lives = container.querySelector("#questFileLives");
    const found = container.querySelector("#questFileFound");
    const points = container.querySelector("#questFileScore");
    if (lives) lives.textContent = "❤️".repeat(hearts) || "💙";
    if (found) found.textContent = `${safeFound} / 3`;
    if (points) points.textContent = String(score);
  }

  function init(containerElement, completionCallback) {
    container = containerElement;
    onComplete = completionCallback;
    ended = false;
    safeFound = 0;
    hearts = 3;
    score = 0;
    container.innerHTML = `
      <section class="game-stage quest-file-game">
        <div class="quest-file-grid" id="questFileGrid"></div>
        <div class="game-footer-stats quest-file-stats">
          <div class="stat-item"><span class="lbl">HEARTS</span><span class="val" id="questFileLives">❤️❤️❤️</span></div>
          <div class="stat-item"><span class="lbl">SAFE FILES</span><span class="val" id="questFileFound">0 / 3</span></div>
          <div class="stat-item"><span class="lbl">STARS</span><span class="val" id="questFileScore">0</span></div>
        </div>
        <p class="quest-game-feedback" id="questFileFeedback" aria-live="polite">Choose a familiar file. Leave surprise downloads alone.</p>
      </section>`;

    const grid = container.querySelector("#questFileGrid");
    [...files].sort(() => Math.random() - 0.5).forEach(file => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `quest-file-tile ${file.safe ? "file-safe" : "file-unknown"}`;
      button.setAttribute("aria-label", `${file.name}, ${file.clue}`);
      const icon = document.createElement("span");
      icon.className = "quest-file-icon";
      icon.textContent = file.icon;
      const name = document.createElement("b");
      name.textContent = file.name;
      const clue = document.createElement("small");
      clue.textContent = file.clue;
      button.append(icon, name, clue);
      button.addEventListener("click", () => {
        if (ended || button.disabled) return;
        button.disabled = true;
        if (file.safe) {
          safeFound++;
          score += 40;
          button.classList.add("found-safe");
          clue.textContent = "Safe pick! ✓";
          container.querySelector("#questFileFeedback").textContent = "Good choice! Keep checking the file name.";
          if (safeFound === 3) finish(true);
        } else {
          hearts--;
          button.classList.add("found-risky");
          clue.textContent = "Leave it alone";
          container.querySelector("#questFileFeedback").textContent = "Unknown downloads can be risky. Ask a trusted adult.";
          if (hearts <= 0) finish(false);
        }
        updateStats();
      });
      grid.appendChild(button);
    });
    updateStats();
  }

  function cleanup() { ended = true; }
  return { init, cleanup };
})();
