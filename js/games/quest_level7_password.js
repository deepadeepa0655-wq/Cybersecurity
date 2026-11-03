// CyberQuest Level 7: choose a strong password for a made-up character.
const QuestLevel7Password = (function() {
  let onComplete;
  let ended = false;

  function finish() {
    if (ended) return;
    ended = true;
    onComplete?.({ levelId: 7, won: true, score: 350 });
  }

  function init(container, completionCallback) {
    onComplete = completionCallback;
    ended = false;
    container.innerHTML = `
      <section class="game-stage quest-password-game">
        <div class="quest-character-clue">
          <span aria-hidden="true">🦊</span>
          <div><b>Made-up game pal: StarPup</b><small>Favorite thing: space · These are pretend details.</small></div>
        </div>
        <p class="quest-password-question">Which password is strongest?</p>
        <div class="quest-password-options" id="questPasswordOptions"></div>
        <p class="quest-game-feedback" id="questPasswordFeedback" aria-live="polite">Choose one that does not use the character's details.</p>
      </section>`;

    const options = [
      { text: "StarPup123", strong: false },
      { text: "Space2024!", strong: false },
      { text: "12345678", strong: false },
      { text: "Mango_River!Orbit_47", strong: true }
    ];
    const list = container.querySelector("#questPasswordOptions");
    const feedback = container.querySelector("#questPasswordFeedback");
    options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quest-password-choice";
      button.textContent = option.text;
      button.addEventListener("click", () => {
        if (ended || button.disabled) return;
        if (option.strong) {
          button.classList.add("is-strong");
          feedback.textContent = "Correct! Long and not based on personal details.";
          finish();
        } else {
          button.classList.add("is-weak");
          button.disabled = true;
          feedback.textContent = "Try again. Skip names, favorite things, and easy number patterns.";
        }
      });
      list.appendChild(button);
    });
  }

  function cleanup() { ended = true; }
  return { init, cleanup };
})();
