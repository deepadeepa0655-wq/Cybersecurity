// CyberQuest Level 4: Virus Attack – Stop the Spread (4x4 Interactive Tactical Simulation)
const QuestLevel4Files = (function() {
  let container;
  let onComplete;
  let ended = false;

  const CELL_STATE = { HEALTHY: 0, INFECTED: 1, FIREWALL: 2, FROZEN: 3 };
  const ROWS = 4, COLS = 4;

  const STAGES = [
    { name: 'Stage 1: Slow Outbreak', viruses: 1, spreadChance: 0.10, maxSpreadPerTurn: 1, fastVirus: false },
    { name: 'Stage 2: Gentle Spread', viruses: 1, spreadChance: 0.12, maxSpreadPerTurn: 1, fastVirus: false },
    { name: 'Stage 3: Controlled Outbreak', viruses: 2, spreadChance: 0.14, maxSpreadPerTurn: 1, fastVirus: false },
    { name: 'Stage 4: Steady Mutation', viruses: 2, spreadChance: 0.15, maxSpreadPerTurn: 1, fastVirus: true, fastSpreadChance: 0.18 },
    { name: 'Stage 5: Final Wave', viruses: 2, spreadChance: 0.16, maxSpreadPerTurn: 1, fastVirus: true, fastSpreadChance: 0.20 }
  ];

  const HINTS = {
    antivirus: '💊 <b>Antivirus</b>: Tap an <b style="color:#ff1744">infected</b> node to eliminate the virus.',
    firewall: '🛡️ <b>Firewall</b>: Tap a <b style="color:#39ff14">healthy</b> node to protect it permanently.',
    freeze: '🧊 <b>Freeze</b>: Tap an <b style="color:#ff1744">infected</b> node to freeze it for 3 turns.',
    cleaner: '🧹 <b>Area Cleaner</b>: Tap an <b style="color:#ff1744">infected</b> node to clean it AND orthogonal neighbors!'
  };

  let grid = [];
  let currentStage = 0;
  let selectedTool = null;
  let tools = {};
  let turn = 0;
  let score = 0;
  let processing = false;

  function shuffle(arr) {
    const b = [...arr];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  function getNeighbors(r, c) {
    const n = [];
    if (r > 0) n.push([r - 1, c]);
    if (r < ROWS - 1) n.push([r + 1, c]);
    if (c > 0) n.push([r, c - 1]);
    if (c < COLS - 1) n.push([r, c + 1]);
    return n;
  }

  function finish(won) {
    if (ended) return;
    ended = true;
    if (won) {
      if (typeof Sound !== 'undefined' && Sound.levelComplete) Sound.levelComplete();
      if (typeof CyberFX !== 'undefined' && CyberFX.confetti) CyberFX.confetti();
    } else {
      if (typeof Sound !== 'undefined' && Sound.error) Sound.error();
    }
    onComplete?.({ levelId: 4, won, score: won ? score + 150 : score });
  }

  function initStage(stageIdx) {
    currentStage = stageIdx;
    const cfg = STAGES[stageIdx];
    turn = 0;
    selectedTool = null;
    tools = { ...cfg.tools };
    processing = false;

    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = { state: CELL_STATE.HEALTHY, freezeCounter: 0, fast: false };
      }
    }

    const allCells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) allCells.push([r, c]);
    const shuffled = shuffle(allCells);
    for (let i = 0; i < cfg.viruses; i++) {
      const [r, c] = shuffled[i];
      grid[r][c].state = CELL_STATE.INFECTED;
      if (cfg.fastVirus && i % 2 === 0) grid[r][c].fast = true;
    }

    renderGrid();
    updateToolUI();
    updateStats();
  }

  function renderGrid() {
    const el = container.querySelector('#questMatrixGrid');
    if (!el) return;
    el.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'q-cell ' + getCellClass(r, c);
        cell.id = `qcell_${r}_${c}`;
        cell.innerHTML = getCellHTML(r, c);
        cell.addEventListener('click', () => onCellClick(r, c));
        el.appendChild(cell);
      }
    }
  }

  function getCellClass(r, c) {
    const g = grid[r][c];
    switch (g.state) {
      case CELL_STATE.HEALTHY: return 'healthy';
      case CELL_STATE.INFECTED: return 'infected' + (g.fast ? ' fast-virus' : '');
      case CELL_STATE.FIREWALL: return 'firewall';
      case CELL_STATE.FROZEN: return 'frozen';
    }
  }

  function getCellHTML(r, c) {
    const g = grid[r][c];
    switch (g.state) {
      case CELL_STATE.HEALTHY: return '💻';
      case CELL_STATE.INFECTED: return g.fast ? '🔥' : '🦠';
      case CELL_STATE.FIREWALL: return '🛡️';
      case CELL_STATE.FROZEN: return `❄️<span class="fc-num">${g.freezeCounter}</span>`;
    }
  }

  function updateCell(r, c, animClass='') {
    const el = container.querySelector(`#qcell_${r}_${c}`);
    if (!el) return;
    el.className = 'q-cell ' + getCellClass(r, c) + (animClass ? ' ' + animClass : '');
    el.innerHTML = getCellHTML(r, c);
  }

  function countState(st) {
    let count = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c].state === st) count++;
    return count;
  }

  function updateStats() {
    const sEl = container.querySelector('#qvStage');
    const tEl = container.querySelector('#qvTurn');
    const iEl = container.querySelector('#qvInf');
    const hEl = container.querySelector('#qvHlth');
    const scEl = container.querySelector('#qvScore');

    if (sEl) sEl.textContent = `${currentStage + 1} / ${STAGES.length}`;
    if (tEl) tEl.textContent = String(turn);
    if (iEl) iEl.textContent = String(countState(CELL_STATE.INFECTED) + countState(CELL_STATE.FROZEN));
    if (hEl) hEl.textContent = String(countState(CELL_STATE.HEALTHY) + countState(CELL_STATE.FIREWALL));
    if (scEl) scEl.textContent = String(score);
  }

  function updateToolUI() {
    container.querySelectorAll('.quest-tool-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === selectedTool);
    });

    const hint = container.querySelector('#questToolHint');
    if (hint) {
      hint.innerHTML = selectedTool ? HINTS[selectedTool] : 'Select a defence tool above, then tap any node on the grid.';
    }
  }

  function selectTool(toolKey) {
    if (processing || ended) return;
    if (typeof Sound !== 'undefined' && Sound.click) Sound.click();
    selectedTool = selectedTool === toolKey ? null : toolKey;
    updateToolUI();
  }

  async function onCellClick(r, c) {
    if (processing || ended || !selectedTool) return;
    const cell = grid[r][c];
    let valid = false;

    switch (selectedTool) {
      case 'antivirus':
        if (cell.state === CELL_STATE.INFECTED || cell.state === CELL_STATE.FROZEN) {
          cell.state = CELL_STATE.HEALTHY;
          cell.fast = false;
          cell.freezeCounter = 0;
          updateCell(r, c, 'pop-clean');
          if (typeof Sound !== 'undefined' && Sound.select) Sound.select();
          score += 15;
          valid = true;
        }
        break;
      case 'firewall':
        if (cell.state === CELL_STATE.HEALTHY) {
          cell.state = CELL_STATE.FIREWALL;
          updateCell(r, c);
          if (typeof Sound !== 'undefined' && Sound.click) Sound.click();
          score += 5;
          valid = true;
        }
        break;
      case 'freeze':
        if (cell.state === CELL_STATE.INFECTED) {
          cell.state = CELL_STATE.FROZEN;
          cell.freezeCounter = 3;
          updateCell(r, c);
          if (typeof Sound !== 'undefined' && Sound.click) Sound.click();
          score += 8;
          valid = true;
        }
        break;
      case 'cleaner':
        if (cell.state === CELL_STATE.INFECTED || cell.state === CELL_STATE.FROZEN) {
          const cleaned = [[r, c]];
          cell.state = CELL_STATE.HEALTHY;
          cell.fast = false;
          cell.freezeCounter = 0;
          getNeighbors(r, c).forEach(([nr, nc]) => {
            if (grid[nr][nc].state === CELL_STATE.INFECTED || grid[nr][nc].state === CELL_STATE.FROZEN) {
              grid[nr][nc].state = CELL_STATE.HEALTHY;
              grid[nr][nc].fast = false;
              grid[nr][nc].freezeCounter = 0;
              cleaned.push([nr, nc]);
            }
          });
          cleaned.forEach(([cr, cc]) => updateCell(cr, cc, 'pop-clean'));
          if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
          score += cleaned.length * 15;
          valid = true;
        }
        break;
    }

    if (!valid) return;

    turn++;
    updateToolUI();
    updateStats();

    if (checkStageCleared()) return;

    // Simulate virus spread
    processing = true;
    await simulateSpread();
    processing = false;

    // Tick freeze counters
    tickFreezes();
    updateStats();

    checkStageLost();
  }

  async function simulateSpread() {
    const cfg = STAGES[currentStage];
    const newInfections = [];

    const infectedList = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].state === CELL_STATE.INFECTED) {
          infectedList.push([r, c, grid[r][c].fast]);
        }
      }
    }

    const maxSpread = cfg.maxSpreadPerTurn || 1;
    for (const [r, c, fast] of infectedList) {
      if (newInfections.length >= maxSpread) break;
      const neighbors = shuffle(getNeighbors(r, c));
      const chance = fast ? (cfg.fastSpreadChance || cfg.spreadChance) : cfg.spreadChance;
      for (const [nr, nc] of neighbors) {
        if (newInfections.length >= maxSpread) break;
        if (grid[nr][nc].state === CELL_STATE.HEALTHY && Math.random() < chance) {
          if (!newInfections.some(x => x[0] === nr && x[1] === nc)) {
            newInfections.push([nr, nc, fast && Math.random() < 0.25]);
          }
        }
      }
    }

    for (const [nr, nc, fast] of newInfections) {
      if (grid[nr][nc].state !== CELL_STATE.HEALTHY) continue;
      grid[nr][nc].state = CELL_STATE.INFECTED;
      grid[nr][nc].fast = fast;
      updateCell(nr, nc, 'pop-infect');
      if (typeof Sound !== 'undefined' && Sound.laser) Sound.laser();
      await wait(120);
    }
  }

  function tickFreezes() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        if (cell.state === CELL_STATE.FROZEN) {
          cell.freezeCounter--;
          if (cell.freezeCounter <= 0) {
            cell.state = CELL_STATE.INFECTED;
            cell.freezeCounter = 0;
          }
          updateCell(r, c);
        }
      }
    }
  }

  function checkStageCleared() {
    const inf = countState(CELL_STATE.INFECTED);
    const frz = countState(CELL_STATE.FROZEN);
    if (inf === 0 && frz === 0) {
      if (currentStage + 1 < STAGES.length) {
        if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
        const feedback = container.querySelector('#questVirusFeedback');
        if (feedback) feedback.textContent = `Stage ${currentStage + 1} Cleared! Preparing next wave...`;
        setTimeout(() => {
          initStage(currentStage + 1);
        }, 1200);
      } else {
        finish(true);
      }
      return true;
    }
    return false;
  }

  function checkStageLost() {
    let hasDefense = false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].state === CELL_STATE.HEALTHY || grid[r][c].state === CELL_STATE.FIREWALL) {
          hasDefense = true;
          break;
        }
      }
    }
    // Only lose if the entire network has been overrun by infection
    if (!hasDefense) {
      finish(false);
    }
  }

  function init(containerElement, completionCallback) {
    container = containerElement;
    onComplete = completionCallback;
    ended = false;
    score = 0;

    container.innerHTML = `
      <section class="game-stage quest-virus-stage">
        <div class="quest-virus-header">
          <h3>🦠 LEVEL 4: VIRUS ATTACK – STOP THE SPREAD (4×4)</h3>
          <p id="questVirusFeedback">Select a defence tool, then tap any node on the 4×4 grid.</p>
        </div>

        <div class="quest-virus-stats">
          <div class="quest-v-stat stg"><span class="lbl">STAGE</span><span class="val" id="qvStage">1 / 5</span></div>
          <div class="quest-v-stat trn"><span class="lbl">TURN</span><span class="val" id="qvTurn">0</span></div>
          <div class="quest-v-stat inf"><span class="lbl">INFECTED</span><span class="val" id="qvInf">0</span></div>
          <div class="quest-v-stat hlth"><span class="lbl">HEALTHY</span><span class="val" id="qvHlth">16</span></div>
          <div class="quest-v-stat scr"><span class="lbl">SCORE</span><span class="val" id="qvScore">0</span></div>
        </div>

        <div class="quest-virus-arena">
          <div class="quest-tool-dock">
            <div class="quest-dock-title">DEFENCE TOOLS</div>

            <div class="quest-tool-item av" data-tool="antivirus">
              <span class="t-ico">💊</span>
              <span class="t-name">Antivirus</span>
            </div>

            <div class="quest-tool-item fw" data-tool="firewall">
              <span class="t-ico">🛡️</span>
              <span class="t-name">Firewall</span>
            </div>

            <div class="quest-tool-item fr" data-tool="freeze">
              <span class="t-ico">🧊</span>
              <span class="t-name">Freeze (3T)</span>
            </div>

            <div class="quest-tool-item cl" data-tool="cleaner">
              <span class="t-ico">🧹</span>
              <span class="t-name">Cleaner</span>
            </div>

            <div class="quest-tool-hint" id="questToolHint">Select a tool above, then tap any node on the grid.</div>
          </div>

          <div>
            <div class="quest-grid-wrap">
              <div class="quest-matrix-4x4" id="questMatrixGrid"></div>
            </div>

            <div class="quest-legend-bar">
              <div class="quest-leg-i"><div class="quest-leg-sw h"></div>Healthy</div>
              <div class="quest-leg-i"><div class="quest-leg-sw i"></div>Infected</div>
              <div class="quest-leg-i"><div class="quest-leg-sw fv"></div>Fast Virus</div>
              <div class="quest-leg-i"><div class="quest-leg-sw fw"></div>Firewall</div>
              <div class="quest-leg-i"><div class="quest-leg-sw fz"></div>Frozen</div>
            </div>
          </div>
        </div>
      </section>
    `;

    container.querySelectorAll('.quest-tool-item').forEach(btn => {
      btn.addEventListener('click', () => selectTool(btn.dataset.tool));
    });

    initStage(0);
  }

  function cleanup() {
    ended = true;
    processing = false;
  }

  return { init, cleanup };
})();
