// Level 3: Spyware Hunter Smartphone Simulator
const Level3_Spyware = (function() {
  let timerInterval = null;
  let container = null;
  let onCompleteCallback = null;

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  const APPS = [
    { id: 1, name: "Calculator", icon: "🧮", isSpy: false, desc: "Standard math utility.", perm: "None" },
    { id: 2, name: "Camera", icon: "📷", isSpy: false, desc: "System camera.", perm: "Camera access" },
    { id: 3, name: "Notes", icon: "📝", isSpy: false, desc: "Text note taking.", perm: "Local storage" },
    { id: 4, name: "Gallery", icon: "🖼️", isSpy: false, desc: "Photos viewer.", perm: "Media storage" },
    { id: 5, name: "Free Wifi Booster", icon: "😈", isSpy: true, desc: "Untrusted app tracking background locations and SMS.", perm: "SMS, Location, Root" },
    { id: 6, name: "Weather", icon: "🌤️", isSpy: false, desc: "Forecast widget.", perm: "Coarse Location" },
    { id: 7, name: "Flash Update", icon: "💀", isSpy: true, desc: "Fake installer delivering keylogger spyware.", perm: "Full device control" },
    { id: 8, name: "Music", icon: "🎵", isSpy: false, desc: "Audio player.", perm: "Audio playback" },
    { id: 9, name: "Battery Saver Pro", icon: "🔋", isSpy: true, desc: "Trojan ad-injector draining data silently.", perm: "Contacts, Microphone, Overlays" },
    { id: 10, name: "Game Hub", icon: "🎮", isSpy: false, desc: "Verified arcade app.", perm: "Network access" },
    { id: 11, name: "Security", icon: "🛡️", isSpy: false, desc: "OS Defender.", perm: "Security scans" },
    { id: 12, name: "Settings", icon: "⚙️", isSpy: false, desc: "System preferences.", perm: "System control" }
  ];

  function render() {
    container.innerHTML = `
      <div class="game-stage level3-theme">
        <div class="level-badge-header green">
          <span class="lvl-tag">LEVEL 3</span>
          <span class="lvl-title">🕵️ SPYWARE HUNTER</span>
        </div>
        <p class="game-instruction">Inspect permissions. Find and remove all 3 hidden spyware apps!</p>

        <div class="tablet-simulator-frame">
          <div class="tablet-top-status">
            <span>9:41</span>
            <span>LTE 100% 🔋</span>
          </div>

          <div class="tablet-app-grid" id="appGrid"></div>

          <!-- Tablet Scan & HP Panel -->
          <div class="tablet-scan-panel">
            <button class="tablet-scan-btn" id="btnScan">
              <span class="pulse-ring"></span>
              🔍 SCAN x2
            </button>
            <div class="tablet-hp-wrap">
              <span class="hp-lbl">HP:</span>
              <span class="hp-hearts" id="hpDisplay">❤️❤️❤️</span>
            </div>
          </div>
        </div>

        <!-- App Inspection Modal -->
        <div class="app-inspect-modal hidden" id="inspectModal">
          <div class="modal-card">
            <div class="inspect-icon" id="insIcon">📱</div>
            <h3 id="insName">App Name</h3>
            <p id="insDesc">App description</p>
            <div class="inspect-perm-box">
              <strong>Permissions:</strong> <span id="insPerm">Storage</span>
            </div>
            <div class="inspect-actions">
              <button class="btn-uninstall-spy" id="btnUninstall">🗑️ Uninstall Spyware</button>
              <button class="btn-keep-app" id="btnKeep">✅ Keep (Safe App)</button>
            </div>
          </div>
        </div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">SPYWARE PURGED:</span> <span class="val" id="purgedVal">0 / 3</span></div>
          <div class="stat-item"><span class="lbl">TIME LEFT:</span> <span class="val" id="timeVal">02:30</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Not every app is what it seems! Check permissions like SMS, Microphones, and Contacts.
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const grid = document.getElementById("appGrid");
    const inspectModal = document.getElementById("inspectModal");
    const insIcon = document.getElementById("insIcon");
    const insName = document.getElementById("insName");
    const insDesc = document.getElementById("insDesc");
    const insPerm = document.getElementById("insPerm");
    const btnUninstall = document.getElementById("btnUninstall");
    const btnKeep = document.getElementById("btnKeep");
    const btnScan = document.getElementById("btnScan");
    const hpDisplay = document.getElementById("hpDisplay");
    const purgedVal = document.getElementById("purgedVal");
    const timeVal = document.getElementById("timeVal");

    let lives = 3;
    let purged = 0;
    let scansLeft = 2;
    let selectedApp = null;
    let isScanned = false;

    APPS.forEach(app => {
      const item = document.createElement("div");
      item.className = "tablet-app-item";
      item.id = "app_" + app.id;
      item.innerHTML = `
        <div class="app-icon-wrap">${app.icon}</div>
        <span class="app-label">${app.name}</span>
        <span class="threat-indicator"></span>
      `;
      item.addEventListener("click", () => openInspect(app));
      grid.appendChild(item);
    });

    btnScan.addEventListener("click", () => {
      if (scansLeft > 0) {
        scansLeft--;
        Sound.scan();
        isScanned = true;
        btnScan.innerHTML = `🔍 SCAN x${scansLeft}`;
        if (scansLeft === 0) btnScan.classList.add("disabled");

        // Reveal threat warnings on suspect apps
        APPS.forEach(app => {
          const el = document.getElementById("app_" + app.id);
          if (app.isSpy && el) {
            el.classList.add("flagged-threat");
          }
        });
      }
    });

    function openInspect(app) {
      selectedApp = app;
      Sound.click();
      insIcon.textContent = app.icon;
      insName.textContent = app.name;
      insDesc.textContent = app.desc;
      insPerm.textContent = app.perm;
      inspectModal.classList.remove("hidden");
    }

    btnUninstall.addEventListener("click", () => {
      inspectModal.classList.add("hidden");
      if (!selectedApp) return;

      const appEl = document.getElementById("app_" + selectedApp.id);
      if (selectedApp.isSpy) {
        Sound.good();
        purged++;
        purgedVal.textContent = `${purged} / 3`;
        if (appEl) {
          appEl.classList.add("uninstalled");
          appEl.innerHTML = `<div class="app-icon-wrap">🚫</div><span class="app-label">Removed</span>`;
        }
        if (purged >= 3) {
          endGame(true);
        }
      } else {
        Sound.bad();
        lives--;
        hpDisplay.textContent = "❤️".repeat(Math.max(0, lives)) + "🖤".repeat(3 - Math.max(0, lives));
        alert(`⚠️ Oops! "${selectedApp.name}" was a legitimate app. Don't remove safe tools!`);
        if (lives <= 0) {
          endGame(false);
        }
      }
    });

    btnKeep.addEventListener("click", () => {
      inspectModal.classList.add("hidden");
      if (!selectedApp) return;
      if (selectedApp.isSpy) {
        Sound.bad();
        lives--;
        hpDisplay.textContent = "❤️".repeat(Math.max(0, lives)) + "🖤".repeat(3 - Math.max(0, lives));
        alert(`⚠️ Warning! You allowed "${selectedApp.name}" to continue snooping on your data!`);
        if (lives <= 0) {
          endGame(false);
        }
      } else {
        Sound.good();
      }
    });

    // Timer (90s = 01:30)
    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) {
        endGame(purged >= 3);
      }
    }, 1000);

    function endGame(won) {
      cleanup();
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 3,
          won: won,
          score: won ? 300 : 70,
          title: "Level 3: Spyware Hunter",
          message: won
            ? "Mobile perimeter secure! You identified and neutralized all disguised background spyware packages."
            : "Spyware breached personal data! Remember to always check permissions before granting trust."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
  }

  return { init, cleanup };
})();
