// Level 2: Virus Outbreak Network Matrix
const Level2_Virus = (function() {
  let timerInterval = null;
  let spreadInterval = null;
  let container = null;
  let onCompleteCallback = null;

  function init(containerEl, onComplete) {
    container = containerEl;
    onCompleteCallback = onComplete;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="game-stage level2-theme">
        <div class="level-badge-header purple">
          <span class="lvl-tag">LEVEL 2</span>
          <span class="lvl-title">⚙️ VIRUS OUTBREAK</span>
        </div>
        <p class="game-instruction">Stop the virus before it infects all network systems!</p>

        <!-- Tool Selection Dock -->
        <div class="virus-action-dock">
          <button class="action-btn active" data-tool="clean">
            <span class="icon">🔵</span>
            <span class="text">Clean</span>
          </button>
          <button class="action-btn" data-tool="isolate">
            <span class="icon">🟠</span>
            <span class="text">Isolate</span>
          </button>
          <button class="action-btn" data-tool="firewall">
            <span class="icon">🛡️</span>
            <span class="text">Firewall</span>
          </button>
          <button class="action-btn" data-tool="scan">
            <span class="icon">🟢</span>
            <span class="text">Scan</span>
          </button>
        </div>

        <!-- Network Graph Canvas / Grid Container -->
        <div class="network-matrix-arena" id="matrixArena">
          <div class="matrix-grid" id="matrixGrid"></div>
        </div>

        <!-- Action Legend & Status -->
        <div class="matrix-legend">
          <span class="leg-item"><span class="dot clean"></span> Clean</span>
          <span class="leg-item"><span class="dot infected"></span> Infected</span>
          <span class="leg-item"><span class="dot isolated"></span> Isolated</span>
          <span class="leg-item"><span class="dot shielded"></span> Firewall</span>
        </div>

        <div class="game-footer-stats">
          <div class="stat-item"><span class="lbl">INFECTED:</span> <span class="val danger" id="infectedVal">20%</span></div>
          <div class="stat-item"><span class="lbl">TIME:</span> <span class="val" id="timeVal">02:30</span></div>
          <div class="stat-item"><span class="lbl">SYSTEMS SAVED:</span> <span class="val" id="savedVal">0 / 16</span></div>
        </div>

        <div class="game-tip-banner">
          💡 <strong>TIP:</strong> Scan, Isolate infected nodes first to stop propagation, then Clean!
        </div>
      </div>
    `;

    setupLogic();
  }

  function setupLogic() {
    const grid = document.getElementById("matrixGrid");
    const infectedVal = document.getElementById("infectedVal");
    const timeVal = document.getElementById("timeVal");
    const savedVal = document.getElementById("savedVal");
    const toolBtns = document.querySelectorAll(".virus-action-dock .action-btn");

    let currentTool = "clean";
    toolBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        Sound.click();
        toolBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentTool = btn.dataset.tool;
        if (currentTool === "scan") {
          performScan();
        }
      });
    });

    // 4x4 Grid of 16 interconnected nodes
    const totalNodes = 16;
    const nodes = [];

    for (let i = 0; i < totalNodes; i++) {
      const nodeEl = document.createElement("div");
      nodeEl.className = "network-node clean";
      nodeEl.dataset.index = i;
      nodeEl.innerHTML = `
        <div class="node-screen">🖥️</div>
        <div class="node-status-badge"></div>
      `;
      grid.appendChild(nodeEl);

      nodes.push({
        id: i,
        el: nodeEl,
        state: "clean" // "clean", "infected", "isolated", "shielded"
      });
    }

    // Seed 3 infected center nodes
    const initialInfected = [5, 6, 9];
    initialInfected.forEach(idx => {
      nodes[idx].state = "infected";
      updateNodeUI(nodes[idx]);
    });

    function getNeighbors(idx) {
      const neighbors = [];
      const row = Math.floor(idx / 4);
      const col = idx % 4;
      if (row > 0) neighbors.push(idx - 4); // top
      if (row < 3) neighbors.push(idx + 4); // bottom
      if (col > 0) neighbors.push(idx - 1); // left
      if (col < 3) neighbors.push(idx + 1); // right
      return neighbors;
    }

    function updateNodeUI(node) {
      node.el.className = `network-node ${node.state}`;
      const badge = node.el.querySelector(".node-status-badge");
      if (node.state === "infected") {
        node.el.querySelector(".node-screen").textContent = "💀";
        badge.textContent = "VIRUS";
      } else if (node.state === "isolated") {
        node.el.querySelector(".node-screen").textContent = "🔒";
        badge.textContent = "AIR-GAP";
      } else if (node.state === "shielded") {
        node.el.querySelector(".node-screen").textContent = "🛡️";
        badge.textContent = "FIREWALL";
      } else {
        node.el.querySelector(".node-screen").textContent = "🖥️";
        badge.textContent = "CLEAN";
      }
    }

    function recalculateStats() {
      const infectedCount = nodes.filter(n => n.state === "infected").length;
      const cleanCount = nodes.filter(n => n.state === "clean" || n.state === "shielded").length;
      const pct = Math.round((infectedCount / totalNodes) * 100);
      infectedVal.textContent = pct + "%";
      savedVal.textContent = `${cleanCount} / ${totalNodes}`;

      if (pct >= 75) {
        endGame(false);
      } else if (infectedCount === 0) {
        endGame(true);
      }
    }
    recalculateStats();

    // Node interactions
    nodes.forEach(node => {
      node.el.addEventListener("click", () => {
        if (currentTool === "clean") {
          if (node.state === "infected") {
            node.state = "clean";
            Sound.good();
            updateNodeUI(node);
            recalculateStats();
          } else {
            Sound.click();
          }
        } else if (currentTool === "isolate") {
          if (node.state !== "isolated") {
            node.state = "isolated";
            Sound.scan();
            updateNodeUI(node);
            recalculateStats();
          }
        } else if (currentTool === "firewall") {
          if (node.state === "clean") {
            node.state = "shielded";
            Sound.good();
            updateNodeUI(node);
            recalculateStats();
          }
        }
      });
    });

    function performScan() {
      Sound.scan();
      grid.classList.add("matrix-scanning");
      setTimeout(() => grid.classList.remove("matrix-scanning"), 1000);
    }

    // Infection spread loop (every 2.5s)
    spreadInterval = setInterval(() => {
      const currentInfected = nodes.filter(n => n.state === "infected");
      currentInfected.forEach(node => {
        const neighbors = getNeighbors(node.id);
        neighbors.forEach(nId => {
          const target = nodes[nId];
          if (target.state === "clean" && Math.random() < 0.38) {
            target.state = "infected";
            updateNodeUI(target);
          }
        });
      });
      recalculateStats();
    }, 2400);

    // Timer (150s = 02:30)
    let timeLeft = 150;
    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeVal.textContent = `${mins}:${secs}`;
      if (timeLeft <= 0) {
        const infectedCount = nodes.filter(n => n.state === "infected").length;
        endGame(infectedCount <= 2);
      }
    }, 1000);

    function endGame(won) {
      cleanup();
      if (onCompleteCallback) {
        onCompleteCallback({
          levelId: 2,
          won: won,
          score: won ? 420 : 80,
          title: "Level 2: Virus Outbreak",
          message: won
            ? "Network sanitized! Your rapid isolation and incident containment saved all critical nodes."
            : "Infection reached critical threshold! Prompt isolation prevents cyber propagation."
        });
      }
    }
  }

  function cleanup() {
    clearInterval(timerInterval);
    clearInterval(spreadInterval);
  }

  return { init, cleanup };
})();
