// CyberQuest Level 3: choose the link that matches the trusted address.
const QuestLevel3Links = (function() {
  let container;
  let onComplete;
  let ended = false;

  const links = [
    { label: "https://class-library.example", safe: true },
    { label: "http://class-library-free-books.example", safe: false },
    { label: "https://class-librarry.example", safe: false },
    { label: "https://class-library.example.bad-link.test", safe: false }
  ];

  function finish(won) {
    if (ended) return;
    ended = true;
    onComplete?.({ levelId: 3, won, score: won ? 320 : 80 });
  }

  function init(containerElement, completionCallback) {
    container = containerElement;
    onComplete = completionCallback;
    ended = false;
    container.innerHTML = `
      <section class="game-stage quest-link-game">
        <div class="quest-link-window">
          <div class="quest-browser-bar"><span></span><span></span><span></span><b>Safe Link Safari</b></div>
          <div class="quest-link-question">Which address matches the class library?</div>
          <div class="quest-link-options" id="questLinkOptions"></div>
          <p class="quest-game-feedback" id="questLinkFeedback" aria-live="polite">Check the spelling from left to right.</p>
          <button type="button" class="quest-retry-button hidden" id="questLinkContinue">Try again</button>
        </div>
        <div class="quest-side-tip"><span>🌐</span><b>Think before you click!</b><small>A lock icon alone does not prove a site is safe.</small></div>
      </section>`;

    const list = container.querySelector("#questLinkOptions");
    const feedback = container.querySelector("#questLinkFeedback");
    const retry = container.querySelector("#questLinkContinue");
    const choices = [...links].sort(() => Math.random() - 0.5);
    choices.forEach(link => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quest-link-choice";
      button.textContent = link.label;
      button.addEventListener("click", () => {
        if (ended) return;
        if (link.safe) {
          button.classList.add("is-safe");
          feedback.textContent = "Nice check! The address matches.";
          finish(true);
          return;
        }
        button.classList.add("is-tricky");
        feedback.textContent = "That one has a trick. Check the whole address and try again.";
        button.disabled = true;
        retry.classList.remove("hidden");
      });
      list.appendChild(button);
    });
    retry?.addEventListener("click", () => {
      container.querySelectorAll(".quest-link-choice").forEach(button => {
        button.disabled = false;
        button.classList.remove("is-tricky");
      });
      feedback.textContent = "Check the spelling from left to right.";
      retry.classList.add("hidden");
    });
  }

  function cleanup() { ended = true; }
  return { init, cleanup };
})();
