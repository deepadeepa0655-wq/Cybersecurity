// CyberQuest CyberPopup System - High-impact Cyber Security Modals & Interactive Quizzes
const CyberPopup = (function() {
  let activePopup = null;

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'cyber-popup-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && !overlay.dataset.modalLock) {
        close();
      }
    });
    return overlay;
  }

  function show({ title, subtitle, message, icon = '🛡️', type = 'info', buttons = [], customContent = null, onClose = null, autoClose = 0, lock = false }) {
    close(); // close existing popup if any

    const overlay = createOverlay();
    if (lock) overlay.dataset.modalLock = "true";

    const popup = document.createElement('div');
    popup.className = `cyber-popup-card cyber-popup-${type}`;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-label', title || 'Alert');

    // Close X button
    if (!lock) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'cyber-popup-close';
      closeBtn.setAttribute('aria-label', 'Close dialog');
      closeBtn.innerHTML = '✕';
      closeBtn.addEventListener('click', () => close());
      popup.appendChild(closeBtn);
    }

    // Icon Header
    if (icon) {
      const iconEl = document.createElement('div');
      iconEl.className = 'cyber-popup-icon';
      iconEl.textContent = icon;
      popup.appendChild(iconEl);
    }

    // Title & Subtitle
    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'cyber-popup-title';
      titleEl.textContent = title;
      popup.appendChild(titleEl);
    }

    if (subtitle) {
      const subEl = document.createElement('div');
      subEl.className = 'cyber-popup-subtitle';
      subEl.textContent = subtitle;
      popup.appendChild(subEl);
    }

    // Message Body
    if (message) {
      const msgEl = document.createElement('div');
      msgEl.className = 'cyber-popup-message';
      msgEl.textContent = message;
      popup.appendChild(msgEl);
    }

    // Custom Interactive Content
    if (customContent instanceof HTMLElement) {
      popup.appendChild(customContent);
    }

    // Action Buttons
    if (buttons && buttons.length > 0) {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'cyber-popup-buttons';

      buttons.forEach(btn => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `cyber-popup-btn ${btn.primary ? 'primary' : 'secondary'} ${btn.variant || ''}`;
        button.textContent = btn.label;
        button.addEventListener('click', () => {
          if (btn.onClick) {
            const shouldKeepOpen = btn.onClick();
            if (shouldKeepOpen === true) return;
          }
          if (btn.action === 'close' || !btn.preventClose) {
            close();
          }
        });
        btnContainer.appendChild(button);
      });

      popup.appendChild(btnContainer);
    }

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Animate In
    requestAnimationFrame(() => {
      overlay.classList.add('active');
      popup.classList.add('active');
    });

    if (window.Sound) {
      if (type === 'success') Sound.win();
      else if (type === 'error') Sound.bad();
      else Sound.click();
    }

    activePopup = { overlay, popup, onClose };

    if (autoClose > 0) {
      setTimeout(() => close(), autoClose);
    }

    popup.tabIndex = -1;
    popup.focus();

    const escHandler = (e) => {
      if (e.key === 'Escape' && !lock) {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return { close, element: popup };
  }

  function close() {
    if (!activePopup) return;
    const { overlay, popup, onClose } = activePopup;
    popup.classList.remove('active');
    popup.classList.add('closing');
    overlay.classList.remove('active');
    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 280);
    activePopup = null;
  }

  // Convenience Popups
  function success(title, message, onClose) {
    return show({ title, message, icon: '🛡️', type: 'success', onClose, buttons: [{ label: 'CONTINUE', action: 'close', primary: true }] });
  }

  function error(title, message, onClose) {
    return show({ title, message, icon: '⚠️', type: 'error', onClose, buttons: [{ label: 'DISMISS', action: 'close', primary: true }] });
  }

  function confirm(title, message, onConfirm, onCancel) {
    return show({
      title,
      message,
      icon: '❓',
      type: 'warning',
      buttons: [
        { label: 'Cancel', action: 'close', primary: false, onClick: onCancel },
        { label: 'Confirm', action: 'close', primary: true, onClick: onConfirm }
      ]
    });
  }

  function levelUnlock(levelName, levelNumber) {
    return show({
      title: '🔓 NEW MISSION UNLOCKED!',
      subtitle: `OPERATIONAL CLEARANCE: LEVEL ${levelNumber}`,
      message: `Outstanding work, Agent! "${levelName}" is now accessible in your tactical terminal.`,
      icon: '🎮',
      type: 'success',
      buttons: [
        { label: 'Later', action: 'close', primary: false },
        {
          label: '🚀 DEPLOY NOW',
          action: 'close',
          primary: true,
          onClick: () => {
            window.location.hash = `#/play/${levelNumber}`;
          }
        }
      ],
      autoClose: 10000
    });
  }

  function achievement(badgeTitle, badgeIcon) {
    return show({
      title: '🏆 BADGE ACQUIRED!',
      subtitle: 'CYBER SECURITY MERIT',
      message: `You earned the "${badgeTitle}" badge! Check your Badges tab to view your credentials.`,
      icon: badgeIcon || '🏆',
      type: 'success',
      buttons: [{ label: 'AWESOME!', action: 'close', primary: true }],
      autoClose: 6000
    });
  }

  const SAFETY_TIPS = [
    { title: '🔐 Password Fortification', tip: 'Use unique passphrases combining 4+ random words. Never share them with anyone, not even your best friends!' },
    { title: '✉️ Phishing Radar', tip: 'Urgent requests for passwords or money are almost always scams. Pause, verify the sender address, and ask an adult.' },
    { title: '🔗 Link Reconnaissance', tip: 'Hover over hyperlinks before clicking. Ensure the destination domain matches the official website exactly.' },
    { title: '🦠 Quarantine Suspicious Files', tip: 'Never open email attachments ending in .exe, .scr, or .bat from unknown senders. Always scan them first.' },
    { title: '🐙 Ransomware Defense', tip: 'Keep offline backups of your precious files (3-2-1 rule: 3 copies, 2 media types, 1 offline). Backups defeat ransomware!' },
    { title: '🕵️ Hardware Surveillance Alert', tip: 'Never insert found USB flash drives into any computer. Hand unknown storage media to your teacher or IT admin.' },
    { title: '🔑 Multi-Factor Shield', tip: 'Enable 2FA (Two-Factor Authentication) on every account you own. Even if someone steals your password, they cannot breach you!' },
    { title: '📱 Social Engineering Awareness', tip: 'Scammers pretend to be helpful support agents or game moderators. Legitimate staff will never ask for your one-time code (OTP).' }
  ];

  function safetyTip(customTip) {
    const item = customTip || SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
    return show({
      title: item.title,
      subtitle: 'TACTICAL CYBER PROTOCOL',
      message: item.tip,
      icon: '💡',
      type: 'info',
      buttons: [
        {
          label: '🎲 ANOTHER TIP',
          primary: false,
          preventClose: true,
          onClick: () => {
            safetyTip();
            return false;
          }
        },
        { label: 'GOT IT!', action: 'close', primary: true }
      ]
    });
  }

  // Interactive Randomized Cyber Quiz Popup
  function quizPopup(initialLevelId) {
    let currentLvl = initialLevelId || Math.floor(Math.random() * 8) + 1;
    let streak = 0;
    let score = 0;

    const quizBox = document.createElement('div');
    quizBox.className = 'cyber-quiz-popup-content';

    function renderQuestion() {
      quizBox.innerHTML = '';

      const bank = (window.App && window.App.getQuestionsForLevel) 
        ? window.App.getQuestionsForLevel(currentLvl)
        : null;

      // Fallback questions if app questions not loaded
      const defaultQuestions = [
        { question: "Which password is the strongest against brute-force attacks?", options: ["P@ssword1", "River-cloud-rocket-8!", "myname123", "123456789"], answer: 1, explanation: "Long passphrases composed of random words and characters take centuries to crack." },
        { question: "A message says your account is locked and demands your password. What is this?", options: ["Real security alert", "A Phishing attack", "A system update", "A friend prank"], answer: 1, explanation: "Real organizations never ask for your password via message or email." },
        { question: "What does the 'S' in HTTPS stand for?", options: ["Super", "Speed", "Secure (Encrypted)", "Server"], answer: 2, explanation: "HTTPS encrypts the connection between your browser and the website." },
        { question: "What is the 3-2-1 rule against ransomware?", options: ["3 passwords, 2 logins, 1 device", "3 copies, 2 different media, 1 offline backup", "3 scans, 2 reboots, 1 restart", "3 antivirus tools"], answer: 1, explanation: "Having an offline backup ensures ransomware cannot delete all copies of your data." }
      ];

      const pool = (bank && bank.length > 0) ? bank : defaultQuestions;
      const q = pool[Math.floor(Math.random() * pool.length)];

      // Randomize options order while tracking the correct answer
      const indexedOptions = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.answer }));
      for (let i = indexedOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
      }

      // Quiz HUD
      const topBar = document.createElement('div');
      topBar.className = 'quiz-popup-top-bar';
      topBar.innerHTML = `
        <span class="quiz-badge">MISSION L${currentLvl}</span>
        <span class="quiz-streak">🔥 STREAK: ${streak}</span>
        <span class="quiz-score">⭐ +${score} PTS</span>
      `;

      // Prompt
      const questionText = document.createElement('div');
      questionText.className = 'quiz-popup-question';
      questionText.textContent = q.question;

      // Options
      const optionsList = document.createElement('div');
      optionsList.className = 'quiz-popup-options';

      const feedback = document.createElement('div');
      feedback.className = 'quiz-popup-feedback hidden';

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'cyber-popup-btn primary quiz-next-btn hidden';
      nextBtn.textContent = 'NEXT QUESTION ➔';

      indexedOptions.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-opt-btn';
        btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + idx)}</span> <span class="opt-text">${opt.text}</span>`;
        
        btn.addEventListener('click', () => {
          optionsList.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
          if (opt.isCorrect) {
            btn.classList.add('correct');
            streak++;
            score += 50;
            if (window.AppState) window.AppState.addScore(50);
            if (window.Sound) Sound.good();
            if (window.CyberFX) CyberFX.toast('🎯 Spot on! +50 Points earned!', 'success');
            feedback.innerHTML = `<span class="feedback-icon">✅</span> <strong>EXCELLENT!</strong> ${q.explanation}`;
            feedback.className = 'quiz-popup-feedback success';
          } else {
            btn.classList.add('wrong');
            streak = 0;
            // Highlight the correct one
            optionsList.querySelectorAll('.quiz-opt-btn').forEach((b, bIdx) => {
              if (indexedOptions[bIdx].isCorrect) b.classList.add('correct');
            });
            if (window.Sound) Sound.bad();
            if (window.CyberFX) CyberFX.toast('Review the explanation to learn why!', 'warning');
            feedback.innerHTML = `<span class="feedback-icon">💡</span> <strong>GOOD ATTEMPT:</strong> ${q.explanation}`;
            feedback.className = 'quiz-popup-feedback warning';
          }
          feedback.classList.remove('hidden');
          nextBtn.classList.remove('hidden');
        });

        optionsList.appendChild(btn);
      });

      nextBtn.addEventListener('click', () => {
        currentLvl = (currentLvl % 8) + 1;
        renderQuestion();
      });

      quizBox.append(topBar, questionText, optionsList, feedback, nextBtn);
    }

    renderQuestion();

    return show({
      title: '⚡ CYBER INTELLIGENCE QUIZ',
      subtitle: 'RANDOMIZED FIELD DRILL',
      customContent: quizBox,
      icon: '🧠',
      type: 'info',
      buttons: [
        { label: 'RETURN TO HUB', action: 'close', primary: false }
      ]
    });
  }

  return {
    show,
    close,
    success,
    error,
    confirm,
    levelUnlock,
    achievement,
    safetyTip,
    quizPopup
  };
})();

window.CyberPopup = CyberPopup;
