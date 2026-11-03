// Level 11 (Bonus): Cloud Security & API Key Leak Defense
const Level11_CloudSec = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  const CLOUD_ASSETS = [
    { id: 1, name: "Customer Data S3 Bucket", status: "Publicly Readable", isVulnerable: true, action: "Make Private (Restrict IAM)" },
    { id: 2, name: "Production Stripe Secret Key", status: "Hardcoded in public git commit", isVulnerable: true, action: "Revoke Key & Move to Vault" },
    { id: 3, name: "CloudFront CDN Distribution", status: "Enforced TLS 1.3 & WAF", isVulnerable: false, action: "Keep Secure Config" },
    { id: 4, name: "PostgreSQL Database Port 5432", status: "Exposed to 0.0.0.0/0 All IPs", isVulnerable: true, action: "Isolate to VPC Private Subnet" }
  ];

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level2-theme">
        <div class="level-badge-header blue">
          <span class="lvl-tag">BONUS LEVEL 11</span>
          <span class="lvl-title">☁️ CLOUD SECURITY & API DEFENSE</span>
        </div>
        <p class="game-instruction">Remediate cloud misconfigurations: Secure public buckets, revoke exposed API keys, and isolate VPC subnets!</p>

        <div class="cloud-assets-grid" id="cloudGrid"></div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">ASSETS REMEDIATED:</span> <span class="val" id="remedVal">0 / 3</span></div>
          <div class="stat-item"><span class="lbl">TIME:</span> <span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">LIVES:</span> <span class="val" id="livesVal">❤️❤️❤️</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Never commit plaintext API secrets into git repositories or leave storage buckets set to public read!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const grid = document.getElementById("cloudGrid");
    const remedVal = document.getElementById("remedVal");
    const timeVal = document.getElementById("timeVal");
    const livesVal = document.getElementById("livesVal");

    let remediated = 0;
    let target = 3;
    let lives = 3;

    CLOUD_ASSETS.forEach(item => {
      const card = document.createElement("div");
      card.className = "cloud-asset-card";
      card.innerHTML = `
        <div class="cloud-header">
          <span class="cloud-ic">☁️</span>
          <div>
            <div class="cloud-name">${item.name}</div>
            <div class="cloud-status ${item.isVulnerable ? 'vuln' : 'secure'}">${item.status}</div>
          </div>
        </div>
        <button class="btn-remediate" data-id="${item.id}">
          ${item.isVulnerable ? '🛡️ ' + item.action : '✔ Verified Compliant'}
        </button>
      `;

      card.querySelector(".btn-remediate").addEventListener("click", () => {
        if (card.classList.contains("done")) return;
        card.classList.add("done");

        if (item.isVulnerable) {
          Sound.good();
          remediated++;
          remedVal.textContent = `${remediated} / ${target}`;
          card.querySelector(".cloud-status").textContent = "Hardened & Enforced";
          card.querySelector(".cloud-status").className = "cloud-status secure";
          if (remediated >= target) endGame(true);
        } else {
          Sound.bad();
          lives--;
          livesVal.textContent = "❤️".repeat(Math.max(0, lives));
          alert("This cloud resource was already configured with TLS 1.3 and WAF!");
          if (lives <= 0) endGame(false);
        }
      });

      grid.appendChild(card);
    });

    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) endGame(remediated >= target);
    }, 1000);

    function endGame(won) {
      clearInterval(timerInterval);
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 11,
          won: won,
          score: won ? 450 : 90,
          title: "Level 11: Cloud Security",
          message: won
            ? "Cloud architecture fortified! Public S3 buckets sealed, exposed secrets rotated, and database ports air-gapped."
            : "Cloud data breach! Never expose cloud credentials or leave storage resources publicly accessible."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
