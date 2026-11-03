// Level 6: Clone Phishing Forensic Inspector
const Level6_ClonePhishing = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const SAMPLES = [
    {
      subject: "Urgent: Updated Invoice #INV-9842 for Cloud Migration",
      senderOriginal: "billing@aws-invoicing.amazon.com",
      senderClone: "billing@aws-invoicing-amazon.support",
      amount: "$14,500.00",
      attachmentOriginal: "Invoice_9842.pdf (SHA256: e8b4...)",
      attachmentClone: "Invoice_9842.pdf.exe (Disguised Executable)",
      targetFakeIndex: 1
    }
  ];

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    const s = SAMPLES[0];
    container.innerHTML = `
      <div class="game-stage level6-theme">
        <div class="level-badge-header blue">
          <span class="lvl-tag">LEVEL 6</span>
          <span class="lvl-title">👥 CLONE PHISHING FORENSICS</span>
        </div>
        <p class="game-instruction">An attacker duplicated a genuine email. Inspect headers and spot the CLONED trap!</p>

        <div class="clone-comparison-deck">
          <!-- Email A -->
          <div class="email-inspect-card" id="cardA">
            <div class="mail-header-top">
              <span class="tag">EMAIL SAMPLE A</span>
              <span class="sub-txt">${s.subject}</span>
            </div>
            <div class="mail-field"><strong>FROM:</strong> ${s.senderOriginal}</div>
            <div class="mail-field"><strong>ATTACHMENT:</strong> 📄 ${s.attachmentOriginal}</div>
            <div class="mail-field"><strong>PAYMENT GATEWAY:</strong> Verified ACH Wire Transfer</div>
            <button class="btn-flag-clone" data-sample="A">🚨 MARK SAMPLE A AS CLONE</button>
          </div>

          <!-- Email B -->
          <div class="email-inspect-card clone-suspect" id="cardB">
            <div class="mail-header-top">
              <span class="tag">EMAIL SAMPLE B</span>
              <span class="sub-txt">${s.subject}</span>
            </div>
            <div class="mail-field"><strong>FROM:</strong> <span class="hl-red">${s.senderClone}</span></div>
            <div class="mail-field"><strong>ATTACHMENT:</strong> ⚠️ <span class="hl-red">${s.attachmentClone}</span></div>
            <div class="mail-field"><strong>PAYMENT GATEWAY:</strong> Immediate Crypto Wallet Address</div>
            <button class="btn-flag-clone" data-sample="B">🚨 MARK SAMPLE B AS CLONE</button>
          </div>
        </div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">STATUS:</span> <span class="val" id="forensicVal">Auditing Headers</span></div>
          <div class="stat-item"><span class="lbl">TIME:</span> <span class="val" id="timeVal">02:30</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Clone Phishing uses double-extension files (e.g. <code>.pdf.exe</code>) and lookalike support domains!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const timeVal = document.getElementById("timeVal");
    const forensicVal = document.getElementById("forensicVal");
    const btns = container.querySelectorAll(".btn-flag-clone");

    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        const sample = btn.dataset.sample;
        if (sample === "B") {
          Sound.win();
          forensicVal.textContent = "CLONE IDENTIFIED";
          alert("✅ OUTSTANDING! Sample B had a deceptive domain (.support) and a masked executable (.pdf.exe)!");
          endGame(true);
        } else {
          Sound.bad();
          alert("❌ ERROR: Sample A was the authentic enterprise email. Look closely at the double extension (.pdf.exe) in Sample B!");
          endGame(false);
        }
      });
    });

    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(false);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 6,
          won: won,
          score: won ? 450 : 90,
          title: "Level 6: Clone Phishing",
          message: won
            ? "Clone unmasked! Your forensic analysis caught the disguised executable and lookalike domain."
            : "Malicious payload detonated! Always inspect file extensions and return path headers."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
