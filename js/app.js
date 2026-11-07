// Main Application Controller & Hash Router for Cyber Shield
const App = (function() {
  let activeGame = null;
  let activeLevelId = 1;
  let currentHudPage = 1;
  let missionTelemetryInterval = null;
  let missionTelemetryStartedAt = 0;
  let missionTelemetrySurface = null;
  let missionTelemetryInputHandler = null;
  let missionTelemetryPointerHandler = null;
  let missionTelemetryKeyHandler = null;
  let isRegisterMode = false;
  let isAuthSubmitting = false;
  let isLoadingActive = false;
  let loadingTimer = null;
  let leaderboardUnsubscribe = null;
  let leaderboardRequestId = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function safeImageUrl(value) {
    try {
      const candidate = String(value || "").trim();
      if (!candidate) return "";
      const url = new URL(candidate, window.location.href);
      if (url.origin === window.location.origin && ["http:", "https:"].includes(url.protocol)) return url.href;
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function init() {
    FirebaseBridge.init();
    applyBranding();
    applyGameConfigToDOM();
    startCyberClock();
    setupRouting();
    setupEventListeners();

    // Check existing session
    const existingUser = FirebaseBridge.getCurrentUser();
    if (existingUser) {
      AppState.setUser(existingUser);
    }

    // Show the short animated welcome screen on every fresh page load.
    playBootLoading(handleRoute);
  }

  function startCyberClock() {
    function update() {
      const clockEl = document.getElementById("cyberClockTime");
      const dateEl = document.getElementById("cyberClockDate");
      if (!clockEl) return;
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      clockEl.textContent = `${hrs}:${mins}`;
      if (dateEl) {
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        dateEl.textContent = `${d}.${m}.2077`;
      }
    }
    update();
    setInterval(update, 1000);
  }

  function applyBranding() {
    const branding = FirebaseBridge.getBrandingConfig();
    if (!branding) return;

    // Document Title
    document.title = `${branding.appName || 'CYBERQUEST'} — Play · Learn · Stay Safe`;

    // Render Logo into element (supports image URL or emoji)
    const renderLogoTo = (el) => {
      if (!el) return;
      const logoUrl = safeImageUrl(branding.logoImageUrl);
      if (branding.logoType === 'image' && logoUrl) {
        const image = document.createElement("img");
        image.src = logoUrl;
        image.className = "custom-logo-img";
        image.alt = "Emblem";
        image.referrerPolicy = "no-referrer";
        image.addEventListener("error", () => { el.textContent = branding.logoIcon || "🛡️"; }, { once: true });
        el.replaceChildren(image);
      } else {
        el.textContent = branding.logoIcon || "🛡️";
      }
    };

    // Auth screen branding
    renderLogoTo(document.getElementById("authLogoDisplay"));
    const authAppTitle = document.getElementById("authAppTitleDisplay");
      if (authAppTitle) authAppTitle.textContent = branding.appName || "CYBERQUEST";

    const authSubtitle = document.getElementById("authSubtitleDisplay");
    if (authSubtitle) authSubtitle.textContent = branding.loginSubtitle || "PLAYER SIGN IN";

    const authMotto = document.getElementById("authMottoDisplay");
    if (authMotto) authMotto.textContent = branding.loginMotto || "Learn • Pause • Stay safe";

    // Top HUD branding
    renderLogoTo(document.getElementById("hudLogoDisplay"));
    const hudMainTitle = document.getElementById("hudMainTitleDisplay");
    if (hudMainTitle) hudMainTitle.textContent = branding.appName || "CYBERQUEST";

    const hudSubTitle = document.getElementById("hudSubTitleDisplay");
    if (hudSubTitle) hudSubTitle.textContent = branding.appSubtitle || "PLAY • LEARN • STAY SAFE";

    // Announcement Broadcast Bar
    const annBar = document.getElementById("hudAnnouncementBar");
    const annMsg = document.getElementById("hudAnnouncementMsg");
    if (annBar && annMsg) {
      if (branding.announcementEnabled && branding.announcementMessage) {
        annBar.classList.remove("hidden");
        annMsg.textContent = branding.announcementMessage;
      } else {
        annBar.classList.add("hidden");
      }
    }
  }

  // Hash-based client side router supporting #/admin, #/hub, #/certificate, #/auth
  function setupRouting() {
    window.addEventListener("hashchange", handleRoute);
  }

  function handleRoute() {
    if (isLoadingActive) return;
    stopLeaderboardSubscription();

    const hash = window.location.hash || "#/hub";
    const user = FirebaseBridge.getCurrentUser();

    // Views
    const loadingScreen = document.getElementById("loadingScreen");
    const authScreen = document.getElementById("authScreen");
    const hubScreen = document.getElementById("hubScreen");
    const gameScreen = document.getElementById("gameScreen");
    const adminView = document.getElementById("adminViewContainer");
    const certView = document.getElementById("certificateViewContainer");

    // Hide all
    [loadingScreen, authScreen, hubScreen, gameScreen, adminView, certView].forEach(el => {
      if (el) el.classList.add("hidden");
    });

    if (hash === "#/admin") {
      if (adminView) {
        adminView.classList.remove("hidden");
        AdminPanel.init();
      }
      return;
    }

    if (hash === "#/certificate") {
      if (certView) {
        certView.classList.remove("hidden");
        renderCertificateView();
      }
      return;
    }

    if (!user || hash === "#/auth" || hash === "#/login" || hash === "#/register" || hash === "#/guest") {
      if (authScreen) {
        authScreen.classList.remove("hidden");
        if (hash === "#/register") switchAuthTab("register");
        else if (hash === "#/guest") switchAuthTab("guest");
        else switchAuthTab("login");
      }
      return;
    }

    if (hash.startsWith("#/play/")) {
      const lvlId = Number(hash.split("/")[2]);
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > 8 || lvlId > Math.max(1, Number(user.unlockedLevel) || 1)) {
        if (window.CyberFX) CyberFX.toast("Finish the earlier game to unlock this one.", "warning");
        window.location.hash = "#/hub";
        return;
      }
      if (gameScreen) {
        gameScreen.classList.remove("hidden");
        launchGame(lvlId);
      }
      return;
    }

    // Default to Hub
    if (hubScreen) {
      hubScreen.classList.remove("hidden");
      showHub();
    }
  }

  function setupEventListeners() {
    // Sound on buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button, .nav-item, .level-card-play-btn, .chat-opt-btn, .auth-tab-btn");
      if (btn) Sound.click();
    });

    // Authentication suite (Login, Register, Guest tabs, validation, toggles)
    setupAuthHandlers();

    // Tactical HUD Back Buttons (Top and Bottom)
    const handleTacticalBack = () => {
      const homeNav = document.querySelector('.bottom-nav .nav-item[data-tab="home"]');
      if (homeNav) {
        homeNav.click();
      } else {
        switchHubTab("home");
      }
    };
    document.getElementById("btnTacticalBack")?.addEventListener("click", handleTacticalBack);
    document.getElementById("btnTacticalTopBack")?.addEventListener("click", handleTacticalBack);

    // Tactical HUD Pagination controls
    const hudPrev = document.getElementById("hudPrevPageBtn");
    const hudNext = document.getElementById("hudNextPageBtn");
    const hudDots = document.querySelectorAll(".hud-pagination-dots .hud-dot");

    function setHudPage(page) {
      const pageCount = Math.max(1, Math.ceil(AppState.getLevels().length / 4));
      currentHudPage = Math.max(1, Math.min(pageCount, page));
      hudDots.forEach((d, idx) => {
        d.classList.toggle("active", idx + 1 === currentHudPage);
      });
      if (hudPrev) hudPrev.disabled = currentHudPage <= 1;
      if (hudNext) hudNext.disabled = currentHudPage >= pageCount;
      renderLevelsList();
      if (window.CyberFX) CyberFX.toast(`MISSION BOARD: Page ${currentHudPage} synchronized.`, "success");
    }

    if (hudPrev) hudPrev.addEventListener("click", () => setHudPage(currentHudPage - 1));
    if (hudNext) hudNext.addEventListener("click", () => setHudPage(currentHudPage + 1));
    const initialPages = Math.max(1, Math.ceil(AppState.getLevels().length / 4));
    if (hudPrev) hudPrev.disabled = currentHudPage <= 1;
    if (hudNext) hudNext.disabled = currentHudPage >= initialPages;
    hudDots.forEach((d, idx) => {
      d.addEventListener("click", () => setHudPage(idx + 1));
    });

    // Bottom Navigation Dock
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        navItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        const tab = item.dataset.tab;
        switchHubTab(tab);
      });
    });

    // Settings Cog
    document.getElementById("hudSettingsBtn")?.addEventListener("click", openSettingsModal);

    // Quick Quiz button from HUD
    document.getElementById("btnHudQuickQuiz")?.addEventListener("click", () => {
      if (window.CyberPopup) CyberPopup.quizPopup();
    });

    // Game Exit Button
    document.getElementById("btnExitGame")?.addEventListener("click", exitCurrentGame);

    // Live mission pace control
    const missionSpeedSelect = document.getElementById("missionSpeedSelect");
    if (missionSpeedSelect) {
      missionSpeedSelect.value = getGameConfig().gameSpeed || "normal";
      missionSpeedSelect.addEventListener("change", (event) => {
        updateGameConfig({ gameSpeed: event.target.value });
      });
    }

    // Replay the animated welcome screen
    document.getElementById("btnReplayBoot")?.addEventListener("click", () => {
      playBootLoading();
    });

    // Skip Boot Loading Button
    document.getElementById("btnSkipBoot")?.addEventListener("click", () => {
      skipBootLoading();
    });

    // Admin direct link from HUD
    document.getElementById("hudAdminLink")?.addEventListener("click", () => {
      window.location.hash = "#/admin";
    });

    // Certificate Back Link
    document.getElementById("btnBackFromCert")?.addEventListener("click", () => {
      window.location.hash = "#/hub";
    });

    // Initialize CyberFX Animation Lab
    setupFxLab();
  }

  function setupFxLab() {
    const modal = document.getElementById("fxLabModal");
    const openBtn = document.getElementById("btnOpenFxLab");
    const closeBtn = document.getElementById("btnCloseFxLab");
    const targetEl = document.getElementById("fxTargetElement");
    const snippetEl = document.getElementById("fxCodeSnippet");

    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
        const card = modal.querySelector(".settings-modal-card");
        if (card && window.CyberFX) CyberFX.pop(card);
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }

    const bindAction = (id, fn, code, text = "🛡️ CYBER TARGET") => {
      document.getElementById(id)?.addEventListener("click", () => {
        if (!targetEl || !snippetEl || !window.CyberFX) return;
        targetEl.textContent = text;
        snippetEl.textContent = code;
        fn(targetEl);
      });
    };

    bindAction("btnFxPulse", (el) => {
      el.className = "anim-cyber-pulse";
      CyberFX.pop(el);
    }, 'class="anim-cyber-pulse" or CyberFX.pop(target);');

    bindAction("btnFxShake", (el) => {
      el.className = "";
      CyberFX.shake(el);
    }, 'CyberFX.shake(target); // 1-liner error vibration');

    bindAction("btnFxGlitch", (el) => {
      el.className = "";
      CyberFX.glitch(el);
    }, 'CyberFX.glitch(target); // 1-liner aberration');

    bindAction("btnFxShield", (el) => {
      el.className = "";
      CyberFX.shieldDeflect(el);
    }, 'CyberFX.shieldDeflect(target); // 1-liner shield wave');

    bindAction("btnFxConfetti", () => {
      CyberFX.confetti();
    }, 'CyberFX.confetti(); // 1-liner celebration burst');

    bindAction("btnFxCounter", (el) => {
      el.className = "";
      CyberFX.countUp(el, 100, 2500, 1000);
    }, 'CyberFX.countUp(scoreElement, 0, 2500);');

    bindAction("btnFxToast", () => {
      CyberFX.toast("Firewall threat repelled successfully!", "success");
    }, 'CyberFX.toast("Message", "success" | "danger");');

    bindAction("btnFxTada", (el) => {
      el.className = "";
      CyberFX.tada(el);
    }, 'CyberFX.tada(target); // 1-liner celebration wiggle');
  }

  // Security Hardening: Anti-Brute-Force Rate Limiter
  const authRateLimiter = {
    attempts: [],
    maxAttempts: 5,
    windowMs: 60000,
    isBlocked() {
      const now = Date.now();
      this.attempts = this.attempts.filter(t => now - t < this.windowMs);
      return this.attempts.length >= this.maxAttempts;
    },
    record() {
      this.attempts.push(Date.now());
    },
    remainingTime() {
      if (this.attempts.length === 0) return 0;
      const oldest = this.attempts[0];
      return Math.max(0, Math.ceil((this.windowMs - (Date.now() - oldest)) / 1000));
    }
  };

  function startGuestSession() {
    const nameInput = document.getElementById("guestNameInput");
    const rawNickname = nameInput?.value.trim() || "Cyber Explorer";
    // Sanitize input to prevent script injection / XSS
    const nickname = rawNickname.replace(/[<>"'&]/g, '').trim().slice(0, 18) || "Cyber Explorer";
    if (!validateGuestName()) {
      if (window.CyberFX) CyberFX.toast("Check your game nickname and try again.", "danger");
      nameInput?.focus();
      return;
    }

    try {
      const guest = FirebaseBridge.startGuest(nickname);
      AppState.setUser(guest);
      Sound.good();
      if (window.CyberFX) CyberFX.toast(`Welcome, ${nickname}! Your progress is saved on this device.`, "success");
      window.location.hash = "#/hub";
    } catch {
      const helper = document.getElementById("guestNameHelp");
      if (helper) {
        helper.classList.add("is-error");
        helper.textContent = "We couldn't start your game on this device. Check device storage and try again.";
      }
      if (window.CyberFX) CyberFX.toast("We couldn't start your game. Check device storage and try again.", "danger");
      Sound.bad();
    }
  }

  async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    if (isAuthSubmitting) return;

    if (authRateLimiter.isBlocked()) {
      const wait = authRateLimiter.remainingTime();
      showLoginFeedback(`Too many attempts. Cooldown active: please wait ${wait} seconds.`, "danger");
      if (window.CyberFX) CyberFX.toast(`Security cooldown active. Wait ${wait}s.`, "danger");
      Sound.bad();
      return;
    }

    const nameInput = document.getElementById("loginUsername") || document.getElementById("authAgentName");
    const pwdInput = document.getElementById("loginPassword") || document.getElementById("authPassword");
    const username = nameInput ? nameInput.value.trim() : "";
    const password = pwdInput ? pwdInput.value : "";

    clearFieldValidation(nameInput);
    clearFieldValidation(pwdInput);
    showLoginFeedback("", "info");

    let hasError = false;
    if (!username) {
      markFieldInvalid(nameInput, "Enter your username.");
      hasError = true;
    } else if (username.length < 3 || username.length > 20) {
      markFieldInvalid(nameInput, "Username must be 3–20 characters.");
      hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      markFieldInvalid(nameInput, "Letters, numbers, and _ only.");
      hasError = true;
    }

    if (!password) {
      markFieldInvalid(pwdInput, "Enter your password.");
      hasError = true;
    } else if (password.length < 6) {
      markFieldInvalid(pwdInput, "Password must be at least 6 characters.");
      hasError = true;
    }

    if (hasError) {
      showLoginFeedback("Please check your username and password.", "danger");
      Sound.bad();
      const card = document.getElementById("panelLogin") || document.querySelector(".retro-login-window");
      if (card && window.CyberFX) CyberFX.shake(card);
      return;
    }

    isAuthSubmitting = true;
    authRateLimiter.record();
    const submitBtn = document.getElementById("btnLoginSubmit") || document.getElementById("authSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>SIGNING IN...</span>";
      submitBtn.setAttribute("aria-busy", "true");
    }
    showLoginFeedback("Signing into your player account...", "info");

    try {
      const user = await FirebaseBridge.login(username, password);
      AppState.setUser(user);
      if (pwdInput) pwdInput.value = "";
      Sound.good();
      showLoginFeedback("Signed in! Loading your games...", "success");
      if (window.CyberFX) {
        CyberFX.toast(`Welcome back to CyberQuest, ${user.agentName}!`, "success");
      }
      window.location.hash = "#/hub";
    } catch (error) {
      const message = getFriendlyAuthError(error, false);
      showLoginFeedback(message, "danger");
      const card = document.getElementById("panelLogin") || document.querySelector(".retro-login-window");
      if (card && window.CyberFX) CyberFX.shake(card);
      if (window.CyberFX) CyberFX.toast(message, "danger");
      Sound.bad();
    } finally {
      isAuthSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.innerHTML = "<span>🔑 LOG IN</span>";
      }
    }
  }

  async function handleRegisterSubmit(e) {
    if (e) e.preventDefault();
    if (isAuthSubmitting) return;

    if (authRateLimiter.isBlocked()) {
      const wait = authRateLimiter.remainingTime();
      showRegisterFeedback(`Too many attempts. Cooldown active: please wait ${wait} seconds.`, "danger");
      if (window.CyberFX) CyberFX.toast(`Security cooldown active. Wait ${wait}s.`, "danger");
      Sound.bad();
      return;
    }

    const nameInput = document.getElementById("regUsername");
    const pwdInput = document.getElementById("regPassword");
    const confirmInput = document.getElementById("regPasswordConfirm");
    const username = nameInput ? nameInput.value.trim() : "";
    const password = pwdInput ? pwdInput.value : "";
    const confirm = confirmInput ? confirmInput.value : "";

    clearFieldValidation(nameInput);
    clearFieldValidation(pwdInput);
    clearFieldValidation(confirmInput);
    showRegisterFeedback("", "info");

    let hasError = false;
    if (!username) {
      markFieldInvalid(nameInput, "Choose a player username.");
      hasError = true;
    } else if (username.length < 3 || username.length > 20) {
      markFieldInvalid(nameInput, "Username must be 3–20 characters.");
      hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      markFieldInvalid(nameInput, "Letters, numbers, and _ only.");
      hasError = true;
    }

    if (!password) {
      markFieldInvalid(pwdInput, "Create a password.");
      hasError = true;
    } else if (password.length < 8) {
      markFieldInvalid(pwdInput, "New account passwords need at least 8 characters.");
      hasError = true;
    }

    if (!confirm) {
      markFieldInvalid(confirmInput, "Please confirm your password.");
      hasError = true;
    } else if (password !== confirm) {
      markFieldInvalid(confirmInput, "Passwords do not match.");
      hasError = true;
    }

    if (hasError) {
      showRegisterFeedback("Please fix the highlighted fields.", "danger");
      Sound.bad();
      const card = document.getElementById("panelRegister") || document.querySelector(".retro-login-window");
      if (card && window.CyberFX) CyberFX.shake(card);
      return;
    }

    isAuthSubmitting = true;
    authRateLimiter.record();
    const submitBtn = document.getElementById("btnRegisterSubmit");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>CREATING ACCOUNT...</span>";
      submitBtn.setAttribute("aria-busy", "true");
    }
    showRegisterFeedback("Creating your player account...", "info");

    try {
      const selectedAvatar = document.querySelector('input[name="agentAvatar"]:checked')?.value || "🥷";
      const user = await FirebaseBridge.register(username, password, selectedAvatar);
      AppState.setUser(user);
      if (pwdInput) pwdInput.value = "";
      if (confirmInput) confirmInput.value = "";
      Sound.good();
      showRegisterFeedback("Account created! Loading your games...", "success");
      if (window.CyberFX) {
        CyberFX.confetti();
        CyberFX.toast(`Identity created! Welcome Agent ${user.agentName}!`, "success");
      }
      window.location.hash = "#/hub";
    } catch (error) {
      const message = getFriendlyAuthError(error, true);
      showRegisterFeedback(message, "danger");
      const card = document.getElementById("panelRegister") || document.querySelector(".retro-login-window");
      if (card && window.CyberFX) CyberFX.shake(card);
      if (window.CyberFX) CyberFX.toast(message, "danger");
      Sound.bad();
    } finally {
      isAuthSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.innerHTML = "<span>✨ CREATE ACCOUNT</span>";
      }
    }
  }

  function showHub() {
    applyBranding();
    updateHUD();
    renderLevelsList();
    renderHomeView();
  }

  function updateHUD() {
    const user = AppState.getUser();
    if (!user) return;
    const scoreVal = document.getElementById("hudScoreVal");
    const livesVal = document.getElementById("hudLivesVal");
    if (scoreVal) {
      const currentVal = parseInt(scoreVal.textContent, 10) || 0;
      const targetVal = user.score || 0;
      if (currentVal !== targetVal && window.CyberFX) {
        CyberFX.countUp(scoreVal, currentVal, targetVal, 700);
      } else {
        scoreVal.textContent = targetVal;
      }
    }
    if (livesVal) livesVal.textContent = user.lives !== undefined ? user.lives : 3;
  }

  function switchHubTab(tabName) {
    if (tabName !== "leaderboard") stopLeaderboardSubscription();
    const tabs = ["home", "levels", "achievements", "leaderboard", "howtoplay"];
    tabs.forEach(t => {
      const el = document.getElementById(`tabContent_${t}`);
      if (el) {
        const isTarget = t === tabName;
        el.classList.toggle("hidden", !isTarget);
        if (isTarget) {
          el.classList.remove("anim-fade-in");
          void el.offsetWidth;
          el.classList.add("anim-fade-in");
        }
      }
    });

    if (tabName === "home") renderHomeView();
    if (tabName === "levels") renderLevelsList();
    if (tabName === "achievements") renderAchievementsView();
    if (tabName === "leaderboard") renderLeaderboardView();
  }

  function renderHomeView() {
    const user = AppState.getUser();
    const homeContainer = document.getElementById("tabContent_home");
    if (!homeContainer || !user) return;

    const levels = AppState.getLevels();
    const completedList = (user?.completedLevels || []).filter(id => id <= levels.length);
    const completedCount = completedList.length;
    const badgeCount = (user?.achievements || []).length;
    const safeScore = Math.max(0, Math.floor(Number(user.score) || 0));
    const rawLives = Number(user.lives);
    const safeLives = Number.isFinite(rawLives) ? Math.max(0, Math.min(10, Math.floor(rawLives))) : 3;

    // Active level to continue (current highest unlocked level)
    const unlocked = Math.min(8, Math.max(1, Number(user.unlockedLevel) || 1));
    const activeLevel = levels.find(l => l.id === unlocked) || levels[0];
    const missionReachScore = activeLevel.targetScore || activeLevel.clearReward || 250;

    // Next Rank threshold calculation
    let nextRankTitle = "Quest Explorer";
    let nextRankScore = 400;
    if (safeScore < 400) {
      nextRankTitle = "Quest Explorer";
      nextRankScore = 400;
    } else if (safeScore < 1000) {
      nextRankTitle = "Safety Star";
      nextRankScore = 1000;
    } else if (safeScore < 1800) {
      nextRankTitle = "Cyber Hero";
      nextRankScore = 1800;
    } else {
      nextRankTitle = "Master Defender";
      nextRankScore = 2500;
    }

    const rankProgressPct = Math.min(100, Math.round((safeScore / nextRankScore) * 100));
    const clearancePct = Math.min(100, Math.round((completedCount / 8) * 100));
    const isLevelDone = completedList.includes(activeLevel.id);
    const isAllDone = completedCount >= 8;

    homeContainer.innerHTML = `
      <div class="home-briefing-wrap">
        <!-- 1. Agent Command & Clearance Dossier (Unmerged) -->
        <div class="agent-id-hero-card">
          <div class="hero-left-section">
            <div class="hero-avatar" id="homePlayerAvatar">${user.avatar || '🦊'}</div>
            <div class="hero-details">
              <div class="hero-title-row">
                <h2 class="hero-name" id="homePlayerName">${escapeHtml(user.agentName || 'Cyber Explorer')}</h2>
                <span class="hero-rank-tag" id="homePlayerRank">${escapeHtml(user.rankTitle || 'Cyber Explorer')}</span>
              </div>
              <div class="hero-clearance-bar-container">
                <div class="clearance-label-row">
                  <span class="clearance-title" id="homeClearanceTitle">🛡️ SECURITY CLEARANCE: LEVEL ${unlocked} / 8</span>
                  <span class="clearance-percent" id="homeClearancePercent">${clearancePct}% CLEAR</span>
                </div>
                <div class="clearance-track">
                  <div class="clearance-fill" id="homeClearanceFill" style="width: ${clearancePct}%;"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="hero-right-metrics">
            <div class="hero-score-badge">
              <span class="lbl">TOTAL SCORE</span>
              <span class="val" id="homePlayerScore">${safeScore}</span>
            </div>
            <div class="hero-reach-target-badge">
              <span class="reach-lbl">NEXT RANK REACH (${nextRankTitle})</span>
              <span class="reach-val">${nextRankScore} PTS</span>
              <div class="reach-mini-track">
                <div class="reach-mini-fill" style="width: ${rankProgressPct}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Active Operation Card with CONTINUE & REACH SCORE -->
        <div class="active-mission-banner">
          <div class="mission-banner-header">
            <div class="mission-tag-group">
              <span class="mission-active-pill">⚡ ${isAllDone ? 'ALL MISSIONS CLEARED' : (isLevelDone ? 'MISSION COMPLETED' : 'CURRENT OPERATION')}</span>
              <span class="mission-level-chip">LEVEL 0${activeLevel.id}</span>
              <span class="mission-timer-chip">⏱️ 02:30 PER OPERATION</span>
            </div>
            <span class="mission-ready-badge">${isLevelDone ? '✔ CLEARED' : '● READY TO DEPLOY'}</span>
          </div>

          <div class="mission-banner-body">
            <div class="mission-info-col">
              <h3 class="mission-display-title">
                <span class="mission-icon">${activeLevel.icon || '◈'}</span>
                ${activeLevel.name}
              </h3>
              <div class="mission-codename-text">OPERATION: ${activeLevel.codename || 'TACTICAL DEPLOYMENT'}</div>
              <p class="mission-desc-text">${activeLevel.goal || 'Identify security threats, make safe choices, and defend the digital world.'}</p>
            </div>

            <!-- Reach Score Metric Card -->
            <div class="mission-reach-score-card">
              <div class="reach-score-top">
                <span class="reach-star-icon">🎯</span>
                <span class="reach-score-heading">MISSION REACH SCORE</span>
              </div>
              <div class="reach-score-number">${missionReachScore} <small>PTS</small></div>
              <div class="reach-score-subtext">${isLevelDone ? '✔ Target Achieved' : 'Score to reach & clear mission'}</div>
            </div>
          </div>

          <div class="mission-banner-actions">
            <button type="button" class="btn-primary-launch btn-continue-pulse" id="btnHomeContinueMission" title="Start or continue this operation immediately">
              <span class="btn-icon">▶</span> CONTINUE (LEVEL ${activeLevel.id})
            </button>
            <button type="button" class="btn-primary-launch secondary" id="btnResumeMissions" title="Browse full matrix of 8 missions">
              🎮 BROWSE ALL LEVELS
            </button>
            ${AppState.isEligibleForCertificate() ? `
              <button type="button" class="btn-primary-launch gold" id="btnViewCertBanner" title="View & print official certificate">
                🎓 CLAIM CERTIFICATE
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 3. Tactical Stations Grid -->
        <div class="home-hub-interactive-grid">
          <div class="home-interactive-card">
            <div class="home-card-header">
              <div class="card-icon">🧠</div>
              <div>
                <h4>DAILY CYBER QUIZ</h4>
                <small>50+ Randomized questions across all 8 security domains</small>
              </div>
            </div>
            <div class="home-card-meta">
              <span class="meta-tag">+50 PTS PER CORRECT ANSWER • FULLY RANDOMIZED</span>
            </div>
            <button type="button" class="home-card-action-btn" id="btnHomeLaunchQuiz">
              ⚡ LAUNCH POPUP QUIZ
            </button>
          </div>

          <div class="home-interactive-card">
            <div class="home-card-header">
              <div class="card-icon">🛡️</div>
              <div>
                <h4>SAFETY PROTOCOLS</h4>
                <small>Vital defense rules & countermeasures against phishing, malware & attacks</small>
              </div>
            </div>
            <div class="home-card-meta">
              <span class="meta-tag">FIELD VERIFIED DEFENSE PROTOCOLS</span>
            </div>
            <button type="button" class="home-card-action-btn gold" id="btnHomeSafetyTip">
              🛡️ REVEAL PROTOCOL
            </button>
          </div>
        </div>

        <!-- 4. Quick Stats Telemetry -->
        <div class="quick-stats-grid">
          <div class="q-stat-card">
            <span class="q-icon">🎯</span>
            <span class="q-val" id="homeCompletedCount">${completedCount}/8</span>
            <span class="q-lbl">Missions Cleared</span>
          </div>
          <div class="q-stat-card">
            <span class="q-icon">🏆</span>
            <span class="q-val" id="homeBadgeCount">${badgeCount}/8</span>
            <span class="q-lbl">Badges Acquired</span>
          </div>
          <div class="q-stat-card">
            <span class="q-icon">❤️</span>
            <span class="q-val" id="homeLivesCount">${safeLives}</span>
            <span class="q-lbl">Tactical Reserves</span>
          </div>
        </div>
      </div>
    `;

    // Action Handlers
    document.getElementById("btnHomeContinueMission")?.addEventListener("click", () => {
      if (window.Sound) Sound.select();
      window.location.hash = `#/play/${activeLevel.id}`;
    });

    document.getElementById("btnResumeMissions")?.addEventListener("click", () => {
      const levelsNav = document.querySelector('.bottom-nav .nav-item[data-tab="levels"]');
      if (levelsNav) levelsNav.click();
      else switchHubTab("levels");
    });

    document.getElementById("btnViewCertBanner")?.addEventListener("click", () => {
      window.location.hash = "#/certificate";
    });

    document.getElementById("btnHomeLaunchQuiz")?.addEventListener("click", () => {
      if (window.CyberPopup) CyberPopup.quizPopup();
    });

    document.getElementById("btnHomeSafetyTip")?.addEventListener("click", () => {
      if (window.CyberPopup) CyberPopup.safetyTip();
    });
  }

  function renderLevelsList() {
    const levelsGrid = document.getElementById("levelsListGrid");
    if (!levelsGrid) return;
    const user = AppState.getUser();
    const levels = AppState.getLevels();
    const unlocked = Math.min(levels.length, user?.unlockedLevel || 1);
    const completed = (user?.completedLevels || []).filter(id => id <= levels.length);

    // HUD Preview Elements
    const previewLvlId = document.getElementById("hudPreviewLvlId");
    const previewLvlName = document.getElementById("hudPreviewLvlName");
    const activeStatus = document.getElementById("hudActiveLevelStatus");
    const percentVal = document.getElementById("hudProgressPercentVal");
    const fillBar = document.getElementById("hudProgressFillBar");
    const labelText = document.getElementById("hudProgressLabelText");

    // Progress follows the total number of missions in the board.
    const pct = Math.min(100, Math.round((completed.length / Math.max(1, levels.length)) * 100));
    if (percentVal) percentVal.textContent = `${pct}%`;
    if (fillBar) fillBar.style.width = `${pct}%`;
    if (labelText) labelText.textContent = `${pct}% Completed`;

    // Active Mission Status in bottom-left
    const currentActiveLevel = levels.find(l => l.id === unlocked) || levels[7] || levels[0];
    if (activeStatus && currentActiveLevel) {
      activeStatus.textContent = `LEVEL: ${String(currentActiveLevel.id).padStart(2, '0')} ${currentActiveLevel.codename || currentActiveLevel.name}`;
    }

    // Preview the first mission on this board page until a card is focused.
    const defaultPreviewId = ((currentHudPage - 1) * 4) + 1;
    const defaultPreview = levels.find(l => l.id === defaultPreviewId) || levels[0];
    if (previewLvlId && defaultPreview) previewLvlId.textContent = `LEVEL: ${String(defaultPreview.id).padStart(2, '0')}`;
    if (previewLvlName && defaultPreview) previewLvlName.textContent = defaultPreview.codename || defaultPreview.name;

    levelsGrid.innerHTML = "";
    levels.forEach(lvl => {
      const isUnlocked = lvl.id <= unlocked;
      const isDone = completed.includes(lvl.id);

      const starsCount = isDone ? 3 : 0;

      const card = document.createElement("div");
      card.className = `hud-level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.dataset.levelId = lvl.id;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Level ${lvl.id}: ${lvl.name}${isUnlocked ? isDone ? ", completed" : ", unlocked" : ", locked"}`);
      card.tabIndex = isUnlocked ? 0 : -1;
      card.style.animationDelay = `${Math.min(lvl.id, 10) * 45}ms`;

      card.innerHTML = `
        <!-- Top Left Number Badge -->
        <div class="card-num-badge ${isUnlocked ? '' : 'locked'}">${lvl.id}</div>

        ${!isUnlocked ? '<div class="card-locked-overlay"></div>' : ''}

        <!-- Side Tech Notches -->
        <div class="card-notch left ${isUnlocked ? '' : 'locked'}"></div>
        <div class="card-notch right ${isUnlocked ? '' : 'locked'}"></div>

        <!-- Mission emblem -->
        <div class="card-center-hex ${isUnlocked ? '' : 'locked'}">
          <svg class="hex-icon-svg" viewBox="0 0 60 60">
            <polygon points="30,3 56,17 56,43 30,57 4,43 4,17" class="hex-shape ${isUnlocked ? '' : 'locked'}" />
          </svg>
          <div class="hex-inner-action ${isUnlocked ? '' : 'locked'}">
            <span class="level-emblem"></span>
          </div>
        </div>

        <div class="card-title-block">
          <span class="card-mission-title"></span>
          <span class="card-mission-codename"></span>
        </div>

        <div class="card-mission-status ${isUnlocked ? (isDone ? 'completed' : 'ready') : 'locked'}">
          <span class="status-light"></span><span class="status-copy"></span>
        </div>

        <!-- Bottom Stars Row -->
        <div class="card-stars-row">
          ${isUnlocked ? `
            <span class="${starsCount >= 1 ? 'star-gold' : 'star-dim'}">★</span>
            <span class="${starsCount >= 2 ? 'star-gold' : 'star-dim'}">★</span>
            <span class="${starsCount >= 3 ? 'star-gold' : 'star-dim'}">★</span>
          ` : `
            <span class="star-dim">★</span>
            <span class="star-dim">★</span>
            <span class="star-dim">★</span>
          `}
        </div>
      `;

      card.querySelector(".level-emblem").textContent = isUnlocked ? (lvl.icon || "◈") : "🔒";
      card.querySelector(".card-mission-title").textContent = lvl.name;
      card.querySelector(".card-mission-codename").textContent = lvl.codename || "FIELD OPERATION";
      card.querySelector(".status-copy").textContent = isUnlocked ? (isDone ? "COMPLETED" : "READY TO DEPLOY") : "LOCKED";

      // Hover preview update with sound
      card.addEventListener("mouseenter", () => {
        if (previewLvlId) previewLvlId.textContent = `LEVEL: ${String(lvl.id).padStart(2, '0')}`;
        if (previewLvlName) previewLvlName.textContent = lvl.codename || lvl.name;
        if (window.Sound) Sound.hover();
      });

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          card.click();
        }
      });

      // Click handler - starts the game directly without tips or dialog box
      card.addEventListener("click", () => {
        if (isUnlocked) {
          if (window.Sound) Sound.select();
          window.location.hash = `#/play/${lvl.id}`;
        } else {
          if (window.Sound) Sound.bad();
          if (window.CyberFX) {
            CyberFX.shake(card);
            CyberFX.toast(`⚠️ ACCESS RESTRICTED: Decrypt Level ${lvl.id - 1} to unlock Level ${lvl.id}!`, "danger");
          }
        }
      });

      levelsGrid.appendChild(card);
    });
  }

  // Mission briefing before launch: direct launch without intermediate tips / dialog box
  function openMissionBriefing(levelId) {
    activeLevelId = levelId;
    window.location.hash = `#/play/${levelId}`;
  }

  const missionQuestionBank = {
    // Level 1 – Password Security (6 questions)
    1: [
      { question: "Which password is hardest to guess?", options: ["Sunny7!", "P@ssword", "River-cloud-rocket-8!", "name123"], answer: 2, explanation: "Long, unique passphrases are harder to guess." },
      { question: "What makes a password stronger?", options: ["Using your birthday", "Adding special characters like @#$!", "Making it shorter", "Using only numbers"], answer: 1, explanation: "Special characters increase password complexity." },
      { question: "How often should you change your passwords?", options: ["Never", "Every few months", "Only when you forget them", "Every hour"], answer: 1, explanation: "Changing passwords periodically helps stay secure." },
      { question: "Is it safe to write passwords on sticky notes?", options: ["Yes, it's convenient", "Only at home", "No, someone could find them", "Only if hidden well"], answer: 2, explanation: "Physical notes can be found by anyone nearby." },
      { question: "What is a passphrase?", options: ["A single word", "A sentence-like combination of words", "Your username", "A phone number"], answer: 1, explanation: "Passphrases are longer and easier to remember." },
      { question: "Should you use the same password for all accounts?", options: ["Yes, it's easier to remember", "No, if one is hacked all are at risk", "Only for games", "Only for email"], answer: 1, explanation: "Reusing passwords puts all your accounts at risk." }
    ],
    // Level 2 – Phishing (6 questions)
    2: [
      { question: "A message offers free gems if you share your password. What should you do?", options: ["Keep the password private and check with an adult", "Reply with your password", "Forward it to friends", "Tap the link quickly"], answer: 0, explanation: "Real helpers never need your password." },
      { question: "What is a common sign of a phishing email?", options: ["It has your correct name", "It asks you to act urgently", "It comes from a friend", "It has no links"], answer: 1, explanation: "Urgency is a tactic to trick you into acting without thinking." },
      { question: "What should you do if an email link looks suspicious?", options: ["Click it to check", "Hover over it to see the real URL", "Forward it to friends", "Reply asking for info"], answer: 1, explanation: "Hovering reveals the true destination without clicking." },
      { question: "Which email is most likely a phishing attempt?", options: ["From your school with a newsletter", "From 'BankOfAmerik4' asking for your password", "From a friend with a photo", "From a store with a receipt"], answer: 1, explanation: "Misspelled sender names are a phishing red flag." },
      { question: "What is 'spear phishing'?", options: ["Fishing with a spear", "A targeted phishing attack on a specific person", "A type of spam filter", "A safe email feature"], answer: 1, explanation: "Spear phishing targets specific individuals with personalized tricks." },
      { question: "A pop-up says you won a prize. What should you do?", options: ["Click to claim it", "Close it immediately", "Enter your details", "Share it with friends"], answer: 1, explanation: "Prize pop-ups are almost always scams." }
    ],
    // Level 3 – Safe Links (6 questions)
    3: [
      { question: "What is the safest way to open a game you trust?", options: ["Tap a surprise link in chat", "Use the app or site you already know", "Pick the shortest link", "Click a pop-up prize"], answer: 1, explanation: "Go to a familiar app or type its known address with an adult." },
      { question: "What does HTTPS mean?", options: ["The site is always safe", "Data is encrypted between you and the site", "The site is run by the government", "The site has no ads"], answer: 1, explanation: "HTTPS encrypts data in transit but doesn't guarantee the site is trustworthy." },
      { question: "What is typosquatting?", options: ["Typing really fast", "Creating fake websites with misspelled URLs", "A typing game", "A way to fix typos"], answer: 1, explanation: "Attackers register misspelled domains to trick visitors." },
      { question: "Which URL looks safest?", options: ["http://free-prizes.xyz", "https://www.google.com", "http://g00gle.co", "https://login-now.info"], answer: 1, explanation: "Legitimate, well-known domains with HTTPS are safest." },
      { question: "What should you check before clicking a download link?", options: ["If it's colorful", "If it comes from a trusted source", "If it's free", "If it's on social media"], answer: 1, explanation: "Only download from official, trusted sources." },
      { question: "A short link (bit.ly/xyz) is shared in a chat. What's safest?", options: ["Click it right away", "Preview it with a URL expander tool first", "Share it with others", "Ignore all short links forever"], answer: 1, explanation: "URL expanders let you see the real destination before visiting." }
    ],
    // Level 4 – Virus / File Safety (6 questions)
    4: [
      { question: "A stranger sends you a file called FREE-SKIN.exe. What is safest?", options: ["Open it to see what it does", "Send it to a friend", "Leave it closed and ask a trusted adult", "Rename it and run it"], answer: 2, explanation: "Unexpected files can be unsafe. Ask an adult before opening them." },
      { question: "Which file extension is commonly risky?", options: [".jpg", ".exe", ".txt", ".pdf"], answer: 1, explanation: "Executable files (.exe) can run harmful code on your computer." },
      { question: "What should you do before opening an email attachment?", options: ["Open it immediately", "Scan it with antivirus software", "Forward it first", "Rename it"], answer: 1, explanation: "Always scan attachments before opening them." },
      { question: "What is malware?", options: ["A type of hardware", "Malicious software designed to harm", "A music player", "A web browser"], answer: 1, explanation: "Malware is any software created to cause damage." },
      { question: "How can malware spread?", options: ["Through infected files and links", "Through the power cable", "Only through USB drives", "It can't spread"], answer: 0, explanation: "Malware often spreads through infected files, links, and downloads." },
      { question: "What does antivirus software do?", options: ["Makes your computer faster", "Detects and removes malicious software", "Blocks all websites", "Deletes your files"], answer: 1, explanation: "Antivirus software scans for and removes threats." }
    ],
    // Level 5 – Ransomware (6 questions)
    5: [
      { question: "A screen says your files are locked and asks for money. What should you do?", options: ["Pay right away", "Ask a trusted adult for help", "Enter your password", "Download a tool from the message"], answer: 1, explanation: "Do not pay or follow the message. Get help from a trusted adult." },
      { question: "What is ransomware?", options: ["A game", "Software that locks your files and demands payment", "A type of firewall", "An antivirus tool"], answer: 1, explanation: "Ransomware encrypts your files and demands money to unlock them." },
      { question: "What is the best defense against ransomware?", options: ["Paying the ransom quickly", "Regular backups of your data", "Using no computer at all", "Ignoring the problem"], answer: 1, explanation: "Backups let you restore files without paying." },
      { question: "Should you pay a ransomware demand?", options: ["Yes, to get files back", "No, it funds criminals with no guarantee", "Only if it's cheap", "Only for important files"], answer: 1, explanation: "Paying encourages more attacks and doesn't guarantee recovery." },
      { question: "How does ransomware typically get into a computer?", options: ["Through the keyboard", "Through phishing emails or unsafe downloads", "Through the monitor", "Through headphones"], answer: 1, explanation: "Phishing and unsafe downloads are common ransomware entry points." },
      { question: "What should you do first if you suspect ransomware?", options: ["Turn off the internet", "Disconnect the computer from the network", "Pay immediately", "Delete everything"], answer: 1, explanation: "Disconnecting prevents ransomware from spreading to other devices." }
    ],
    // Level 6 – Spy Devices (6 questions)
    6: [
      { question: "You find a device you do not recognize. What is a safe next step?", options: ["Take it apart", "Plug it into your computer", "Leave it alone and tell a trusted adult", "Try every button"], answer: 2, explanation: "Leave unfamiliar devices alone and ask a trusted adult." },
      { question: "What is a keylogger?", options: ["A type of lock", "A device or program that records your keystrokes", "A keyboard brand", "A game controller"], answer: 1, explanation: "Keyloggers capture everything you type, including passwords." },
      { question: "Where might a spy camera be hidden?", options: ["In a book", "In a smoke detector or USB charger", "Under the floor", "In a window"], answer: 1, explanation: "Everyday objects can conceal spy cameras." },
      { question: "What should you do if you find an unknown USB device?", options: ["Plug it in to see what's on it", "Leave it and tell a trusted adult", "Take it home", "Put it in a drawer"], answer: 1, explanation: "Unknown USB devices could carry malware." },
      { question: "What is a rogue Wi-Fi hotspot?", options: ["A free Wi-Fi zone", "A fake network set up to steal your data", "A very fast internet connection", "A type of router"], answer: 1, explanation: "Rogue hotspots mimic real networks to intercept your data." },
      { question: "How can you protect against hidden recording devices?", options: ["Speak quietly", "Do regular physical security checks", "Use a louder voice", "Close your eyes"], answer: 1, explanation: "Regular sweeps help find unauthorized devices." }
    ],
    // Level 7 – Password Power-Up (7 questions)
    7: [
      { question: "Which password choice avoids personal details?", options: ["Your name and birthday", "Your pet's name", "A long, unique passphrase", "Your phone number"], answer: 2, explanation: "Do not use names, birthdays, or phone numbers in passwords." },
      { question: "Which is a stronger password?", options: ["abc123", "M0untain!River#2024", "password", "qwerty"], answer: 1, explanation: "Long passwords with mixed character types are much stronger." },
      { question: "What is two-factor authentication (2FA)?", options: ["Using two passwords", "A second verification step like a code sent to your phone", "Logging in twice", "Having two accounts"], answer: 1, explanation: "2FA adds an extra layer of security beyond just a password." },
      { question: "Why shouldn't you share your password with friends?", options: ["They might forget it", "They could accidentally or intentionally misuse it", "It's not polite", "They have their own"], answer: 1, explanation: "Even trusted friends could accidentally expose your password." },
      { question: "What is a password manager?", options: ["A person who manages passwords", "Software that securely stores and generates passwords", "A type of lock", "A website"], answer: 1, explanation: "Password managers create and store strong, unique passwords safely." },
      { question: "What makes 'Tr0ub4dor&3' a decent password?", options: ["It's short", "It mixes letters, numbers, and symbols", "It's a real word", "It's easy to guess"], answer: 1, explanation: "Mixing character types increases password strength." },
      { question: "Should a strong password contain personal information?", options: ["Yes, for easy recall", "No, personal info is easier to guess", "Only your middle name", "Only your pet's name"], answer: 1, explanation: "Attackers research personal info to guess passwords." }
    ],
    // Level 8 – Think Before You Share (7 questions)
    8: [
      { question: "A caller asks for the sign-in code sent to your phone. What should you do?", options: ["Read it to them", "Send a screenshot", "Keep it secret and tell a trusted adult", "Post it in chat"], answer: 2, explanation: "Keep sign-in codes private. A trusted adult can help check the caller." },
      { question: "What information should you NEVER share online?", options: ["Your favorite color", "Your full address and phone number", "Your favorite movie", "Your hobby"], answer: 1, explanation: "Personal details like address and phone number should stay private." },
      { question: "Someone online asks for your school name. What do you do?", options: ["Tell them right away", "Don't share it and tell a trusted adult", "Ask them first", "Share if they seem nice"], answer: 1, explanation: "Don't share identifying information with strangers online." },
      { question: "What is social engineering?", options: ["Building social media apps", "Manipulating people to give up confidential information", "A school subject", "Making friends online"], answer: 1, explanation: "Social engineering tricks people into revealing secrets." },
      { question: "A website asks for your parent's credit card for a 'free' trial. What do you do?", options: ["Enter the details", "Ask a trusted adult before doing anything", "Use a friend's card", "Make up a number"], answer: 1, explanation: "Always check with a trusted adult before entering payment info." },
      { question: "Is it safe to accept friend requests from strangers?", options: ["Yes, more friends is better", "No, they could be pretending to be someone else", "Only on weekends", "Only if they have a photo"], answer: 1, explanation: "Strangers online may not be who they claim to be." },
      { question: "What should you do if someone online makes you uncomfortable?", options: ["Keep chatting to be polite", "Block them and tell a trusted adult", "Give them what they want", "Ignore the feeling"], answer: 1, explanation: "Your safety comes first. Block, report, and tell an adult." }
    ]
  };

  // Fisher-Yates shuffle for randomizing questions per level
  const missionShuffledQueues = Object.create(null);

  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function showMissionQuestion(levelId) {
    const button = document.getElementById("btnQuestQuestion");
    const slot = document.getElementById("briefingQuizSlot");
    const source = document.getElementById("questQuestionSource");
    if (!button || !slot) return;
    const managedQuestions = FirebaseBridge.getQuestions(levelId).filter(question =>
      question
      && typeof question.question === "string"
      && Array.isArray(question.options)
      && question.options.length === 4
      && Number.isInteger(Number(question.answer))
      && Number(question.answer) >= 0
      && Number(question.answer) <= 3
    );
    const questions = managedQuestions.length
      ? managedQuestions
      : (missionQuestionBank[levelId] || missionQuestionBank[1]);
    // Use shuffled queue for randomized question order; reshuffle when exhausted
    if (!missionShuffledQueues[levelId] || missionShuffledQueues[levelId].length === 0) {
      missionShuffledQueues[levelId] = shuffleArray(questions);
    }
    const question = missionShuffledQueues[levelId].pop();

    if (source) source.textContent = "READY";
    slot.replaceChildren();
    const prompt = document.createElement("p");
    prompt.className = "quest-question-prompt";
    prompt.textContent = String(question.question).slice(0, 240);
    slot.appendChild(prompt);

    const choices = document.createElement("div");
    choices.className = "quest-question-options";
    const feedback = document.createElement("p");
    feedback.className = "quest-question-feedback";
    feedback.setAttribute("aria-live", "polite");

    // Randomize options order so answer position (A/B/C/D) is unique for each student
    const indexedOptions = question.options.map((option, idx) => ({ text: option, isCorrect: idx === question.answer }));
    const shuffledOptions = shuffleArray(indexedOptions);

    shuffledOptions.forEach((optObj, index) => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = "quest-question-choice";
      choice.textContent = `${String.fromCharCode(65 + index)}. ${String(optObj.text).slice(0, 120)}`;
      choice.addEventListener("click", () => {
        choices.querySelectorAll("button").forEach((item) => {
          item.disabled = true;
          if (item.dataset.isCorrect === "true") item.classList.add("correct");
        });
        if (!optObj.isCorrect) choice.classList.add("incorrect");
        feedback.textContent = `${optObj.isCorrect ? "Correct!" : "Good try."} ${String(question.explanation || "").slice(0, 300)}`;
        if (window.Sound) optObj.isCorrect ? Sound.good() : Sound.bad();
      });
      choice.dataset.isCorrect = String(optObj.isCorrect);
      choices.appendChild(choice);
    });
    slot.append(choices, feedback);
    button.textContent = "↻ RESET QUESTION";
  }

  function launchGame(levelId) {
    const safeLevelId = Number(levelId);
    const user = AppState.getUser();
    if (!Number.isInteger(safeLevelId) || safeLevelId < 1 || safeLevelId > 8
      || safeLevelId > Math.max(1, Number(user?.unlockedLevel) || 1)) {
      window.location.hash = "#/hub";
      return;
    }
    activeLevelId = safeLevelId;
    const container = document.getElementById("gameArenaSlot");
    container.innerHTML = "";
    const activeLevel = AppState.getLevelById(safeLevelId);
    window.CyberGameRuntime = window.CyberGameRuntime || {};
    window.CyberGameRuntime.activeLevel = activeLevel || null;

    const config = getGameConfig();
    if (user && config.startLives) {
      user.lives = config.startLives;
      updateHUD();
    }

    const engines = [
      Level1_Password,
      Level2_Phishing,
      QuestLevel3Links,
      QuestLevel4Files,
      QuestLevel5Ransomware,
      Level7_SpyDevice,
      QuestLevel7Password,
      Level4_SocialEngineering
    ];

    activeGame = engines[levelId - 1] || Level1_Password;
    startMissionTelemetry(levelId);
    activeGame.init(container, result => handleLevelFinished({
      ...result,
      levelId,
      message: result.won ? "Great spotting! You made your game world safer." : "Good try! Follow the clue and give it another go."
    }));

    const level = activeLevel;
    const stage = container.querySelector(".game-stage");
    stage?.querySelector(".level-badge-header")?.remove();
    stage?.querySelector(".game-instruction")?.remove();
    stage?.querySelector(".game-tip-banner")?.remove();

    const playInstructions = [
      "Jump over weak passwords. Use ← → / A D and Space, or touch controls.",
      "Catch safe messages. Avoid suspicious mail.",
      "Pick a safe link after checking the website name.",
      "Defend the 4×4 grid! Deploy Antivirus, Firewalls, Freeze, and Cleaners to halt virus spread.",
      "Answer the clues to help rescue the locked files.",
      "Tap or click the hidden gadgets.",
      "Analyze the personal profile and identify which password is most vulnerable to being guessed.",
      "Choose the safest response. Never share a sign-in code."
    ];

    if (level && stage) {
      const heading = document.createElement("header");
      heading.className = "quest-game-heading";
      const number = document.createElement("span");
      number.className = "quest-game-level";
      number.textContent = `LEVEL ${levelId}`;
      const title = document.createElement("h2");
      title.textContent = level.name;
      const goal = document.createElement("p");
      goal.textContent = playInstructions[levelId - 1] || level.goal;
      heading.append(number, title, goal);
      stage.prepend(heading);
    }

    // Apply game customizations to DOM elements inside the active mission
    setTimeout(() => {
      // Toggle hints
      const tipBanners = container.querySelectorAll(".game-tip-banner");
      tipBanners.forEach(banner => {
        banner.style.display = config.showHints ? "" : "none";
      });

      // Toggle timer display
      if (!config.showTimer) {
        const timerEls = container.querySelectorAll("#timeVal, .digital-countdown-clock");
        timerEls.forEach(el => {
          el.style.opacity = "0.2";
          el.title = "Timer hidden via Game Customization";
        });
      }
    }, 60);
  }

  function startMissionTelemetry(levelId) {
    clearInterval(missionTelemetryInterval);
    detachMissionTelemetryListeners();
    missionTelemetryStartedAt = Date.now();
    const level = AppState.getLevelById(levelId);
    const title = document.getElementById("missionLiveTitle");
    const state = document.getElementById("missionLiveState");
    const elapsed = document.getElementById("missionElapsedTime");
    const wallClock = document.getElementById("missionWallClock");
    const feed = document.getElementById("missionFeedText");
    const gameHints = [
      "Your game is ready!",
      "Look closely for clues.",
      "Pause before you tap.",
      "Nice spotting, Cyber Explorer!"
    ];
    let lastInputAt = 0;
    let lastPointerAt = 0;

    if (title) title.textContent = level?.name || `Level ${levelId}`;
    if (state) {
      state.classList.remove("inactive");
      state.innerHTML = "<i></i> GAME LIVE";
    }
    let lastFeedIndex = -1;
    const refresh = () => {
      const now = new Date();
      const elapsedSeconds = Math.floor((Date.now() - missionTelemetryStartedAt) / 1000);
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      const elapsedText = hours > 0
        ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      if (elapsed) elapsed.textContent = elapsedText;
      if (wallClock) wallClock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const feedIndex = Math.floor(elapsedSeconds / 5) % gameHints.length;
      if (feed && feedIndex !== lastFeedIndex && Date.now() - lastInputAt >= 4000) {
        feed.textContent = gameHints[feedIndex];
        lastFeedIndex = feedIndex;
      }
    };
    const recordActivity = (message) => {
      if (!feed) return;
      lastInputAt = Date.now();
      feed.textContent = message;
      feed.classList.remove("feed-update");
      void feed.offsetWidth;
      feed.classList.add("feed-update");
    };
    missionTelemetrySurface = document.getElementById("gameArenaSlot");
    missionTelemetryInputHandler = (event) => {
      const control = event.target.closest("button,[role='button'],.char-block,[class*='node'],[class*='tile'],[class*='app-item'],[class*='asset']");
      if (!control) return;
      const label = (control.getAttribute("aria-label") || control.textContent || "game button").replace(/\s+/g, " ").trim().slice(0, 32);
      recordActivity(`Nice move: ${label}.`);
    };
    missionTelemetryPointerHandler = () => {
      const now = Date.now();
      if (now - lastPointerAt < 900) return;
      lastPointerAt = now;
      recordActivity("Keep looking for clues!");
    };
    missionTelemetryKeyHandler = (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", " "].includes(event.key)) return;
      recordActivity(event.key === " " ? "Jump!" : "Good move!");
    };
    missionTelemetrySurface?.addEventListener("click", missionTelemetryInputHandler);
    missionTelemetrySurface?.addEventListener("pointermove", missionTelemetryPointerHandler, { passive: true });
    document.addEventListener("keydown", missionTelemetryKeyHandler);
    refresh();
    missionTelemetryInterval = setInterval(refresh, 1000);
  }

  function detachMissionTelemetryListeners() {
    missionTelemetrySurface?.removeEventListener("click", missionTelemetryInputHandler);
    missionTelemetrySurface?.removeEventListener("pointermove", missionTelemetryPointerHandler);
    if (missionTelemetryKeyHandler) document.removeEventListener("keydown", missionTelemetryKeyHandler);
    missionTelemetrySurface = null;
    missionTelemetryInputHandler = null;
    missionTelemetryPointerHandler = null;
    missionTelemetryKeyHandler = null;
  }

  function stopMissionTelemetry(statusText) {
    clearInterval(missionTelemetryInterval);
    missionTelemetryInterval = null;
    detachMissionTelemetryListeners();
    const state = document.getElementById("missionLiveState");
    const feed = document.getElementById("missionFeedText");
    if (state) {
      state.classList.add("inactive");
      state.textContent = statusText;
    }
    if (feed) feed.textContent = "Game paused. Take a breath and try again.";
  }

  function exitCurrentGame() {
    const doExit = () => {
      if (activeGame && activeGame.cleanup) {
        activeGame.cleanup();
      }
      stopMissionTelemetry("SESSION ENDED");
      window.location.hash = "#/hub";
    };

    if (window.CyberPopup) {
      CyberPopup.confirm(
        'EXIT ACTIVE SIMULATION?',
        'Are you sure you want to abort this mission? Any uncompleted round progress will be lost.',
        doExit
      );
    } else {
      doExit();
    }
  }

  async function handleLevelFinished(result) {
    stopMissionTelemetry(result.won ? "QUEST COMPLETE" : "ROUND OVER");
    const modal = document.getElementById("levelResultModal");
    const title = document.getElementById("resultTitle");
    const scoreVal = document.getElementById("resultScore");
    const msg = document.getElementById("resultMessage");
    const btnContinue = document.getElementById("btnResultContinue");
    const card = modal?.querySelector(".result-card");
    let pointsAwarded = 0;
    let completionSave = null;
    let saveError = null;

    if (result.won) {
      Sound.win();
      const config = getGameConfig();
      const level = AppState.getLevelById(result.levelId);
      let earnedScore = Number(level?.clearReward) || Number(result.score) || 0;
      if (config.difficulty === 'hard') earnedScore = Math.round(earnedScore * 1.5);
      else if (config.difficulty === 'easy') earnedScore = Math.round(earnedScore * 0.85);

      try {
        completionSave = await AppState.completeLevel(result.levelId, earnedScore);
        pointsAwarded = Number(completionSave?.pointsAwarded) || 0;
      } catch (error) {
        saveError = error;
      }
      if (window.CyberFX) {
        CyberFX.confetti();
        if (card) CyberFX.tada(card);
        if (saveError) {
          CyberFX.toast(saveError.message || "Your progress could not be saved.", "warning");
        } else if (pointsAwarded && completionSave?.localOnly) {
          CyberFX.toast(`Level clear saved on this device: +${pointsAwarded} points.`, "info");
        } else if (pointsAwarded && !completionSave?.leaderboardSynced) {
          CyberFX.toast(`Progress saved: +${pointsAwarded} points. Live Ranks may update later.`, "info");
        } else {
          CyberFX.toast(pointsAwarded
            ? `Level cleared! +${pointsAwarded} points`
            : "Level cleared again! Points were earned on your first clear.", "success");
        }
      }

      // High-impact CyberPopup on Level Unlock
      const nextLevelId = result.levelId + 1;
      const nextLevel = AppState.getLevelById(nextLevelId);
      if (nextLevel && window.CyberPopup && nextLevelId <= 8) {
        setTimeout(() => {
          CyberPopup.levelUnlock(nextLevel.name, nextLevelId);
        }, 1400);
      }
    } else {
      Sound.lose();
      if (window.CyberFX) {
        if (card) CyberFX.shake(card);
        CyberFX.toast("Good try. Follow the clue and try again!", "danger");
      }
    }

    title.textContent = result.won ? "🎉 GREAT JOB!" : "💙 TRY AGAIN!";
    title.className = result.won ? "result-title win" : "result-title lose";
    scoreVal.textContent = result.won
      ? (pointsAwarded ? `+${pointsAwarded} POINTS` : saveError ? "NOT SAVED" : "LEVEL CLEARED")
      : "KEEP PRACTICING";
    msg.textContent = saveError
      ? `${result.message} Your progress was not saved, so you can retry this level.`
      : result.message;

    modal.classList.remove("hidden");

    btnContinue.onclick = () => {
      modal.classList.add("hidden");
      window.location.hash = "#/hub";
    };
  }

  function renderAchievementsView() {
    const container = document.getElementById("tabContent_achievements");
    if (!container) return;
    const user = AppState.getUser();
    const all = AppState.getAllAchievements();
    const userBadges = user && user.achievements ? user.achievements : [];

    container.innerHTML = `
      <div class="achievements-header-stats">
        <span>UNLOCKED: <strong>${userBadges.length} / ${all.length}</strong></span>
        <span>STATUS: <strong>${escapeHtml(user?.rankTitle || 'Cyber Explorer')}</strong></span>
      </div>
      <div class="achievements-unlocked-grid">
        ${all.map(b => {
          const unlocked = userBadges.includes(b.id);
          return `
            <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
              <div class="badge-icon">${unlocked ? b.icon : '🔒'}</div>
              <div class="badge-info">
                <h4>${b.title}</h4>
                <p>${b.desc}</p>
              </div>
              ${unlocked ? '<span class="badge-check">✔</span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div style="margin-top: 14px; text-align: center;">
        <button class="btn-primary-launch gold" id="btnGoToCertificate">
          🎓 VIEW OFFICIAL CERTIFICATE
        </button>
      </div>
    `;

    document.getElementById("btnGoToCertificate")?.addEventListener("click", () => {
      window.location.hash = "#/certificate";
    });
  }

  function stopLeaderboardSubscription() {
    leaderboardRequestId++;
    if (leaderboardUnsubscribe) {
      leaderboardUnsubscribe();
      leaderboardUnsubscribe = null;
    }
  }

  function renderLeaderboardView() {
    stopLeaderboardSubscription();
    const container = document.getElementById("tabContent_leaderboard");
    if (!container) return;
    const requestId = leaderboardRequestId;
    const user = AppState.getUser();
    const card = document.createElement("div");
    card.className = "leaderboard-card-wrap";
    const header = document.createElement("div");
    header.className = "lb-header";
    const title = document.createElement("h3");
    title.textContent = "🏆 PLAYER RANKS";
    const status = document.createElement("span");
    status.className = "live-pill";
    status.textContent = "CHECKING SCORES";
    header.append(title, status);
    const note = document.createElement("p");
    note.className = "leaderboard-note";
    const list = document.createElement("div");
    list.className = "lb-list";
    list.setAttribute("aria-live", "polite");
    card.append(header, note, list);
    container.replaceChildren(card);

    const showEntries = entries => {
      list.replaceChildren();
      if (!entries?.length) {
        const empty = document.createElement("p");
        empty.className = "leaderboard-empty";
        empty.textContent = "No scores yet. Finish a level to join the ranks!";
        list.appendChild(empty);
        return;
      }

      entries.slice(0, 15).forEach((item, index) => {
        const row = document.createElement("div");
        const isMe = user && String(item.agentName || "").toLowerCase() === String(user.agentName || "").toLowerCase();
        row.className = `lb-row${isMe ? " my-rank-row" : ""}`;
        const rank = document.createElement("div");
        rank.className = "lb-rank";
        rank.textContent = `#${index + 1}`;
        const avatar = document.createElement("div");
        avatar.className = "lb-avatar";
        avatar.textContent = item.avatar || "🦊";
        const info = document.createElement("div");
        info.className = "lb-info";
        const name = document.createElement("div");
        name.className = "lb-name";
        name.textContent = String(item.agentName || "Cyber Explorer").slice(0, 20);
        if (isMe) {
          const youTag = document.createElement("span");
          youTag.className = "you-tag";
          youTag.textContent = " (YOU)";
          name.appendChild(youTag);
        }
        const progress = document.createElement("div");
        progress.className = "lb-badge";
        progress.textContent = `${Math.max(0, Math.min(8, Number(item.completed) || 0))}/8 levels cleared`;
        info.append(name, progress);
        const score = document.createElement("div");
        score.className = "lb-score";
        score.textContent = `${Math.max(0, Math.floor(Number(item.score) || 0))} PTS`;
        row.append(rank, avatar, info, score);
        list.appendChild(row);
      });
    };

    const unsubscribe = user?.isGuest ? null : FirebaseBridge.watchLeaderboard((entries, error) => {
      if (requestId !== leaderboardRequestId) return;
      if (error) {
        status.textContent = "LOCAL SCORES";
        note.textContent = "Live ranks are unavailable right now. Showing scores saved on this device.";
        FirebaseBridge.getLeaderboard().then(showEntries);
        return;
      }
      status.textContent = "🔴 LIVE RANKS";
      note.textContent = "Scores update as players finish a level.";
      showEntries(entries);
    });

    if (unsubscribe) {
      leaderboardUnsubscribe = unsubscribe;
      status.textContent = "CONNECTING…";
      note.textContent = "Joining the live score board.";
      return;
    }

    status.textContent = "ON THIS DEVICE";
    note.textContent = user?.isGuest
      ? "This score list is saved here. Sign in to see live ranks."
      : "Sign in with an online account to see live ranks.";
    FirebaseBridge.getLeaderboard().then(entries => {
      if (requestId === leaderboardRequestId) showEntries(entries);
    });
  }

  function renderCertificateView() {
    const canvas = document.getElementById("certCanvas");
    const user = AppState.getUser();
    CertificateEngine.generate(canvas, user);

    document.getElementById("btnDownloadCertPNG")?.addEventListener("click", () => {
      CertificateEngine.download(canvas, `CyberShield_Certificate_${user?.agentName || 'Agent'}.png`);
      Sound.win();
    });

    document.getElementById("btnPrintCert")?.addEventListener("click", () => {
      window.print();
    });
  }

  function openSettingsModal() {
    const modal = document.getElementById("settingsModal");
    if (!modal) return;
    modal.classList.remove("hidden");

    // Tab-Based Switching Setup
    const tabButtons = modal.querySelectorAll(".settings-tab-btn");
    const panels = {
      gameplay: document.getElementById("settingsPanel_gameplay"),
      audiovisual: document.getElementById("settingsPanel_audiovisual"),
      account: document.getElementById("settingsPanel_account")
    };

    const switchSettingsTab = (targetTab) => {
      tabButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === targetTab);
      });
      Object.entries(panels).forEach(([key, panel]) => {
        if (!panel) return;
        if (key === targetTab) {
          panel.classList.remove("hidden");
        } else {
          panel.classList.add("hidden");
        }
      });
    };

    tabButtons.forEach(btn => {
      btn.onclick = () => {
        if (window.Sound) Sound.click();
        switchSettingsTab(btn.dataset.tab);
      };
    });

    // Populate Current Audio State
    const sfxBtn = document.getElementById("toggleSfxSetting");
    const musicBtn = document.getElementById("toggleMusicSetting");
    if (sfxBtn) {
      sfxBtn.textContent = Sound.isSfxOn() ? "🔊 SFX: ON" : "🔈 SFX: OFF";
      sfxBtn.onclick = () => {
        const on = Sound.toggleSfx();
        sfxBtn.textContent = on ? "🔊 SFX: ON" : "🔈 SFX: OFF";
      };
    }
    if (musicBtn) {
      musicBtn.textContent = Sound.isMusicOn() ? "🎵 MUSIC: ON" : "🔇 MUSIC: OFF";
      musicBtn.onclick = () => {
        const on = Sound.toggleMusic();
        musicBtn.textContent = on ? "🎵 MUSIC: ON" : "🔇 MUSIC: OFF";
      };
    }

    // Populate Online Data State
    const firebaseStatus = document.getElementById("firebaseStatusBadge");
    if (firebaseStatus) {
      firebaseStatus.textContent = FirebaseBridge.isLiveMode()
        ? "Connected"
        : "Local Storage";
      firebaseStatus.className = FirebaseBridge.isLiveMode() ? "tag green" : "tag orange";
    }

    // Populate Gameplay Customization
    const cfg = getGameConfig();
    const selDifficulty = document.getElementById("cfgDifficulty");
    if (selDifficulty) {
      selDifficulty.value = cfg.difficulty || "normal";
      selDifficulty.onchange = (e) => {
        updateGameConfig({ difficulty: e.target.value });
        if (window.CyberFX) CyberFX.toast(`Difficulty set to ${e.target.value.toUpperCase()}`, "success");
      };
    }

    const btnTimer = document.getElementById("cfgTimerToggle");
    if (btnTimer) {
      btnTimer.textContent = cfg.showTimer ? '⏱️ TIMER: ON' : '⏱️ TIMER: OFF';
      btnTimer.onclick = () => {
        const cur = getGameConfig();
        const next = !cur.showTimer;
        updateGameConfig({ showTimer: next });
        btnTimer.textContent = next ? '⏱️ TIMER: ON' : '⏱️ TIMER: OFF';
        if (window.CyberFX) CyberFX.toast(`Timer display ${next ? 'enabled' : 'hidden'}`, "success");
      };
    }

    const btnHints = document.getElementById("cfgHintsToggle");
    if (btnHints) {
      btnHints.textContent = cfg.showHints ? '💡 HINTS: ON' : '💡 HINTS: OFF';
      btnHints.onclick = () => {
        const cur = getGameConfig();
        const next = !cur.showHints;
        updateGameConfig({ showHints: next });
        btnHints.textContent = next ? '💡 HINTS: ON' : '💡 HINTS: OFF';
        if (window.CyberFX) CyberFX.toast(`Defensive hints ${next ? 'enabled' : 'hidden'}`, "success");
      };
    }

    const selLives = document.getElementById("cfgLives");
    if (selLives) {
      selLives.value = String(cfg.startLives || 3);
      selLives.onchange = (e) => {
        const lives = parseInt(e.target.value, 10);
        updateGameConfig({ startLives: lives });
        AppState.setLives(lives);
        updateHUD();
        if (window.CyberFX) CyberFX.toast(`Starting lives set to ${lives}`, "success");
      };
    }

    const selSpeed = document.getElementById("cfgSpeed");
    if (selSpeed) {
      selSpeed.value = cfg.gameSpeed || "normal";
      selSpeed.onchange = (e) => {
        updateGameConfig({ gameSpeed: e.target.value });
        if (window.CyberFX) CyberFX.toast(`Game speed set to ${e.target.value.toUpperCase()}`, "success");
      };
    }

    const selPhosphor = document.getElementById("cfgPhosphor");
    if (selPhosphor) {
      selPhosphor.value = cfg.phosphor || "green";
      selPhosphor.onchange = (e) => {
        const color = e.target.value;
        updateGameConfig({ phosphor: color });
        if (window.CyberFX) CyberFX.toast(`Terminal phosphor set to ${color.toUpperCase()}`, "success");
      };
    }

    const btnCrt = document.getElementById("cfgCrtToggle");
    if (btnCrt) {
      btnCrt.textContent = cfg.crtScanlines !== false ? '📺 CRT: ACTIVE' : '📺 CRT: DISABLED';
      btnCrt.onclick = () => {
        const cur = getGameConfig();
        const next = cur.crtScanlines === false;
        updateGameConfig({ crtScanlines: next });
        btnCrt.textContent = next ? '📺 CRT: ACTIVE' : '📺 CRT: DISABLED';
        if (window.CyberFX) CyberFX.toast(`CRT Scanline filter ${next ? 'active' : 'disabled'}`, "success");
      };
    }

    const btnReset = document.getElementById("cfgResetDefaults");
    if (btnReset) {
      btnReset.onclick = () => {
        const defaults = {
          difficulty: 'normal',
          showTimer: true,
          showHints: true,
          startLives: 3,
          gameSpeed: 'normal',
          phosphor: 'green',
          crtScanlines: true
        };
        localStorage.setItem('cybershield_game_config', JSON.stringify(defaults));
        applyGameConfigToDOM();
        openSettingsModal();
        if (window.CyberFX) CyberFX.toast("Mission configuration reset to defaults.", "success");
      };
    }

    // Logout and Close Handlers
    const btnLogout = document.getElementById("btnLogoutAgent");
    if (btnLogout) {
      btnLogout.onclick = () => {
        FirebaseBridge.logout();
        modal.classList.add("hidden");
        window.location.hash = "#/auth";
      };
    }

    const closeSettings = () => {
      modal.classList.add("hidden");
      if (window.Sound) Sound.click();
    };

    const btnCloseBottom = document.getElementById("btnCloseSettings");
    if (btnCloseBottom) btnCloseBottom.onclick = closeSettings;

    const btnCloseTop = document.getElementById("btnCloseSettingsTop");
    if (btnCloseTop) btnCloseTop.onclick = closeSettings;
  }

  // ==========================================================================
  // FORM VALIDATION & FEEDBACK HELPERS
  // ==========================================================================
  function validateField(type, input) {
    if (!input) return;
    const val = (type.includes("password") || type.includes("confirm")) ? input.value : input.value.trim();

    let error = null;
    if (type === 'name' || type === 'login-name') {
      if (!val) error = "Enter your username.";
      else if (val.length < 3 || val.length > 20) error = "Username must be 3–20 characters.";
      else if (!/^[a-zA-Z0-9_]+$/.test(val)) error = "Letters, numbers, and _ only.";
    } else if (type === 'reg-name') {
      if (!val) error = "Choose a player username.";
      else if (val.length < 3 || val.length > 20) error = "Username must be 3–20 characters.";
      else if (!/^[a-zA-Z0-9_]+$/.test(val)) error = "Letters, numbers, and _ only (no spaces).";
    } else if (type === 'password' || type === 'login-password') {
      if (!val) error = "Enter your password.";
      else if (val.length < 6) error = "Password must be at least 6 characters.";
      else if (val.length > 128) error = "Password cannot exceed 128 characters.";
    } else if (type === 'reg-password') {
      if (!val) error = "Create a password.";
      else if (val.length < 8) error = "Password must be at least 8 characters.";
      else if (val.length > 128) error = "Password cannot exceed 128 characters.";
    } else if (type === 'reg-confirm') {
      const original = document.getElementById("regPassword")?.value || "";
      if (!val) error = "Confirm your password.";
      else if (val !== original) error = "Passwords do not match.";
    }

    if (error) {
      markFieldInvalid(input, error);
    } else {
      markFieldValid(input);
    }
  }

  function markFieldInvalid(input, message) {
    if (!input) return;
    const row = input.closest('.cyber-input-row');
    if (!row) return;
    row.classList.add('validation-error');
    row.classList.remove('validation-success');
    const errorId = `${input.id}-error`;
    let errEl = document.getElementById(errorId);
    if (!errEl) {
      errEl = document.createElement('small');
      errEl.id = errorId;
      errEl.className = 'field-error-msg';
      row.insertAdjacentElement('afterend', errEl);
    }
    errEl.textContent = message;
    if (!Object.prototype.hasOwnProperty.call(input.dataset, "baseDescribedBy")) {
      input.dataset.baseDescribedBy = input.getAttribute("aria-describedby") || "";
    }
    const descriptions = [input.dataset.baseDescribedBy, errorId].filter(Boolean).join(" ");
    if (descriptions) input.setAttribute("aria-describedby", descriptions);
    input.setAttribute("aria-invalid", "true");
  }

  function markFieldValid(input) {
    if (!input) return;
    const row = input.closest('.cyber-input-row');
    if (row) {
      row.classList.remove('validation-error');
      row.classList.add('validation-success');
    }
    removeFieldError(input);
    input.setAttribute("aria-invalid", "false");
  }

  function clearFieldValidation(input) {
    if (!input) return;
    const row = input.closest('.cyber-input-row');
    if (row) row.classList.remove('validation-error', 'validation-success');
    removeFieldError(input);
    input.setAttribute("aria-invalid", "false");
  }
  const clearFieldError = clearFieldValidation;

  function removeFieldError(input) {
    if (!input?.id) return;
    document.getElementById(`${input.id}-error`)?.remove();
    if (Object.prototype.hasOwnProperty.call(input.dataset, "baseDescribedBy")) {
      const base = input.dataset.baseDescribedBy;
      if (base) input.setAttribute("aria-describedby", base);
      else input.removeAttribute("aria-describedby");
      delete input.dataset.baseDescribedBy;
    }
  }

  function clearAllValidationErrors() {
    document.querySelectorAll('.cyber-input-row').forEach(row => row.classList.remove('validation-error', 'validation-success'));
    document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    document.querySelectorAll('#loginUsername, #loginPassword, #regUsername, #regPassword, #regPasswordConfirm, #authAgentName, #authPassword').forEach(input => {
      removeFieldError(input);
      input.setAttribute("aria-invalid", "false");
    });
    const matchInd = document.getElementById("regPasswordMatchIndicator");
    if (matchInd) {
      matchInd.className = "password-match-indicator hidden";
      matchInd.textContent = "";
    }
  }

  function showAuthFeedback(panelId, message, type = "info") {
    const feedback = document.getElementById(panelId);
    if (!feedback) return;
    const text = String(message ?? "").slice(0, 220);
    feedback.textContent = text;
    feedback.className = `auth-form-feedback ${type === "danger" ? "is-error" : type === "success" ? "is-success" : "is-info"}`;
    feedback.classList.toggle("hidden", !text);
    feedback.setAttribute("role", type === "danger" ? "alert" : "status");
    feedback.setAttribute("aria-live", type === "danger" ? "assertive" : "polite");
  }
  const showLoginFeedback = (msg, type = "info") => showAuthFeedback("loginFeedback", msg, type);
  const showRegisterFeedback = (msg, type = "info") => showAuthFeedback("registerFeedback", msg, type);

  function switchAuthTab(tab) {
    const tabLogin = document.getElementById("tabBtnLogin");
    const tabRegister = document.getElementById("tabBtnRegister");
    const tabGuest = document.getElementById("tabBtnGuest");

    const panelLogin = document.getElementById("panelLogin");
    const panelRegister = document.getElementById("panelRegister");
    const panelGuest = document.getElementById("panelGuest");

    clearAllValidationErrors();
    showLoginFeedback("", "info");
    showRegisterFeedback("", "info");

    const isLogin = tab === "login";
    const isRegister = tab === "register";
    const isGuest = tab === "guest";

    isRegisterMode = isRegister;

    if (tabLogin) {
      tabLogin.classList.toggle("active", isLogin);
      tabLogin.setAttribute("aria-selected", String(isLogin));
    }
    if (tabRegister) {
      tabRegister.classList.toggle("active", isRegister);
      tabRegister.setAttribute("aria-selected", String(isRegister));
    }
    if (tabGuest) {
      tabGuest.classList.toggle("active", isGuest);
      tabGuest.setAttribute("aria-selected", String(isGuest));
    }

    if (panelLogin) panelLogin.classList.toggle("hidden", !isLogin);
    if (panelRegister) panelRegister.classList.toggle("hidden", !isRegister);
    if (panelGuest) panelGuest.classList.toggle("hidden", !isGuest);

    if (isLogin) {
      document.getElementById("loginUsername")?.focus();
    } else if (isRegister) {
      document.getElementById("regUsername")?.focus();
    } else if (isGuest) {
      document.getElementById("guestNameInput")?.focus();
    }
  }

  function setupEyeToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
      const isPwd = input.type === "password";
      input.type = isPwd ? "text" : "password";
      btn.textContent = isPwd ? "🙈" : "👁️";
      btn.setAttribute("aria-label", isPwd ? "Hide password" : "Show password");
      btn.setAttribute("aria-pressed", String(isPwd));
    });
  }

  function updateRegPasswordStrength(password) {
    const bar = document.getElementById("regPwdStrengthBar");
    const fill = document.getElementById("regPwdStrengthFill");
    const text = document.getElementById("regPwdStrengthText");
    if (!bar || !fill || !text) return;

    if (!password) {
      bar.style.display = "none";
      return;
    }

    bar.style.display = "flex";
    const len = password.length;
    let score = 0;
    if (len >= 8) score++;
    if (len >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (len < 8) {
      fill.style.width = `${Math.min(30, Math.round((len / 8) * 30))}%`;
      fill.style.background = "#ff7287";
      text.textContent = "TOO SHORT";
      text.style.color = "#ff7287";
    } else if (score <= 2) {
      fill.style.width = "50%";
      fill.style.background = "#ff9a3c";
      text.textContent = "WEAK";
      text.style.color = "#ff9a3c";
    } else if (score <= 4) {
      fill.style.width = "75%";
      fill.style.background = "#ffd34d";
      text.textContent = "GOOD";
      text.style.color = "#ffd34d";
    } else {
      fill.style.width = "100%";
      fill.style.background = "#39db8b";
      text.textContent = "STRONG";
      text.style.color = "#39db8b";
    }
  }

  function updateRegPasswordMatch() {
    const pwdInput = document.getElementById("regPassword");
    const confirmInput = document.getElementById("regPasswordConfirm");
    const indicator = document.getElementById("regPasswordMatchIndicator");
    if (!pwdInput || !confirmInput || !indicator) return;

    const pwd = pwdInput.value;
    const confirm = confirmInput.value;

    if (!confirm) {
      indicator.classList.add("hidden");
      indicator.textContent = "";
      return;
    }

    indicator.classList.remove("hidden");
    if (pwd === confirm) {
      indicator.className = "password-match-indicator match";
      indicator.textContent = "✓ Passwords match";
      clearFieldValidation(confirmInput);
    } else {
      indicator.className = "password-match-indicator mismatch";
      indicator.textContent = "✗ Passwords do not match";
    }
  }

  function setupAuthHandlers() {
    // Tab switching
    document.getElementById("tabBtnLogin")?.addEventListener("click", () => switchAuthTab("login"));
    document.getElementById("tabBtnRegister")?.addEventListener("click", () => switchAuthTab("register"));
    document.getElementById("tabBtnGuest")?.addEventListener("click", () => switchAuthTab("guest"));

    // Quick switch links
    document.getElementById("btnSwitchToRegister")?.addEventListener("click", () => switchAuthTab("register"));
    document.getElementById("btnSwitchToLogin")?.addEventListener("click", () => switchAuthTab("login"));
    document.getElementById("btnGuestToRegister")?.addEventListener("click", () => switchAuthTab("register"));
    document.getElementById("btnGoToGuest")?.addEventListener("click", () => switchAuthTab("guest"));

    // Form Submissions
    document.getElementById("loginForm")?.addEventListener("submit", handleLoginSubmit);
    document.getElementById("registerForm")?.addEventListener("submit", handleRegisterSubmit);
    document.getElementById("btnPlayGuest")?.addEventListener("click", startGuestSession);

    // Eye toggles
    setupEyeToggle("toggleLoginEye", "loginPassword");
    setupEyeToggle("toggleRegPasswordEye", "regPassword");
    setupEyeToggle("toggleRegConfirmEye", "regPasswordConfirm");
    setupEyeToggle("togglePasswordEye", "authPassword");

    // Real-time validation: Login fields
    const loginUser = document.getElementById("loginUsername");
    const loginPwd = document.getElementById("loginPassword");
    if (loginUser) {
      loginUser.addEventListener("blur", () => {
        loginUser.dataset.touched = "true";
        validateField("login-name", loginUser);
      });
      loginUser.addEventListener("input", () => {
        clearFieldError(loginUser);
        if (loginUser.dataset.touched === "true") validateField("login-name", loginUser);
      });
    }
    if (loginPwd) {
      loginPwd.addEventListener("blur", () => {
        loginPwd.dataset.touched = "true";
        validateField("login-password", loginPwd);
      });
      loginPwd.addEventListener("input", () => {
        clearFieldError(loginPwd);
        if (loginPwd.dataset.touched === "true") validateField("login-password", loginPwd);
      });
    }

    // Real-time validation: Register fields
    const regUser = document.getElementById("regUsername");
    const regPwd = document.getElementById("regPassword");
    const regConfirm = document.getElementById("regPasswordConfirm");
    if (regUser) {
      regUser.addEventListener("blur", () => {
        regUser.dataset.touched = "true";
        validateField("reg-name", regUser);
      });
      regUser.addEventListener("input", () => {
        clearFieldError(regUser);
        if (regUser.dataset.touched === "true") validateField("reg-name", regUser);
      });
    }
    if (regPwd) {
      regPwd.addEventListener("blur", () => {
        regPwd.dataset.touched = "true";
        validateField("reg-password", regPwd);
      });
      regPwd.addEventListener("input", () => {
        clearFieldError(regPwd);
        if (regPwd.dataset.touched === "true") validateField("reg-password", regPwd);
        updateRegPasswordStrength(regPwd.value);
        if (regConfirm && regConfirm.value) updateRegPasswordMatch();
      });
    }
    if (regConfirm) {
      regConfirm.addEventListener("blur", () => {
        regConfirm.dataset.touched = "true";
        validateField("reg-confirm", regConfirm);
      });
      regConfirm.addEventListener("input", () => {
        clearFieldError(regConfirm);
        updateRegPasswordMatch();
      });
    }

    // Guest name input
    const guestInput = document.getElementById("guestNameInput");
    guestInput?.addEventListener("input", () => validateGuestName(false));
    guestInput?.addEventListener("blur", () => validateGuestName(false));

    // Compatibility support for legacy elements
    const legacyAuthForm = document.getElementById("authForm");
    if (legacyAuthForm) {
      legacyAuthForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const activeTab = document.getElementById("tabBtnRegister")?.classList.contains("active") ? "register" : "login";
        if (activeTab === "register") handleRegisterSubmit(e);
        else handleLoginSubmit(e);
      });
    }
    document.getElementById("btnShowAccountForm")?.addEventListener("click", () => switchAuthTab("login"));
    document.getElementById("btnHideAccountForm")?.addEventListener("click", () => switchAuthTab("guest"));
    document.getElementById("btnSwitchAuthMode")?.addEventListener("click", () => {
      const activeTab = document.getElementById("tabBtnRegister")?.classList.contains("active") ? "register" : "login";
      switchAuthTab(activeTab === "register" ? "login" : "register");
    });
  }

  function getFriendlyAuthError(error, isRegister) {
    const code = String(error?.code || "").toLowerCase();
    if (["auth/network-request-failed", "firestore/unavailable", "unavailable", "networkerror"].includes(code)) {
      return "Connection problem. Check your internet and try again, or play as a guest.";
    }
    if (["auth/too-many-requests", "auth/quota-exceeded"].includes(code)) {
      return "There have been too many tries. Wait a little, then try again.";
    }
    if (isRegister && code === "auth/email-already-in-use") {
      return "That player name is already in use. Choose another.";
    }
    if (isRegister && code === "auth/weak-password") {
      return "Choose a longer passphrase with at least 8 characters.";
    }
    if (["auth/operation-not-allowed", "auth/unauthorized-domain"].includes(code)) {
      return "Player accounts are unavailable right now. You can still play as a guest.";
    }

    const safeMessages = new Set([
      "Could not save your player profile. Please try again.",
      "Could not load your player profile. Please try again.",
      "Could not update your player profile. Please try again.",
      "That game name is already used on this device.",
      "That player name is already in use. Choose another."
    ]);
    if (safeMessages.has(String(error?.message || ""))) return error.message;
    return isRegister
      ? "We couldn't create your player account right now. Check your connection or play as a guest."
      : "We couldn't sign you in. Check your player name and passphrase.";
  }

  function validateGuestName() {
    const input = document.getElementById("guestNameInput");
    const helper = document.getElementById("guestNameHelp");
    if (!input || !helper) return true;
    const value = input.value.trim();
    const valid = !value || /^[a-zA-Z0-9 _-]{2,18}$/.test(value);
    input.setAttribute("aria-invalid", String(!valid));
    helper.classList.toggle("is-error", !valid);
    helper.textContent = valid
      ? "Your progress stays on this device. Use a nickname, not your real name."
      : "Use 2–18 letters, numbers, spaces, _ or -. Choose a nickname, not your real name.";
    return valid;
  }

  // ==========================================================================
  // GAME CUSTOMIZATION CONFIGURATION MANAGER
  // ==========================================================================
  function getGameConfig() {
    try {
      const saved = localStorage.getItem('cybershield_game_config');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      difficulty: 'normal',
      showTimer: true,
      showHints: true,
      startLives: 3,
      gameSpeed: 'normal',
      phosphor: 'green',
      crtScanlines: true
    };
  }

  function updateGameConfig(partial) {
    const current = getGameConfig();
    const updated = { ...current, ...partial };
    localStorage.setItem('cybershield_game_config', JSON.stringify(updated));
    applyGameConfigToDOM(updated);
    window.dispatchEvent(new CustomEvent('gameconfigchange', { detail: updated }));
    return updated;
  }

  function applyGameConfigToDOM(cfg) {
    const config = cfg || getGameConfig();

    window.CyberGameRuntime = window.CyberGameRuntime || {};
    window.CyberGameRuntime.settings = { ...config };
    window.CyberGameRuntime.getSpeedScale = () => {
      const pace = window.CyberGameRuntime.settings?.gameSpeed || "normal";
      return pace === "slow" ? 0.68 : pace === "fast" ? 1.4 : 1;
    };
    window.CyberGameRuntime.getTimeLimitSeconds = (fallbackSeconds = 150) => {
      const value = window.CyberGameRuntime.activeLevel?.defaultTime || "02:30";
      const match = typeof value === "string" && /^(\d{2}):([0-5]\d)$/.exec(value);
      const seconds = match ? Number(match[1]) * 60 + Number(match[2]) : 0;
      return seconds >= 15 && seconds <= 600 ? seconds : (fallbackSeconds || 150);
    };
    const paceSelect = document.getElementById("missionSpeedSelect");
    if (paceSelect && paceSelect.value !== (config.gameSpeed || "normal")) {
      paceSelect.value = config.gameSpeed || "normal";
    }
    
    // Apply terminal phosphor color variant
    const phosphor = config.phosphor || 'green';
    document.body.setAttribute('data-phosphor', phosphor);
    document.documentElement.setAttribute('data-phosphor', phosphor);

    // Apply CRT scanline visibility
    const crtActive = config.crtScanlines !== false;
    document.body.setAttribute('data-crt', String(crtActive));
    document.documentElement.setAttribute('data-crt', String(crtActive));

    // Sync lives to user if logged in and startLives is set
    const user = AppState.getUser();
    if (user && config.startLives && (user.lives === undefined || user.lives < 1)) {
      user.lives = config.startLives;
      updateHUD();
    }
  }

  // ==========================================================================
  // Short animated welcome screen
  // ==========================================================================
  function playBootLoading(onComplete) {
    const loadingScreen = document.getElementById("loadingScreen");
    const percentDisplay = document.getElementById("loadingPercentDisplay");
    const progressBar = document.getElementById("loadingCapsuleFill");
    const progressTrack = progressBar?.parentElement;
    const telemetryText = document.getElementById("loadingTelemetryText");
    const telemetrySub = document.getElementById("loadingTelemetrySub");
    const skipButton = document.getElementById("btnSkipBoot");

    if (!loadingScreen) {
      if (onComplete) onComplete();
      return;
    }

    // Hide other views while loading
    const authScreen = document.getElementById("authScreen");
    const hubScreen = document.getElementById("hubScreen");
    const gameScreen = document.getElementById("gameScreen");
    const adminView = document.getElementById("adminViewContainer");
    const certView = document.getElementById("certificateViewContainer");
    [authScreen, hubScreen, gameScreen, adminView, certView].forEach(el => el?.classList.add("hidden"));

    loadingScreen.classList.remove("hidden", "is-complete");
    void loadingScreen.offsetWidth;
    if (skipButton) skipButton.disabled = false;
    isLoadingActive = true;

    if (loadingTimer) cancelAnimationFrame(loadingTimer);
    loadingTimer = null;

    const stages = [
      { at: 0, msg: "Waking up your cyber buddy...", sub: "Getting your games ready" },
      { at: 25, msg: "Checking your safety shield...", sub: "Shield is ready" },
      { at: 50, msg: "Loading fun challenges...", sub: "Games are ready" },
      { at: 75, msg: "Getting the link radar ready...", sub: "Smart-click radar is ready" },
      { at: 96, msg: "All set! Let’s play!", sub: "Ready for a cyber adventure" }
    ];

    function updateStageText(p) {
      let stage = stages[0];
      for (let i = stages.length - 1; i >= 0; i--) {
        if (p >= stages[i].at) {
          stage = stages[i];
          break;
        }
      }
      if (telemetryText) telemetryText.textContent = stage.msg;
      if (telemetrySub) telemetrySub.textContent = stage.sub;
    }

    if (percentDisplay) percentDisplay.textContent = "0%";
    if (progressBar) progressBar.style.width = "0%";
    progressTrack?.setAttribute("aria-valuenow", "0");
    updateStageText(0);

    const startedAt = performance.now();
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 450 : 2200;
    function animateBoot(now) {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 2.4);
      const progress = Math.round(eased * 100);

      if (percentDisplay) percentDisplay.textContent = `${progress}%`;
      if (progressBar) progressBar.style.width = `${progress}%`;
      progressTrack?.setAttribute("aria-valuenow", String(progress));
      updateStageText(progress);

      if (elapsed < 1) {
        loadingTimer = requestAnimationFrame(animateBoot);
        return;
      }

      loadingTimer = null;
      if (skipButton) skipButton.disabled = true;
      loadingScreen.classList.add("is-complete");
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        loadingScreen.classList.remove("is-complete");
        isLoadingActive = false;
        if (window.Sound) Sound.good();
        if (onComplete) onComplete();
        else handleRoute();
      }, 280);
    }

    loadingTimer = requestAnimationFrame(animateBoot);
  }

  function skipBootLoading() {
    if (!isLoadingActive) return;
    if (loadingTimer) {
      cancelAnimationFrame(loadingTimer);
      loadingTimer = null;
    }
    const percentDisplay = document.getElementById("loadingPercentDisplay");
    const progressBar = document.getElementById("loadingCapsuleFill");
    if (percentDisplay) percentDisplay.textContent = "100%";
    if (progressBar) progressBar.style.width = "100%";
    progressBar?.parentElement?.setAttribute("aria-valuenow", "100");

    const loadingScreen = document.getElementById("loadingScreen");
    const skipButton = document.getElementById("btnSkipBoot");
    if (skipButton) skipButton.disabled = true;
    if (loadingScreen) loadingScreen.classList.add("hidden");
    isLoadingActive = false;
    handleRoute();
  }

  return {
    init,
    applyBranding,
    refreshBranding: () => {
      applyBranding();
      if ((window.location.hash || "#/hub") === "#/hub" && AppState.getUser()) renderHomeView();
    },
    refreshLevels: () => {
      if (!document.getElementById("hubScreen")?.classList.contains("hidden")) renderLevelsList();
    },
    getGameConfig,
    updateGameConfig,
    playBootLoading,
    skipBootLoading,
    getQuestionsForLevel: (lvlId) => {
      const id = Number(lvlId) || 1;
      return missionQuestionBank[id] || missionQuestionBank[1];
    },
    getAllQuestions: () => missionQuestionBank,
    shuffleArray
  };
})();

window.App = App;
window.addEventListener("DOMContentLoaded", App.init);
