// Admin Panel Controller for Cyber Shield (#/admin Route)
const AdminPanel = (function() {
  let currentAdminTab = "branding";
  const timedGameLevels = new Set([1, 2, 6, 8]);

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
    render();
  }

  function checkAdminAuth() {
    return !!FirebaseBridge.getAdminSession();
  }

  function render() {
    const container = document.getElementById("adminViewContainer");
    if (!container) return;

    const session = FirebaseBridge.getAdminSession();
    if (!session) {
      renderAuthGate(container);
      return;
    }

    renderDashboard(container, session);
  }

  function renderAuthGate(container) {
    container.innerHTML = `
      <div class="admin-auth-gate">
        <div class="admin-lock-icon">🔐</div>
        <h2>CYBERQUEST ADMIN</h2>
        <p class="admin-sub">Sign in with an administrator account.</p>
        
        <form id="adminAuthForm" class="admin-pin-box" autocomplete="on" novalidate>
          <div class="auth-input-group" style="margin-bottom: 10px;">
            <span class="input-icon">🛡️</span>
            <input type="email" id="adminEmailInput" placeholder="Administrator email" required maxlength="254" autocomplete="username" aria-describedby="adminAuthError" aria-invalid="false">
          </div>

          <div class="auth-input-group" style="margin-bottom: 12px; position:relative;">
            <span class="input-icon">🔑</span>
            <input type="password" id="adminPassInput" placeholder="Administrator password" required maxlength="128" autocomplete="current-password" aria-describedby="adminAuthError" aria-invalid="false">
            <button type="button" class="eye-toggle" id="toggleAdminPassEye" title="Show or hide password" aria-label="Show password" aria-pressed="false">👁️</button>
          </div>

          <div id="adminAuthError" class="admin-auth-feedback" role="alert" aria-live="assertive" aria-atomic="true" hidden></div>

          <button type="submit" class="btn-admin-enter" id="btnAdminLogin">
            Authenticate Administrator ➔
          </button>
        </form>

        <a href="#/hub" class="back-to-hub-link">← Return to Agent Game Hub</a>
      </div>
    `;

    const form = document.getElementById("adminAuthForm");
    const emailInp = document.getElementById("adminEmailInput");
    const passInp = document.getElementById("adminPassInput");
    const errBox = document.getElementById("adminAuthError");
    const eyeBtn = document.getElementById("toggleAdminPassEye");
    let isSubmitting = false;

    const showAdminError = (message, invalidInput = null) => {
      errBox.textContent = message;
      errBox.hidden = false;
      if (invalidInput) {
        invalidInput.setAttribute("aria-invalid", "true");
        invalidInput.focus();
      }
      if (window.CyberFX) {
        CyberFX.toast(message, "danger");
        const gate = document.querySelector(".admin-auth-gate");
        if (gate) CyberFX.shake(gate);
      }
    };

    [emailInp, passInp].forEach((input) => input?.addEventListener("input", () => {
      input.setAttribute("aria-invalid", "false");
      errBox.hidden = true;
      errBox.textContent = "";
    }));

    eyeBtn?.addEventListener("click", () => {
      const isPwd = passInp.type === "password";
      passInp.type = isPwd ? "text" : "password";
      eyeBtn.textContent = isPwd ? "🙈" : "👁️";
      eyeBtn.setAttribute("aria-label", isPwd ? "Hide password" : "Show password");
      eyeBtn.setAttribute("aria-pressed", String(isPwd));
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      errBox.hidden = true;
      errBox.textContent = "";
      emailInp.setAttribute("aria-invalid", "false");
      passInp.setAttribute("aria-invalid", "false");
      const email = emailInp.value.trim();
      const pass = passInp.value;

      if (!email) return showAdminError("Enter your administrator email.", emailInp);
      if (!emailInp.validity.valid) return showAdminError("Enter a valid email address.", emailInp);
      if (!pass) return showAdminError("Enter your administrator password.", passInp);
      if (pass.length > 128) return showAdminError("Passwords can be up to 128 characters.", passInp);

      const btn = document.getElementById("btnAdminLogin");
      isSubmitting = true;
      btn.textContent = "Verifying Credentials...";
      btn.disabled = true;
      form.setAttribute("aria-busy", "true");

      try {
        await FirebaseBridge.adminLogin(email, pass);
        Sound.win();
        if (window.CyberFX) CyberFX.toast("Administrator signed in.", "success");
        render();
      } catch (err) {
        Sound.bad();
        const code = String(err?.code || "").toLowerCase();
        const message = err?.message === "This account is not set up as an administrator."
          ? "This account does not have administrator access."
          : err?.message === "Administrator sign-in is not configured."
            ? "Administrator sign-in is not configured yet."
            : ["auth/network-request-failed", "firestore/unavailable", "unavailable"].includes(code)
              ? "Connection problem. Check your internet and try again."
              : "We could not verify this administrator account. Check the details and try again.";
        showAdminError(message);
      } finally {
        isSubmitting = false;
        form.removeAttribute("aria-busy");
        btn.textContent = "Authenticate Administrator ➔";
        btn.disabled = false;
      }
    });
  }

  function renderDashboard(container, session) {
    const isLive = FirebaseBridge.isLiveMode();
    const config = FirebaseBridge.getConfig();

    container.innerHTML = `
      <div class="admin-dashboard-wrap">
        <!-- Top Admin Header -->
        <header class="admin-top-bar">
          <div class="admin-brand">
            <span class="icon">🛡️⚡</span>
            <div>
              <div class="title">ADMIN COMMAND PANEL</div>
              <div class="sub">OPERATOR: <b>${escapeHtml(session.email || 'Administrator')}</b> | SAVE MODE: <span class="tag ${isLive ? 'green' : 'orange'}">${isLive ? 'ONLINE ACCOUNTS' : 'THIS DEVICE'}</span></div>
            </div>
          </div>
          <div class="admin-actions">
            <a href="#/hub" class="admin-hub-link">🎮 Agent View</a>
            <button class="admin-logout-btn" id="btnAdminLogout">Lock Console</button>
          </div>
        </header>

        <!-- Admin Navigation Tabs -->
        <nav class="admin-nav-tabs">
          <button class="adm-tab ${currentAdminTab === 'branding' ? 'active' : ''}" data-tab="branding">🎨 Site Customizer</button>
          <button class="adm-tab ${currentAdminTab === 'levels' ? 'active' : ''}" data-tab="levels">📁 Manage Levels</button>
          <button class="adm-tab ${currentAdminTab === 'questions' ? 'active' : ''}" data-tab="questions">❓ Question CRUD</button>
          <button class="adm-tab ${currentAdminTab === 'scores' ? 'active' : ''}" data-tab="scores">📊 User Scores</button>
          <button class="adm-tab ${currentAdminTab === 'reports' ? 'active' : ''}" data-tab="reports">📑 Reports Generator</button>
          <button class="adm-tab ${currentAdminTab === 'activity' ? 'active' : ''}" data-tab="activity">📝 Recent Activity</button>
        </nav>

        <!-- Dynamic Admin Content Body -->
        <div class="admin-tab-body" id="adminTabBody"></div>
      </div>
    `;

    // Event listeners
    container.querySelectorAll(".admin-nav-tabs .adm-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        Sound.click();
        currentAdminTab = tab.dataset.tab;
        render();
      });
    });

    document.getElementById("btnAdminLogout")?.addEventListener("click", () => {
      FirebaseBridge.adminLogout();
      render();
    });

    renderTabContent();
  }

  function renderTabContent() {
    const body = document.getElementById("adminTabBody");
    if (!body) return;

    if (currentAdminTab === "branding") renderBrandingTab(body);
    if (currentAdminTab === "levels") renderLevelsTab(body);
    if (currentAdminTab === "questions") renderQuestionsTab(body);
    if (currentAdminTab === "scores") renderScoresTab(body);
    if (currentAdminTab === "reports") renderReportsTab(body);
    if (currentAdminTab === "activity") renderActivityTab(body);
  }

  // TAB 1: SITE BRANDING, LOGO & SYSTEM MESSAGES CUSTOMIZER
  function renderBrandingTab(body) {
    const branding = FirebaseBridge.getBrandingConfig();

    body.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <div>
            <h3>🎨 PLATFORM BRANDING, LOGO & SYSTEM MESSAGES</h3>
            <p class="adm-desc">Customize platform identity, emblems, logos, motto, announcements, and level messages in real time.</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-save-branding" id="btnSaveBranding">💾 Save Customizations</button>
            <button class="btn-reset-branding" id="btnResetBranding">🔄 Restore Defaults</button>
          </div>
        </div>

        <!-- Live Preview Card -->
        <div class="brand-preview-card" id="brandLivePreviewCard">
          <div style="font-size: 10px; color: var(--text-muted); font-family: 'Share Tech Mono', monospace; margin-bottom: 6px;">
            ⚡ LIVE INTERFACE PREVIEW (UPDATES AS YOU TYPE)
          </div>
          <div class="brand-preview-emblem" id="prevEmblem"></div>
          <div class="brand-preview-title" id="prevTitle">${escapeHtml(branding.appName || 'CYBERQUEST')}</div>
          <div class="brand-preview-sub" id="prevSub">${escapeHtml(branding.appSubtitle || 'ONLINE SAFETY ADVENTURE')}</div>
          <div class="brand-preview-motto" id="prevMotto">"${escapeHtml(branding.loginMotto || 'Learn • Pause • Stay safe')}"</div>
          
          <div id="prevAnnouncement" style="margin-top: 10px; padding: 6px 10px; background: rgba(255, 56, 96, 0.15); border: 1px solid var(--threat); border-radius: 4px; font-size: 10px; font-family: 'Share Tech Mono', monospace; color: #fff; display: ${branding.announcementEnabled ? 'flex' : 'none'}; align-items:center; gap:6px; justify-content:center;">
            <span style="background:var(--threat); color:#0a0e1a; font-weight:bold; padding:2px 5px; border-radius:3px; font-size:9px;">BROADCAST</span>
            <span id="prevAnnouncementText">${escapeHtml(branding.announcementMessage || 'Alert message active')}</span>
          </div>
        </div>

        <!-- Customizer Configuration Grid -->
        <div class="admin-customizer-grid">
          <!-- Column 1: Names & Identity -->
          <div class="customizer-section">
            <h4>🏷️ PLATFORM NAMES & TITLES</h4>
            
            <div class="form-group">
              <label>Application / Platform Name:</label>
              <input type="text" id="cfgAppName" value="${escapeHtml(branding.appName || 'CYBERQUEST')}" placeholder="e.g. CYBERQUEST">
            </div>

            <div class="form-group">
              <label>Top HUD Subtitle / Tagline:</label>
              <input type="text" id="cfgAppSubtitle" value="${escapeHtml(branding.appSubtitle || 'ONLINE SAFETY ADVENTURE')}" placeholder="e.g. ONLINE SAFETY ADVENTURE">
            </div>

            <div class="form-group">
              <label>Login Gateway Subtitle:</label>
              <input type="text" id="cfgLoginSubtitle" value="${escapeHtml(branding.loginSubtitle || 'PLAYER SIGN IN')}" placeholder="e.g. PLAYER SIGN IN">
            </div>

            <div class="form-group">
              <label>Certificate Organization Issuer Name:</label>
              <input type="text" id="cfgCertOrgName" value="${escapeHtml(branding.certificateOrgName || 'CYBERQUEST SAFETY QUEST')}" placeholder="Displayed on player awards">
            </div>

            <div class="form-group">
              <label>Certificate Subtitle:</label>
              <input type="text" id="cfgCertSubtitle" value="${escapeHtml(branding.certificateSubtitle || 'ONLINE SAFETY GAME AWARD')}" placeholder="Award subtitle">
            </div>
          </div>

          <!-- Column 2: Logo & Visual Emblem -->
          <div class="customizer-section">
            <h4>🛡️ LOGO & EMBLEM CUSTOMIZER</h4>

            <div class="form-group">
              <label>Logo Source Type:</label>
              <select id="cfgLogoType">
                <option value="emoji" ${branding.logoType !== 'image' ? 'selected' : ''}>Emoji / Cyber Icon</option>
                <option value="image" ${branding.logoType === 'image' ? 'selected' : ''}>Custom Image URL (PNG/SVG/WebP)</option>
              </select>
            </div>

            <div id="emojiPickerSection" style="display: ${branding.logoType === 'image' ? 'none' : 'block'};">
              <label style="font-size:10px; color:var(--text-muted); display:block; margin-bottom:4px;">Quick-Select Cyber Emblem:</label>
              <div class="emoji-palette" id="emojiPresets">
                ${['🛡️', '⚡', '🦅', '🔒', '👾', '🎯', '☣️', '⚔️', '🌐', '🚀', '💻', '🛰️'].map(e => `
                  <button type="button" class="emoji-chip-btn ${branding.logoIcon === e ? 'selected' : ''}" data-emoji="${e}">${e}</button>
                `).join('')}
              </div>
              <div class="form-group">
                <label>Custom Emoji or Text Glyph:</label>
                <input type="text" id="cfgLogoIcon" value="${escapeHtml(branding.logoIcon || '🛡️')}" placeholder="Type any emoji or symbol">
              </div>
            </div>

            <div id="imagePickerSection" style="display: ${branding.logoType === 'image' ? 'block' : 'none'};">
              <div class="form-group">
                <label>Custom Logo Image URL:</label>
                <input type="url" id="cfgLogoImageUrl" value="${escapeHtml(branding.logoImageUrl || '')}" placeholder="https://example.com/logo.png">
                <span style="font-size:9px; color:var(--text-muted);">Direct URL to transparent PNG, SVG, or WebP graphic.</span>
              </div>
            </div>

            <h4 style="margin-top:16px;">🎮 GAMEPLAY PRESETS</h4>
            <div class="form-group">
              <label>Default Starting Lives for New Recruits:</label>
              <select id="cfgDefaultLives">
                <option value="3" ${branding.defaultLives === 3 ? 'selected' : ''}>3 Lives (Standard Arcade)</option>
                <option value="4" ${branding.defaultLives === 4 ? 'selected' : ''}>4 Lives (Tactical Reserve)</option>
                <option value="5" ${branding.defaultLives === 5 ? 'selected' : ''}>5 Lives (Trainee Assistance)</option>
              </select>
            </div>
          </div>

          <!-- Column 3: Slogans & Welcome Messages -->
          <div class="customizer-section" style="grid-column: 1 / -1;">
            <h4>📢 MOTTO, NOTICES & GLOBAL ANNOUNCEMENTS</h4>

            <div class="form-group">
              <label>Authentication Screen Motto / Slogan:</label>
              <input type="text" id="cfgLoginMotto" value="${escapeHtml(branding.loginMotto || 'Learn • Pause • Stay safe')}" placeholder="e.g. Learn • Pause • Stay safe">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group">
                <label>New Recruit Welcome Card Title:</label>
              <input type="text" id="cfgWelcomeTitle" value="${escapeHtml(branding.welcomeTitle || 'WELCOME, CYBER EXPLORER!')}" placeholder="Greeting title">
              </div>
              <div class="form-group">
                <label>Mission Accomplished Victory Praise:</label>
              <input type="text" id="cfgMissionVictory" value="${escapeHtml(branding.missionVictoryMessage || 'Nice work, Cyber Explorer!')}" placeholder="Victory feedback message">
              </div>
            </div>

            <div class="form-group">
              <label>New Recruit Welcome Instructions / Message:</label>
              <textarea id="cfgWelcomeMessage" rows="2" style="width:100%; background:#060912; border:1px solid var(--border-dim); border-radius:6px; padding:8px; color:#fff; font-family:'Share Tech Mono', monospace; font-size:11px;">${escapeHtml(branding.welcomeMessage || 'Learn to spot online tricks and keep your accounts safe. Choose a game and follow the clues!')}</textarea>
            </div>

            <div class="toggle-row" style="margin-top: 10px;">
              <label class="toggle-switch">
                <input type="checkbox" id="cfgAnnouncementEnabled" ${branding.announcementEnabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <label for="cfgAnnouncementEnabled" style="font-size:11px; color:var(--text-primary); cursor:pointer;">
                <b>Enable Live Threat Broadcast Ticker</b> (Glows across top of Agent Hub)
              </label>
            </div>

            <div class="form-group" style="margin-top:6px;">
              <label>Broadcast Alert Message:</label>
              <input type="text" id="cfgAnnouncementMessage" value="${escapeHtml(branding.announcementMessage || '')}" placeholder="e.g. 🧠 SAFETY TIP: Pause and check before you click.">
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
          <button class="btn-save-branding" id="btnSaveBrandingBottom">💾 Save Platform Customizations</button>
        </div>
      </div>
    `;

    // Hook up real-time live preview
    const prevEmblem = document.getElementById("prevEmblem");
    const prevTitle = document.getElementById("prevTitle");
    const prevSub = document.getElementById("prevSub");
    const prevMotto = document.getElementById("prevMotto");
    const prevAnnouncement = document.getElementById("prevAnnouncement");
    const prevAnnouncementText = document.getElementById("prevAnnouncementText");

    const cfgAppName = document.getElementById("cfgAppName");
    const cfgAppSubtitle = document.getElementById("cfgAppSubtitle");
    const cfgLoginMotto = document.getElementById("cfgLoginMotto");
    const cfgLogoType = document.getElementById("cfgLogoType");
    const cfgLogoIcon = document.getElementById("cfgLogoIcon");
    const cfgLogoImageUrl = document.getElementById("cfgLogoImageUrl");
    const cfgAnnouncementEnabled = document.getElementById("cfgAnnouncementEnabled");
    const cfgAnnouncementMessage = document.getElementById("cfgAnnouncementMessage");
    const emojiPickerSection = document.getElementById("emojiPickerSection");
    const imagePickerSection = document.getElementById("imagePickerSection");

    const renderPreviewLogo = (useImage, url, icon) => {
      if (!prevEmblem) return;
      prevEmblem.replaceChildren();
      const safeUrl = safeImageUrl(url);
      if (!useImage || !safeUrl) {
        prevEmblem.textContent = icon || "🛡️";
        return;
      }
      const image = document.createElement("img");
      image.src = safeUrl;
      image.className = "custom-logo-img";
      image.alt = "Logo";
      image.style.maxHeight = "48px";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => { prevEmblem.textContent = icon || "🛡️"; }, { once: true });
      prevEmblem.appendChild(image);
    };
    renderPreviewLogo(branding.logoType === "image", branding.logoImageUrl, branding.logoIcon);

    const updatePreview = () => {
      if (prevTitle && cfgAppName) prevTitle.textContent = cfgAppName.value || "CYBERQUEST";
      if (prevSub && cfgAppSubtitle) prevSub.textContent = cfgAppSubtitle.value || "ONLINE SAFETY ADVENTURE";
      if (prevMotto && cfgLoginMotto) prevMotto.textContent = `"${cfgLoginMotto.value || 'Learn • Pause • Stay safe'}"`;

      const isImg = cfgLogoType.value === "image";
      renderPreviewLogo(isImg, cfgLogoImageUrl?.value, cfgLogoIcon?.value);

      if (prevAnnouncement && cfgAnnouncementEnabled && cfgAnnouncementMessage) {
        prevAnnouncement.style.display = cfgAnnouncementEnabled.checked ? "flex" : "none";
        prevAnnouncementText.textContent = cfgAnnouncementMessage.value || "Broadcast alert";
      }
    };

    // Listeners for live updating
    [cfgAppName, cfgAppSubtitle, cfgLoginMotto, cfgLogoIcon, cfgLogoImageUrl, cfgAnnouncementMessage].forEach(inp => {
      inp?.addEventListener("input", updatePreview);
    });

    cfgAnnouncementEnabled?.addEventListener("change", updatePreview);

    cfgLogoType?.addEventListener("change", () => {
      const isImg = cfgLogoType.value === "image";
      emojiPickerSection.style.display = isImg ? "none" : "block";
      imagePickerSection.style.display = isImg ? "block" : "none";
      updatePreview();
    });

    // Preset emoji buttons
    document.querySelectorAll(".emoji-chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".emoji-chip-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        cfgLogoIcon.value = btn.dataset.emoji;
        updatePreview();
      });
    });

    // Save handler
    const saveAction = async () => {
      const rawLogoUrl = cfgLogoImageUrl?.value.trim() || "";
      const logoImageUrl = safeImageUrl(rawLogoUrl);
      if (rawLogoUrl && !logoImageUrl) {
        alert("Use a secure HTTPS image link or an image on this site.");
        return;
      }
      const updated = {
        appName: cfgAppName.value.trim() || "CYBERQUEST",
        appSubtitle: cfgAppSubtitle.value.trim() || "ONLINE SAFETY ADVENTURE",
        loginSubtitle: document.getElementById("cfgLoginSubtitle")?.value.trim() || "PLAYER SIGN IN",
        certificateOrgName: document.getElementById("cfgCertOrgName")?.value.trim() || "CYBERQUEST SAFETY QUEST",
        certificateSubtitle: document.getElementById("cfgCertSubtitle")?.value.trim() || "OFFICIAL CERTIFICATE OF CYBERSECURITY PROFICIENCY",
        logoType: cfgLogoType.value,
        logoIcon: cfgLogoIcon.value.trim() || "🛡️",
        logoImageUrl,
        defaultLives: Number(document.getElementById("cfgDefaultLives")?.value || 3),
        loginMotto: cfgLoginMotto.value.trim() || "Learn • Pause • Stay safe",
        welcomeTitle: document.getElementById("cfgWelcomeTitle")?.value.trim() || "WELCOME, CYBER EXPLORER!",
        welcomeMessage: document.getElementById("cfgWelcomeMessage")?.value.trim() || "Learn to spot online tricks and keep your accounts safe. Choose a game and follow the clues!",
        missionVictoryMessage: document.getElementById("cfgMissionVictory")?.value.trim() || "Nice work, Cyber Explorer!",
        announcementEnabled: cfgAnnouncementEnabled.checked,
        announcementMessage: cfgAnnouncementMessage.value.trim()
      };

      try {
        await FirebaseBridge.saveBrandingConfig(updated);
        App.refreshBranding?.();
        Sound.win();
        if (window.CyberFX) {
          CyberFX.toast(FirebaseBridge.isLiveMode()
            ? "Site changes are now shared with players."
            : "Saved on this device. Online sharing is unavailable.", "success");
        }
        render();
      } catch (error) {
        App.refreshBranding?.();
        if (window.CyberFX) CyberFX.toast(error.message || "The shared branding update failed.", "warning");
      }
    };

    document.getElementById("btnSaveBranding")?.addEventListener("click", saveAction);
    document.getElementById("btnSaveBrandingBottom")?.addEventListener("click", saveAction);

    // Reset handler
    document.getElementById("btnResetBranding")?.addEventListener("click", async () => {
      if (confirm("Reset all platform branding, names, logo, and messages to system factory defaults?")) {
        try {
          await FirebaseBridge.resetBrandingConfig();
          App.refreshBranding?.();
          Sound.good();
          if (window.CyberFX) CyberFX.toast("Site branding was reset.", "info");
          render();
        } catch (error) {
          App.refreshBranding?.();
          if (window.CyberFX) CyberFX.toast(error.message || "The shared branding reset failed.", "warning");
        }
      }
    });
  }

  // TAB 2: MANAGE LEVELS & MISSIONS
  function renderLevelsTab(body) {
    const levels = AppState.getLevels();
    body.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <div>
            <h3>CYBERQUEST GAMES (8 LEVELS)</h3>
            <p class="adm-desc">Set game names, clear rewards, timers for timed games, and safety tips.</p>
          </div>
          <button class="btn-reset-branding" id="btnRestoreDefaultLevels">🔄 Restore Default Missions</button>
        </div>

        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Level #</th>
                <th>Mission Name & Icon</th>
                <th>Goal</th>
                <th>Points on Clear</th>
                <th>Timer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${levels.map(l => `
                <tr>
                  <td><b>#${escapeHtml(l.id)}</b></td>
                  <td><b>${escapeHtml(l.icon)} ${escapeHtml(l.name)}</b></td>
                  <td style="max-width: 220px; font-size: 10px; color: #cbd5e1;">${escapeHtml(l.goal)}</td>
                  <td><span class="score-hl">${escapeHtml(l.clearReward ?? l.targetScore)} PTS</span></td>
                  <td>${timedGameLevels.has(Number(l.id)) ? escapeHtml(l.defaultTime) : "No timer"}</td>
                  <td>
                    <button class="btn-edit-level" data-id="${escapeHtml(l.id)}">✏️ Edit Mission</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Edit Level Modal -->
        <div class="admin-modal-overlay hidden" id="editLevelModal">
          <div class="admin-modal-card" style="max-width: 500px; max-height: 85vh; overflow-y: auto;">
            <h4 id="editLevelModalTitle">EDIT MISSION PARAMETERS</h4>
            <input type="hidden" id="editLvlId">

            <div style="display:grid; grid-template-columns: 80px 1fr; gap:10px;">
              <div class="form-group">
                <label>Icon:</label>
                <input type="text" id="editLvlIcon" maxlength="8" placeholder="🔒" required style="text-align:center; font-size:18px;">
              </div>
              <div class="form-group">
                <label>Mission Name:</label>
                <input type="text" id="editLvlName" maxlength="80" placeholder="Game name" required>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group">
                <label>Points on Clear:</label>
                <input type="number" id="editLvlScore" min="0" max="1000" step="1" placeholder="250" required>
              </div>
              <div class="form-group">
                <label>Time Limit (timed games only):</label>
                <input type="text" id="editLvlTime" maxlength="5" placeholder="01:30" aria-describedby="editLvlTimeHelp">
                <small id="editLvlTimeHelp" class="adm-desc">Used by Password Parkour, Phishing Patrol, Spy Gadget Search, and Think Before You Share.</small>
              </div>
            </div>

            <div class="form-group">
              <label>Mission Objective / Goal:</label>
              <textarea id="editLvlGoal" rows="2" maxlength="240" style="width:100%; background:#060912; border:1px solid var(--border-dim); border-radius:6px; padding:8px; color:#fff; font-family:'Share Tech Mono', monospace; font-size:11px;"></textarea>
            </div>

            <div class="form-group">
              <label>Tactical Tip:</label>
              <input type="text" id="editLvlTip" maxlength="240" placeholder="Safety tip">
            </div>

            <h5 style="font-family:'Orbitron',sans-serif; color:var(--cyan); font-size:11px; margin: 12px 0 6px 0; border-top:1px dashed var(--border-dim); padding-top:8px;">
              INTEL BRIEFING ACCORDION
            </h5>

            <div class="form-group">
              <label>⚠️ Threat Vector Description:</label>
              <input type="text" id="editLvlThreat" maxlength="300" placeholder="What might go wrong?">
            </div>

            <div class="form-group">
              <label>🛡️ Defensive Protocol:</label>
              <input type="text" id="editLvlDefense" maxlength="300" placeholder="What is a safe step?">
            </div>

            <div class="form-group">
              <label>💡 Golden Rule:</label>
              <input type="text" id="editLvlRule" maxlength="300" placeholder="Remember this">
            </div>

            <div class="modal-btns">
              <button class="btn-save-q" id="btnSaveLevelChanges">Save Mission Parameters</button>
              <button class="btn-cancel-q" id="btnCancelEditLevel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Modal controls
    const modal = document.getElementById("editLevelModal");
    const idInput = document.getElementById("editLvlId");
    const nameInput = document.getElementById("editLvlName");
    const iconInput = document.getElementById("editLvlIcon");
    const scoreInput = document.getElementById("editLvlScore");
    const timeInput = document.getElementById("editLvlTime");
    const goalInput = document.getElementById("editLvlGoal");
    const tipInput = document.getElementById("editLvlTip");
    const threatInput = document.getElementById("editLvlThreat");
    const defenseInput = document.getElementById("editLvlDefense");
    const ruleInput = document.getElementById("editLvlRule");

    body.querySelectorAll(".btn-edit-level").forEach(btn => {
      btn.addEventListener("click", () => {
        const lvl = AppState.getLevelById(btn.dataset.id);
        if (!lvl) return;
        idInput.value = lvl.id;
        nameInput.value = lvl.name || "";
        iconInput.value = lvl.icon || "";
        scoreInput.value = lvl.clearReward ?? lvl.targetScore ?? 250;
        timeInput.value = lvl.defaultTime || "01:30";
        const usesTimer = timedGameLevels.has(Number(lvl.id));
        timeInput.disabled = !usesTimer;
        timeInput.required = usesTimer;
        timeInput.placeholder = usesTimer ? "01:30" : "No timer for this game";
        goalInput.value = lvl.goal || "";
        tipInput.value = lvl.tip || "";
        threatInput.value = lvl.briefing?.threat || "";
        defenseInput.value = lvl.briefing?.defense || "";
        ruleInput.value = lvl.briefing?.rule || "";

        document.getElementById("editLevelModalTitle").textContent = `EDIT MISSION #${lvl.id}: ${lvl.name.toUpperCase()}`;
        modal.classList.remove("hidden");
      });
    });

    document.getElementById("btnCancelEditLevel")?.addEventListener("click", () => modal.classList.add("hidden"));

    document.getElementById("btnSaveLevelChanges")?.addEventListener("click", async () => {
      const lvlId = Number(idInput.value);
      const clearReward = Number(scoreInput.value);
      const gameTime = timeInput.value.trim();
      const usesTimer = timedGameLevels.has(lvlId);
      const timeParts = /^(\d{2}):([0-5]\d)$/.exec(gameTime);
      const timeSeconds = timeParts ? Number(timeParts[1]) * 60 + Number(timeParts[2]) : 0;
      const textValues = [
        nameInput.value.trim(), goalInput.value.trim(), tipInput.value.trim(),
        threatInput.value.trim(), defenseInput.value.trim(), ruleInput.value.trim()
      ];
      if (!textValues[0] || textValues[0].length > 80
        || !Number.isInteger(clearReward) || clearReward < 1 || clearReward > 1000
        || (usesTimer && (timeSeconds < 15 || timeSeconds > 600))
        || textValues.slice(1, 3).some(value => value.length > 240)
        || textValues.slice(3).some(value => value.length > 300)) {
        alert("Check the game name, clear points, timer, and message lengths.");
        return;
      }

      try {
        await AppState.updateLevel(lvlId, {
          name: nameInput.value.trim(),
          icon: iconInput.value.trim() || "🛡️",
          clearReward,
          ...(usesTimer ? { defaultTime: gameTime } : {}),
          goal: goalInput.value.trim(),
          tip: tipInput.value.trim(),
          briefing: {
            threat: threatInput.value.trim(),
            defense: defenseInput.value.trim(),
            rule: ruleInput.value.trim()
          }
        });
        App.refreshLevels?.();
        Sound.good();
        if (window.CyberFX) CyberFX.toast("Game settings saved for players.", "success");
        modal.classList.add("hidden");
        render();
      } catch (error) {
        App.refreshLevels?.();
        if (window.CyberFX) CyberFX.toast(error.message || "The shared game settings could not be saved.", "warning");
      }
    });

    document.getElementById("btnRestoreDefaultLevels")?.addEventListener("click", async () => {
      if (confirm("Restore all mission parameters to original defaults?")) {
        try {
          await AppState.resetLevels();
          App.refreshLevels?.();
          Sound.good();
          if (window.CyberFX) CyberFX.toast("Game settings were reset for players.", "info");
          render();
        } catch (error) {
          App.refreshLevels?.();
          if (window.CyberFX) CyberFX.toast(error.message || "The shared game settings could not be reset.", "warning");
        }
      }
    });
  }

  // TAB 2: QUESTION MANAGEMENT (CRUD)
  function renderQuestionsTab(body) {
    const allQuestions = FirebaseBridge.getQuestions();
    body.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <h3>QUESTION BANK (CRUD)</h3>
          <button class="btn-primary-admin" id="btnOpenAddQuestion">+ Add New Question</button>
        </div>
        <p class="adm-desc">Built-in prompts work offline. New questions are shared with players when Firebase is connected.</p>

        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${allQuestions.map(q => {
                const options = Array.isArray(q?.options) ? q.options : [];
                const answerIndex = Number(q?.answer);
                const answer = Number.isInteger(answerIndex) ? options[answerIndex] : q?.answer;
                const canDelete = /^q_[A-Za-z0-9_-]{1,60}$/.test(String(q?.id || ""));
                return `
                <tr>
                  <td><span class="chip-lvl">Level ${escapeHtml(q?.levelId)}</span></td>
                  <td>${escapeHtml(q?.question || "")}</td>
                  <td class="correct-text">${escapeHtml(answer || "")}</td>
                  <td>
                    ${canDelete
                      ? `<button class="btn-action-del" data-id="${escapeHtml(q?.id)}">Remove shared question</button>`
                      : '<span class="adm-desc">Built-in</span>'}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>

        <!-- Add Question Form Modal -->
        <div class="admin-modal-overlay hidden" id="addQuestionModal">
          <div class="admin-modal-card">
            <h4>ADD ASSESSMENT QUESTION</h4>
            <div class="form-group">
              <label>Target Level:</label>
              <select id="newQLvl">
                ${Array.from({length: 8}, (_, i) => `<option value="${i+1}">Level ${i+1}: ${escapeHtml(AppState.getLevelById(i+1)?.name || "Game")}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Question Prompt:</label>
              <input type="text" id="newQText" maxlength="300" placeholder="Write a short safety question..." required>
            </div>
            <div class="form-group">
              <label>Options (4):</label>
              <input type="text" id="newOpt0" maxlength="180" placeholder="Choice A" required>
              <input type="text" id="newOpt1" maxlength="180" placeholder="Choice B" required>
              <input type="text" id="newOpt2" maxlength="180" placeholder="Choice C" required>
              <input type="text" id="newOpt3" maxlength="180" placeholder="Choice D" required>
            </div>
            <div class="form-group">
              <label>Correct Option Index (0 = A, 1 = B, 2 = C, 3 = D):</label>
              <select id="newQAns">
                <option value="0">Option A</option>
                <option value="1">Option B</option>
                <option value="2">Option C</option>
                <option value="3">Option D</option>
              </select>
            </div>
            <div class="modal-btns">
              <button class="btn-save-q" id="btnSaveNewQ">Save Question</button>
              <button class="btn-cancel-q" id="btnCancelNewQ">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Modal controls
    const modal = document.getElementById("addQuestionModal");
    document.getElementById("btnOpenAddQuestion")?.addEventListener("click", () => modal.classList.remove("hidden"));
    document.getElementById("btnCancelNewQ")?.addEventListener("click", () => modal.classList.add("hidden"));

    document.getElementById("btnSaveNewQ")?.addEventListener("click", async () => {
      const qText = document.getElementById("newQText").value.trim();
      const options = [0, 1, 2, 3].map(index => document.getElementById(`newOpt${index}`).value.trim());
      if (!qText || options.some(option => !option)) {
        alert("Please add a question and all four choices.");
        return;
      }

      try {
        await FirebaseBridge.addQuestion({
          levelId: document.getElementById("newQLvl").value,
          question: qText,
          options,
          answer: document.getElementById("newQAns").value,
          explanation: "Check the sender, pause, and ask a trusted adult if unsure."
        });
        Sound.good();
        modal.classList.add("hidden");
        render();
      } catch (error) {
        modal.classList.add("hidden");
        render();
        if (window.CyberFX) CyberFX.toast(error.message || "Could not save this question.", "warning");
      }
    });

    body.querySelectorAll(".btn-action-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (confirm("Remove this shared question for all players?")) {
          try {
            await FirebaseBridge.deleteQuestion(btn.dataset.id);
            Sound.bad();
            render();
          } catch (error) {
            render();
            if (window.CyberFX) CyberFX.toast(error.message || "Could not remove the shared question.", "warning");
          }
        }
      });
    });
  }

  // TAB 3: USER SCORES
  function renderScoresTab(body) {
    const agents = FirebaseBridge.getAllAgents();
    body.innerHTML = `
      <div class="adm-card">
        <h3>PLAYER RECORDS ON THIS DEVICE (${agents.length})</h3>
        <p class="adm-desc">Progress saved in this browser.</p>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Clearance Tier</th>
                <th>Score</th>
                <th>Levels Cleared</th>
                <th>Lives</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              ${agents.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">No agents registered yet.</td></tr>` : ''}
              ${agents.map(a => {
                const profile = a || {};
                const lives = Math.max(0, Math.min(10, Math.floor(Number(profile.lives) || 0)));
                const completed = Array.isArray(profile.completedLevels) ? Math.min(8, profile.completedLevels.length) : 0;
                const lastLogin = new Date(profile.lastLogin);
                const lastActive = Number.isNaN(lastLogin.getTime()) ? "Recent" : lastLogin.toLocaleTimeString();
                return `
                <tr>
                  <td><b>${escapeHtml(profile.avatar || '🥷')} ${escapeHtml(profile.agentName || "Cyber Explorer")}</b></td>
                  <td>${escapeHtml(profile.rankTitle || 'Cyber Explorer')}</td>
                  <td><span class="score-hl">${escapeHtml(Math.max(0, Math.floor(Number(profile.score) || 0)))}</span></td>
                  <td>${completed} / 8</td>
                  <td>${'❤️'.repeat(lives)}</td>
                  <td class="date-txt">${escapeHtml(lastActive)}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 4: GENERATE REPORTS
  function renderReportsTab(body) {
    const agents = FirebaseBridge.getAllAgents();
    body.innerHTML = `
      <div class="adm-card">
        <h3>LOCAL GAME REPORTS</h3>
        <p class="adm-desc">Download player and question data saved in this browser.</p>

        <div class="report-kpi-grid">
          <div class="kpi-card">
            <span class="val">${agents.length}</span>
            <span class="lbl">Players on this device</span>
          </div>
          <div class="kpi-card">
            <span class="val">${FirebaseBridge.getQuestions().length}</span>
            <span class="lbl">Active Quiz Items</span>
          </div>
          <div class="kpi-card">
            <span class="val">8</span>
            <span class="lbl">Games</span>
          </div>
          <div class="kpi-card">
            <span class="val">${FirebaseBridge.isLiveMode() ? 'Online' : 'Local'}</span>
            <span class="lbl">Account mode</span>
          </div>
        </div>

        <div class="report-actions-panel">
          <button class="btn-download-rep" id="btnExportCSV">📥 Download this device's player summary (CSV)</button>
          <button class="btn-download-rep" id="btnExportJSON">📥 Download this device's game data (JSON)</button>
        </div>
      </div>
    `;

    document.getElementById("btnExportCSV")?.addEventListener("click", () => {
      const csv = FirebaseBridge.exportCSVReport();
      downloadBlob(csv, "CyberShield_Report_" + Date.now() + ".csv", "text/csv");
      Sound.good();
    });

    document.getElementById("btnExportJSON")?.addEventListener("click", () => {
      const json = FirebaseBridge.exportJSONReport();
      downloadBlob(json, "CyberShield_Audit_" + Date.now() + ".json", "application/json");
      Sound.good();
    });
  }

  // TAB 5: RECENT ACTIVITY
  function renderActivityTab(body) {
    const storedLogs = FirebaseBridge.getActivityLogs();
    const logs = Array.isArray(storedLogs)
      ? storedLogs.filter(log => log && typeof log === "object").slice(0, 100)
      : [];
    body.innerHTML = `
      <div class="adm-card">
        <h3>RECENT ACTIVITY</h3>
        <p class="adm-desc">Events saved on this device.</p>
        <div class="log-stream-box">
          ${logs.length === 0 ? `<div style="color:#64748b; padding:10px;">No events logged yet.</div>` : ''}
          ${logs.map(l => {
            const timestamp = new Date(l.timestamp);
            const timeLabel = Number.isNaN(timestamp.getTime()) ? "—" : timestamp.toLocaleTimeString();
            return `
            <div class="log-item">
              <span class="log-time">${escapeHtml(timeLabel)}</span>
              <span class="log-action">[${escapeHtml(l.action)}]</span>
              <span class="log-agent">${escapeHtml(l.agentName)}:</span>
              <span class="log-detail">${escapeHtml(l.details)}</span>
            </div>
          `}).join('')}
        </div>
      </div>
    `;
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { init, render, checkAdminAuth };
})();
