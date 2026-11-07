// CyberQuest Level 7: Password Guessing Game (Social Password Defense)
const QuestLevel7Password = (function() {
  let container;
  let onComplete;
  let ended = false;

  const NAMES = [
    { name: "Rahul", avatar: "👦" }, { name: "Priya", avatar: "👧" }, { name: "Arjun", avatar: "🧑" },
    { name: "Sneha", avatar: "👩" }, { name: "Kiran", avatar: "👦🏽" }, { name: "Ananya", avatar: "👧🏽" },
    { name: "Vikram", avatar: "🧑🏻" }, { name: "Meera", avatar: "👩🏻" }, { name: "Rohit", avatar: "👨" },
    { name: "Divya", avatar: "👩🏽" }, { name: "Aditya", avatar: "🧑🏾" }, { name: "Kavya", avatar: "👧🏻" },
    { name: "Sanjay", avatar: "👨🏽" }, { name: "Nisha", avatar: "👩🏾" }, { name: "Amit", avatar: "🧔" },
    { name: "Pooja", avatar: "👱‍♀️" }
  ];

  const ANIMALS = [
    { name: "Cat", emoji: "🐱" }, { name: "Dog", emoji: "🐶" }, { name: "Rabbit", emoji: "🐰" },
    { name: "Tiger", emoji: "🐯" }, { name: "Panda", emoji: "🐼" }, { name: "Dolphin", emoji: "🐬" },
    { name: "Elephant", emoji: "🐘" }, { name: "Unicorn", emoji: "🦄" }, { name: "Parrot", emoji: "🦜" },
    { name: "Penguin", emoji: "🐧" }, { name: "Lion", emoji: "🦁" }
  ];

  const COLORS = [
    { name: "Blue", emoji: "💙" }, { name: "Red", emoji: "❤️" }, { name: "Green", emoji: "💚" },
    { name: "Purple", emoji: "💜" }, { name: "Pink", emoji: "💖" }, { name: "Yellow", emoji: "💛" },
    { name: "Orange", emoji: "🧡" }
  ];

  const HOBBIES = [
    "Cricket 🏏", "Football ⚽", "Drawing 🎨", "Music 🎵", "Reading 📚",
    "Dancing 💃", "Gaming 🎮", "Cooking 🍳", "Photography 📷", "Swimming 🏊", "Chess ♟️"
  ];

  const DECOY_EMOJIS = ["🏠", "🌟", "🔥", "⚡", "🎯", "💫", "🚀", "🎮", "✨", "🌈", "💎", "🎲"];
  const DECOY_NAMES = ["Aman", "Sara", "Ravi", "Zara", "Kabir", "Tanya", "Dev", "Isha", "Nikhil", "Riya", "Harsh", "Sana"];
  const DECOY_ANIMALS = ["Fox", "Wolf", "Bear", "Eagle", "Shark", "Horse", "Monkey", "Owl", "Frog", "Snake"];

  const TIPS = [
    "Never use your <strong>name</strong>, <strong>birthday</strong>, <strong>phone number</strong>, or <strong>favourite pet</strong> in passwords. Attackers can guess them from social media!",
    "A strong password uses a <strong>mix of uppercase, lowercase, numbers, and symbols</strong> — completely detached from your personal profile.",
    "Attackers use <strong>social engineering</strong> to harvest public details and build targeted password dictionaries.",
    "Your <strong>pet's name</strong> or <strong>birth year</strong> are among the most frequently cracked password patterns.",
    "Adding digits like <strong>Rahul123</strong> is not safe. Automated dictionary tools test these combinations instantly!"
  ];

  let currentRound = 1;
  const TOTAL_ROUNDS = 3;
  let score = 0;
  let streak = 0;
  let answered = false;
  let correctIndex = -1;
  let currentExplanation = '';
  let usedNames = [];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const b = [...arr];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  function finish(won) {
    if (ended) return;
    ended = true;
    if (won) {
      if (typeof Sound !== 'undefined' && Sound.levelComplete) Sound.levelComplete();
      if (typeof CyberFX !== 'undefined' && CyberFX.confetti) CyberFX.confetti();
    }
    onComplete?.({ levelId: 7, won, score: won ? score + 150 : score });
  }

  function generatePhone() {
    const prefixes = ["9876", "8765", "7890", "9988", "9012", "8899", "7654"];
    return pick(prefixes) + String(Math.floor(100000 + Math.random() * 900000));
  }

  function generateDOB() {
    const d = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');
    const m = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    const y = 2000 + Math.floor(Math.random() * 12);
    return { formatted: `${d}/${m}/${y}`, day: d, month: m, year: String(y) };
  }

  function generateEmail(name) {
    const domains = ["gmail.com", "yahoo.com", "outlook.com"];
    const suffix = Math.random() > 0.5 ? Math.floor(Math.random() * 99) : '';
    return `${name.toLowerCase()}${suffix}@${pick(domains)}`;
  }

  function generateProfile() {
    let p;
    do { p = pick(NAMES); } while (usedNames.includes(p.name) && usedNames.length < NAMES.length);
    usedNames.push(p.name);
    if (usedNames.length >= NAMES.length) usedNames = [];

    return {
      person: p,
      animal: pick(ANIMALS),
      color: pick(COLORS),
      hobby: pick(HOBBIES),
      phone: generatePhone(),
      dob: generateDOB(),
      email: generateEmail(p.name)
    };
  }

  function generatePasswords(prof) {
    const { person, animal, color, phone, dob } = prof;
    const patterns = [
      () => `${person.name}${animal.name}${pick(DECOY_EMOJIS)}`,
      () => `${person.name}${dob.year}${animal.emoji}`,
      () => `${person.name.toLowerCase()}${dob.day}${dob.month}`,
      () => `${phone.slice(0, 4)}${person.name}`,
      () => `${person.name}${phone.slice(-4)}`,
      () => `${animal.name}${person.name}${dob.year}`,
      () => `${person.name}@${dob.day}${dob.month}${dob.year.slice(-2)}`,
      () => `${color.name}${person.name}${dob.year}`,
      () => `${person.name}${animal.name}${dob.day}`,
      () => `${phone}${dob.day}${dob.month}`
    ];
    const explanations = [
      `It combines the person's <strong>name</strong> and <strong>favourite pet (${animal.name})</strong>!`,
      `It exposes their <strong>name</strong>, <strong>birth year (${dob.year})</strong>, and <strong>pet emoji</strong>!`,
      `It directly pairs their <strong>name</strong> with their <strong>birth day and month (${dob.day}/${dob.month})</strong>!`,
      `It connects their <strong>phone number digits</strong> and <strong>name</strong>!`,
      `It uses their <strong>name</strong> and the last 4 digits of their <strong>phone number</strong>!`,
      `It combines their <strong>favourite animal</strong>, <strong>name</strong>, and <strong>birth year</strong>!`,
      `It pairs their <strong>name</strong> with their <strong>birthday</strong>!`,
      `It uses their <strong>favourite colour</strong>, <strong>name</strong>, and <strong>birth year</strong>!`,
      `It merges their <strong>name</strong>, <strong>favourite animal</strong>, and <strong>birth day</strong>!`,
      `It combines their <strong>phone number</strong> and <strong>birthday</strong>!`
    ];

    const pIdx = Math.floor(Math.random() * patterns.length);
    const weakPassword = patterns[pIdx]();
    currentExplanation = explanations[pIdx];

    const decoys = [];
    const used = new Set();
    const decoyGens = [
      () => `${pick(DECOY_NAMES)}${pick(DECOY_ANIMALS)}${pick(DECOY_EMOJIS)}`,
      () => `${pick(DECOY_NAMES)}${pick(DECOY_ANIMALS)}${2000 + Math.floor(Math.random() * 12)}`,
      () => `${pick(DECOY_NAMES)}@${String(Math.floor(10 + Math.random() * 20))}${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}`,
      () => `${pick(DECOY_NAMES)}${Math.floor(1000 + Math.random() * 9000)}${pick(DECOY_EMOJIS)}`,
      () => `${pick(DECOY_ANIMALS)}${pick(DECOY_NAMES)}${Math.floor(100 + Math.random() * 900)}`
    ];

    while (decoys.length < 3) {
      const pw = pick(decoyGens)();
      if (!used.has(pw) && pw !== weakPassword) {
        used.add(pw);
        decoys.push(pw);
      }
    }

    const options = [
      { password: weakPassword, isCorrect: true },
      ...decoys.map(d => ({ password: d, isCorrect: false }))
    ];
    const shuffled = shuffle(options);
    correctIndex = shuffled.findIndex(o => o.isCorrect);
    return shuffled;
  }

  function renderProfile(prof) {
    const { person, animal, color, hobby, phone, dob, email } = prof;
    const av = container.querySelector('#qpAvatar');
    const nm = container.querySelector('#qpName');
    const rows = container.querySelector('#qpRows');

    if (av) av.textContent = person.avatar;
    if (nm) nm.textContent = person.name;

    if (rows) {
      rows.innerHTML = `
        <div class="quest-prow"><span class="p-ico">📱</span><div class="p-data"><div class="p-lbl">Phone Number</div><div class="p-val">${phone}</div></div></div>
        <div class="quest-prow"><span class="p-ico">📧</span><div class="p-data"><div class="p-lbl">Email Address</div><div class="p-val">${email}</div></div></div>
        <div class="quest-prow"><span class="p-ico">🎂</span><div class="p-data"><div class="p-lbl">Date of Birth</div><div class="p-val">${dob.formatted}</div></div></div>
        <div class="quest-prow"><span class="p-ico">${animal.emoji}</span><div class="p-data"><div class="p-lbl">Favourite Animal</div><div class="p-val">${animal.name} ${animal.emoji}</div></div></div>
        <div class="quest-prow"><span class="p-ico">${color.emoji}</span><div class="p-data"><div class="p-lbl">Favourite Colour</div><div class="p-val">${color.name} ${color.emoji}</div></div></div>
        <div class="quest-prow"><span class="p-ico">⭐</span><div class="p-data"><div class="p-lbl">Hobby</div><div class="p-val">${hobby}</div></div></div>
      `;
    }
  }

  function renderOptions(options) {
    const list = container.querySelector('#qpList');
    if (!list) return;
    list.innerHTML = '';

    options.forEach((opt, i) => {
      const tile = document.createElement('div');
      tile.className = 'quest-pw-tile';
      tile.innerHTML = `
        <div class="pw-letter">${String.fromCharCode(65 + i)}</div>
        <div class="pw-string">${opt.password}</div>
        <span class="pw-mark ck">✅</span>
        <span class="pw-mark cr">❌</span>
      `;
      tile.addEventListener('click', () => onChoiceClick(i, tile));
      list.appendChild(tile);
    });
  }

  function onChoiceClick(idx, tile) {
    if (answered || ended) return;
    const msg = container.querySelector('#qpMsg');
    const allTiles = container.querySelectorAll('.quest-pw-tile');

    if (idx === correctIndex) {
      answered = true;
      tile.classList.add('correct');
      allTiles.forEach(t => { if (t !== tile) t.classList.add('disabled'); });

      score += 40;
      streak++;
      updateStats();

      if (msg) {
        msg.className = 'quest-pw-msg show success';
        msg.innerHTML = `<span>🎉 Correct! +40 Points!</span><small>${currentExplanation}</small>`;
      }

      if (typeof Sound !== 'undefined' && Sound.select) Sound.select();
      if (typeof CyberFX !== 'undefined' && CyberFX.confetti) CyberFX.confetti();

      container.querySelectorAll('.quest-prow').forEach((row, i) => {
        setTimeout(() => row.classList.add('leak-pulse'), i * 140);
        setTimeout(() => row.classList.remove('leak-pulse'), 1500 + i * 140);
      });

      const nextBtn = container.querySelector('#qpNextBtn');
      if (nextBtn) {
        if (currentRound < TOTAL_ROUNDS) {
          nextBtn.textContent = 'Next Round ▶';
          nextBtn.classList.add('show');
        } else {
          nextBtn.textContent = 'Complete Mission 🏆';
          nextBtn.classList.add('show');
        }
      }
    } else {
      tile.classList.add('wrong');
      setTimeout(() => tile.classList.remove('wrong'), 500);
      streak = 0;
      updateStats();

      if (msg) {
        msg.className = 'quest-pw-msg show error';
        msg.innerHTML = `<span>❌ Incorrect! Look closely at the personal profile.</span><small>Hint: Compare the password with the person's name, animal, phone, or birth year.</small>`;
      }
      if (typeof Sound !== 'undefined' && Sound.error) Sound.error();
    }
  }

  function updateStats() {
    const sc = container.querySelector('#qpScore');
    const rd = container.querySelector('#qpRound');
    const strk = container.querySelector('#qpStreak');
    if (sc) sc.textContent = String(score);
    if (rd) rd.textContent = `${currentRound} / ${TOTAL_ROUNDS}`;
    if (strk) strk.textContent = `${streak} 🔥`;
  }

  function nextRound() {
    if (currentRound >= TOTAL_ROUNDS) {
      finish(true);
      return;
    }
    currentRound++;
    answered = false;

    const msg = container.querySelector('#qpMsg');
    const nextBtn = container.querySelector('#qpNextBtn');
    if (msg) msg.className = 'quest-pw-msg';
    if (nextBtn) nextBtn.classList.remove('show');

    startRound();
  }

  function startRound() {
    answered = false;
    const prof = generateProfile();
    const opts = generatePasswords(prof);
    renderProfile(prof);
    renderOptions(opts);
    updateStats();
  }

  function init(containerElement, completionCallback) {
    container = containerElement;
    onComplete = completionCallback;
    ended = false;
    currentRound = 1;
    score = 0;
    streak = 0;

    container.innerHTML = `
      <section class="game-stage quest-pwd-stage">
        <div class="quest-virus-header">
          <h3 style="color:#b026ff">🔓 LEVEL 7: PASSWORD GUESSING GAME</h3>
          <p>Identify which password is most vulnerable to being guessed using personal info!</p>
        </div>

        <div class="quest-pwd-stats">
          <div class="quest-p-stat scr"><span class="lbl">SCORE</span><span class="val" id="qpScore">0</span></div>
          <div class="quest-p-stat"><span class="lbl">ROUND</span><span class="val" id="qpRound">1 / 3</span></div>
          <div class="quest-p-stat str"><span class="lbl">STREAK</span><span class="val" id="qpStreak">0 🔥</span></div>
        </div>

        <div class="quest-pwd-layout">
          <div class="quest-profile-card">
            <div class="quest-prof-header">
              <span>🗂️</span><span>Fictional Target Profile</span>
            </div>
            <div class="quest-avatar-area">
              <div class="quest-avatar-bubble" id="qpAvatar">👤</div>
              <div class="quest-avatar-title" id="qpName">Loading...</div>
            </div>
            <div class="quest-profile-rows" id="qpRows"></div>
          </div>

          <div class="quest-pw-panel">
            <div class="quest-pw-prompt">
              <h4>🎯 Which password is easiest to guess?</h4>
              <p>Attackers guess passwords built from names, birthdays, phone numbers, and favorite pets.</p>
            </div>

            <div class="quest-pw-list" id="qpList"></div>

            <div class="quest-pw-msg-box">
              <div class="quest-pw-msg" id="qpMsg"></div>
            </div>

            <button class="quest-pw-next-btn" id="qpNextBtn">Next Round ▶</button>
          </div>
        </div>
      </section>
    `;

    container.querySelector('#qpNextBtn').addEventListener('click', nextRound);
    startRound();
  }

  function cleanup() {
    ended = true;
  }

  return { init, cleanup };
})();
