// CyberQuest Level 5: a short, friendly ransomware safety quiz.
const QuestLevel5Ransomware = (function() {
  let container;
  let onComplete;
  let questionIndex = 0;
  let correctCount = 0;
  let ended = false;

  const questions = [
    {
      prompt: "What can ransomware do to a computer?",
      options: ["Lock files", "Make the screen brighter", "Add more game lives", "Clean the keyboard"],
      answer: 0,
      hint: "It can lock files and ask for money."
    },
    {
      prompt: "A file suddenly looks locked. What is the safest next step?",
      options: ["Pay the pop-up", "Tell a trusted adult right away", "Click more links", "Try a random download"],
      answer: 1,
      hint: "Stop and get help from a trusted adult."
    },
    {
      prompt: "A pop-up asks for money to unlock files. What should you do?",
      options: ["Ask an adult for help", "Enter a card number", "Share your password", "Ignore the grown-ups"],
      answer: 0,
      hint: "Never pay or share details by yourself."
    }
  ];

  function finish() {
    if (ended) return;
    ended = true;
    onComplete?.({ levelId: 5, won: correctCount >= 2, score: correctCount * 100 });
  }

  function renderQuestion() {
    if (questionIndex >= questions.length) return finish();
    const question = questions[questionIndex];
    const prompt = container.querySelector("#questRansomPrompt");
    const options = container.querySelector("#questRansomOptions");
    const feedback = container.querySelector("#questRansomFeedback");
    const next = container.querySelector("#questRansomNext");
    const progress = container.querySelector("#questRansomProgress");
    prompt.textContent = question.prompt;
    feedback.textContent = "Choose the safest answer.";
    next.classList.add("hidden");
    progress.textContent = `CLUE ${questionIndex + 1} / ${questions.length}`;
    options.replaceChildren();

    question.options.forEach((text, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quest-answer-choice";
      button.textContent = text;
      button.addEventListener("click", () => {
        if (ended || button.disabled) return;
        options.querySelectorAll("button").forEach(choice => { choice.disabled = true; });
        if (index === question.answer) {
          correctCount++;
          button.classList.add("answer-correct");
          feedback.textContent = "Great answer! The octopus gets a tentacle star.";
          container.querySelectorAll(".quest-tentacle")[questionIndex]?.classList.add("tentacle-grown");
        } else {
          button.classList.add("answer-wrong");
          options.children[question.answer]?.classList.add("answer-correct");
          feedback.textContent = question.hint;
        }
        next.classList.remove("hidden");
      });
      options.appendChild(button);
    });
  }

  function init(containerElement, completionCallback) {
    container = containerElement;
    onComplete = completionCallback;
    questionIndex = 0;
    correctCount = 0;
    ended = false;
    container.innerHTML = `
      <section class="game-stage quest-ransom-game">
        <div class="quest-octopus-card">
          <div class="quest-octopus" aria-hidden="true">🐙</div>
          <div><strong>Help Octi rescue the files!</strong><small>Answer three quick clues.</small></div>
          <div class="quest-tentacle-row" aria-label="Three clue stars">
            <span class="quest-tentacle">★</span><span class="quest-tentacle">★</span><span class="quest-tentacle">★</span>
          </div>
        </div>
        <div class="quest-ransom-quiz">
          <span class="quest-ransom-progress" id="questRansomProgress"></span>
          <h3 id="questRansomPrompt"></h3>
          <div class="quest-answer-list" id="questRansomOptions"></div>
          <p class="quest-game-feedback" id="questRansomFeedback" aria-live="polite"></p>
          <button type="button" class="quest-retry-button hidden" id="questRansomNext">Next clue</button>
        </div>
      </section>`;
    container.querySelector("#questRansomNext")?.addEventListener("click", () => {
      questionIndex++;
      renderQuestion();
    });
    renderQuestion();
  }

  function cleanup() { ended = true; }
  return { init, cleanup };
})();
