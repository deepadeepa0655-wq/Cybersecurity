// Firebase Backend Integration (cybersecurity-1a)
// Supports Live Firebase (Auth, Firestore, Analytics) + Offline Local Simulator

const FirebaseBridge = (function() {
  // User's provided Firebase configuration
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDGs4BSTHOVQFCoiYtSM6G6dqVaDNyETKo",
    authDomain: "cybersecurity-1a.firebaseapp.com",
    projectId: "cybersecurity-1a",
    storageBucket: "cybersecurity-1a.firebasestorage.app",
    messagingSenderId: "73381291926",
    appId: "1:73381291926:web:71db5050946412b1bedfb7",
    measurementId: "G-DV8KFLMP16"
  };

  const STORAGE_USERS = 'cybershield_users';
  const STORAGE_CURRENT = 'cybershield_current_user';
  const STORAGE_LEADERBOARD = 'cybershield_leaderboard';
  const STORAGE_QUESTIONS = 'cybershield_admin_questions';
  const STORAGE_LOGS = 'cybershield_activity_logs';
  const STORAGE_LEVELS = 'cybershield_admin_levels';
  const STORAGE_BRANDING = 'cybershield_admin_branding';

  const DEFAULT_BRANDING = {
    appName: "CYBERQUEST",
    appSubtitle: "PLAY • LEARN • STAY SAFE",
    loginSubtitle: "PLAYER SIGN IN",
    loginMotto: "Learn • Pause • Stay safe",
    logoType: "emoji", // "emoji" or "image"
    logoIcon: "🛡️",
    logoImageUrl: "",
    announcementEnabled: true,
    announcementMessage: "🧠 SAFETY TIP: Pause and check before you click.",
    welcomeTitle: "WELCOME, CYBER EXPLORER!",
    welcomeMessage: "Pick a game, follow the clues, and learn one safe step at a time.",
    certificateOrgName: "CYBERQUEST SAFETY QUEST",
    certificateSubtitle: "ONLINE SAFETY GAME AWARD",
    defaultLives: 3,
    missionVictoryMessage: "Nice work, Cyber Explorer!"
  };
  const VALID_AVATARS = ["🥷", "🦊", "⚡", "🛡️", "👁️", "🚀", "👾"];

  let isLive = false;
  let db = null;
  let auth = null;
  let localMigrationPromise = Promise.resolve();
  let remoteBranding = null;
  let remoteLevels = null;
  let remoteQuestions = null;
  let sharedConfigUnsubscribers = [];

  // Built-in practice questions for the eight CyberQuest games
  const DEFAULT_QUESTIONS = [
    { id: "q1_1", levelId: 1, question: "Which password is hardest to guess?", options: ["Sunny7!", "P@ssword", "River-cloud-rocket-8!", "name123"], answer: 2, explanation: "Long, unique passphrases are harder to guess." },
    { id: "q2_1", levelId: 2, question: "A message offers free gems if you share your password. What should you do?", options: ["Keep it private and check with an adult", "Reply with your password", "Forward it to friends", "Tap the link quickly"], answer: 0, explanation: "Real helpers never need your password." },
    { id: "q3_1", levelId: 3, question: "What is the safest way to open a game you trust?", options: ["Tap a surprise link in chat", "Use the app or site you already know", "Pick the shortest link", "Click a pop-up prize"], answer: 1, explanation: "Use a familiar app or ask an adult to help check the website." },
    { id: "q4_1", levelId: 4, question: "A stranger sends a file called FREE-SKIN.exe. What is safest?", options: ["Open it", "Send it to a friend", "Leave it closed and ask an adult", "Rename it and run it"], answer: 2, explanation: "Unexpected files can be unsafe. Ask an adult before opening them." },
    { id: "q5_1", levelId: 5, question: "A screen says your files are locked and asks for money. What should you do?", options: ["Pay right away", "Ask a trusted adult for help", "Enter your password", "Download a tool from the message"], answer: 1, explanation: "Do not pay or follow the message. Get help from a trusted adult." },
    { id: "q6_1", levelId: 6, question: "You find a device you do not recognize. What is a safe next step?", options: ["Take it apart", "Plug it into your computer", "Leave it alone and tell an adult", "Try every button"], answer: 2, explanation: "Leave unfamiliar devices alone and ask a trusted adult." },
    { id: "q7_1", levelId: 7, question: "Which password choice avoids personal details?", options: ["Your name and birthday", "Your pet's name", "A long, unique passphrase", "Your phone number"], answer: 2, explanation: "Do not use names, birthdays, or phone numbers in passwords." },
    { id: "q8_1", levelId: 8, question: "A caller asks for the sign-in code sent to your phone. What should you do?", options: ["Read it to them", "Send a screenshot", "Keep it secret and tell an adult", "Post it in chat"], answer: 2, explanation: "Keep sign-in codes private. A trusted adult can help check the caller." }
  ];

  function normalizeBranding(source) {
    const value = source && typeof source === "object" && !Array.isArray(source) ? source : {};
    const result = { ...DEFAULT_BRANDING };
    for (const [key, fallback] of Object.entries(DEFAULT_BRANDING)) {
      const candidate = value[key];
      if (typeof fallback === "boolean" && typeof candidate === "boolean") result[key] = candidate;
      else if (typeof fallback === "string" && typeof candidate === "string") result[key] = candidate.slice(0, key === "logoImageUrl" ? 500 : 240);
    }
    if ([3, 4, 5].includes(Number(value.defaultLives))) result.defaultLives = Number(value.defaultLives);
    if (value.logoType === "image" || value.logoType === "emoji") result.logoType = value.logoType;
    return result;
  }

  function normalizeQuestion(data, documentId) {
    const id = String(documentId || "");
    const levelId = Number(data?.levelId);
    const answer = Number(data?.answer);
    const options = Array.isArray(data?.options) ? data.options : [];
    if (!/^q_[A-Za-z0-9_-]{1,60}$/.test(id)
      || !Number.isInteger(levelId) || levelId < 1 || levelId > 8
      || typeof data.question !== "string" || !data.question.trim()
      || options.length !== 4 || options.some(option => typeof option !== "string")
      || !Number.isInteger(answer) || answer < 0 || answer > 3) return null;
    return {
      id,
      levelId,
      question: data.question.slice(0, 300),
      options: options.map(option => option.slice(0, 180)),
      answer,
      explanation: String(data.explanation || "").slice(0, 400)
    };
  }

  function normalizeLevel(source, fallback) {
    const value = source && typeof source === "object" ? source : {};
    const result = { ...fallback, id: fallback.id };
    for (const key of ["name", "codename", "icon", "goal", "tip"]) {
      if (typeof value[key] === "string") result[key] = value[key].slice(0, 240);
    }
    if (["blue", "amber", "purple", "green", "crimson"].includes(value.theme)) result.theme = value.theme;
    if (typeof value.accent === "string" && /^#[0-9a-f]{6}$/i.test(value.accent)) result.accent = value.accent;
    const clearReward = Number(value.clearReward ?? value.targetScore);
    if (Number.isInteger(clearReward) && clearReward >= 1 && clearReward <= 1000) result.clearReward = clearReward;
    if (typeof value.defaultTime === "string") {
      const match = /^(\d{2}):([0-5]\d)$/.exec(value.defaultTime);
      const seconds = match ? Number(match[1]) * 60 + Number(match[2]) : 0;
      if (seconds >= 15 && seconds <= 600) result.defaultTime = value.defaultTime;
    }
    if (value.isActive === false || value.isActive === true) result.isActive = value.isActive;
    if (value.briefing && typeof value.briefing === "object") {
      result.briefing = { ...fallback.briefing };
      for (const key of ["threat", "defense", "rule"]) {
        if (typeof value.briefing[key] === "string") result.briefing[key] = value.briefing[key].slice(0, 300);
      }
    }
    return result;
  }

  function refreshSharedViews(kind) {
    if (kind === "branding") window.App?.refreshBranding?.();
    if (kind === "levels") {
      window.AppState?.reloadLevels?.();
      window.App?.refreshLevels?.();
    }
  }

  function startSharedConfigListeners() {
    sharedConfigUnsubscribers.forEach(stop => stop());
    sharedConfigUnsubscribers = [];
    remoteBranding = null;
    remoteLevels = null;
    remoteQuestions = null;
    if (!isLive || !db) return;

    const brandingStop = db.collection("system_config").doc("branding").onSnapshot(snapshot => {
      remoteBranding = snapshot.exists ? normalizeBranding(snapshot.data()) : null;
      if (remoteBranding) saveLocal(STORAGE_BRANDING, remoteBranding);
      refreshSharedViews("branding");
    }, () => {
      remoteBranding = null;
      console.warn("Shared site branding is unavailable; using this device's saved settings.");
    });

    const questionsStop = db.collection("questions")
      .orderBy("levelId", "asc")
      .limit(100)
      .onSnapshot(snapshot => {
        remoteQuestions = snapshot.docs.map(doc => normalizeQuestion(doc.data(), doc.id)).filter(Boolean);
      }, () => {
        remoteQuestions = null;
        console.warn("Shared questions are unavailable; using this device's saved questions.");
      });

    const levelsStop = db.collection("levels")
      .where("id", "<=", 8)
      .orderBy("id", "asc")
      .limit(8)
      .onSnapshot(snapshot => {
        remoteLevels = snapshot.docs.map(doc => doc.data()).filter(level => {
          const id = Number(level?.id);
          return Number.isInteger(id) && id >= 1 && id <= 8;
        });
        refreshSharedViews("levels");
      }, () => {
        remoteLevels = null;
        console.warn("Shared game settings are unavailable; using this device's saved settings.");
      });

    sharedConfigUnsubscribers.push(brandingStop, questionsStop, levelsStop);
  }

  function getLocal(key, fallback) {
    try {
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function createLeaderboardId() {
    if (!window.crypto?.getRandomValues) throw new Error("Secure player storage is unavailable in this browser.");
    return Array.from(window.crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function safeUser(user) {
    if (!user || typeof user !== "object") return user;
    const copy = { ...user };
    delete copy.password;
    delete copy.passwordSalt;
    delete copy.passwordHash;
    delete copy.isAdmin;
    return copy;
  }

  function toBase64(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }

  async function hashLocalPassword(password, saltBytes) {
    if (!window.crypto?.subtle) throw new Error("Secure sign-in needs a modern browser on HTTPS or localhost.");
    const salt = saltBytes || window.crypto.getRandomValues(new Uint8Array(16));
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, key, 256);
    return { salt: toBase64(salt), hash: toBase64(bits) };
  }

  async function verifyLocalPassword(password, user) {
    if (!user.passwordSalt || !user.passwordHash) return false;
    const rawSalt = atob(user.passwordSalt);
    const salt = Uint8Array.from(rawSalt, char => char.charCodeAt(0));
    const derived = await hashLocalPassword(password, salt);
    if (derived.hash.length !== user.passwordHash.length) return false;
    let difference = 0;
    for (let index = 0; index < derived.hash.length; index++) {
      difference |= derived.hash.charCodeAt(index) ^ user.passwordHash.charCodeAt(index);
    }
    return difference === 0;
  }

  async function migrateLegacyLocalPasswords() {
    if (!window.crypto?.subtle) return;
    const users = getLocal(STORAGE_USERS, {});
    let changed = false;
    for (const user of Object.values(users)) {
      if (!user || typeof user.password !== "string") continue;
      const verifier = await hashLocalPassword(user.password);
      user.passwordSalt = verifier.salt;
      user.passwordHash = verifier.hash;
      delete user.password;
      delete user.isAdmin;
      changed = true;
    }
    if (changed) saveLocal(STORAGE_USERS, users);

    const current = getLocal(STORAGE_CURRENT, null);
    if (current && (current.password || current.passwordHash || current.passwordSalt || current.isAdmin)) {
      saveLocal(STORAGE_CURRENT, safeUser(current));
    }
  }

  function mapPublicScores(snapshot) {
    return snapshot.docs.map((doc, index) => {
      const data = doc.data() || {};
      return {
        rank: index + 1,
        agentName: String(data.agentName || "Cyber Explorer").slice(0, 20),
        score: Math.max(0, Math.floor(Number(data.score) || 0)),
        level: Math.max(1, Math.min(9, Math.floor(Number(data.level) || 1))),
        avatar: String(data.avatar || "🦊").slice(0, 8),
        completed: Math.max(0, Math.min(8, Math.floor(Number(data.completed) || 0)))
      };
    });
  }

  async function syncPublicScore(uid) {
    if (!isLive || !db || !uid) return;
    const profileRef = db.collection("agents").doc(uid);
    await db.runTransaction(async transaction => {
      const profileSnapshot = await transaction.get(profileRef);
      if (!profileSnapshot.exists) return;
      const profile = profileSnapshot.data() || {};
      const leaderboardId = String(profile.leaderboardId || "");
      if (!/^[a-f0-9]{48}$/.test(leaderboardId)) return;
      const scoreRef = db.collection("public_scores").doc(leaderboardId);
      const avatar = VALID_AVATARS.includes(profile.avatar) ? profile.avatar : "🦊";
      transaction.set(scoreRef, {
        agentName: String(profile.agentName || "Cyber Explorer").slice(0, 20),
        score: Math.max(0, Math.min(100000, Math.floor(Number(profile.score) || 0))),
        level: Math.max(1, Math.min(9, Math.floor(Number(profile.unlockedLevel) || 1))),
        completed: Math.max(0, Math.min(8, Array.isArray(profile.completedLevels) ? profile.completedLevels.length : 0)),
        avatar,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
  }

  // Activity logger
  function logActivity(action, agentName = "System", details = "") {
    const entry = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random()*1000),
      timestamp: new Date().toISOString(),
      action: action,
      agentName: agentName,
      details: details
    };
    const logs = getLocal(STORAGE_LOGS, []);
    logs.unshift(entry);
    saveLocal(STORAGE_LOGS, logs.slice(0, 100));

    return entry;
  }

  // Initialize live Firebase
  function initLiveFirebase() {
    try {
      if (window.firebase && window.firebase.initializeApp) {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.firestore ? firebase.firestore() : null;
        auth = firebase.auth ? firebase.auth() : null;
        isLive = !!(db && auth);
        console.log("Cyber Shield: Live Firebase initialized on project:", FIREBASE_CONFIG.projectId);
        logActivity("SYSTEM_INIT", "Platform", "Connected to Firebase project: " + FIREBASE_CONFIG.projectId);
        return true;
      }
    } catch (e) {
      console.warn("Cyber Shield: Firebase fallback mode active:", e);
    }
    logActivity("SYSTEM_INIT", "Platform", "Running with Local Storage Engine");
    return false;
  }

  return {
    init: function() {
      initLiveFirebase();
      startSharedConfigListeners();
      localMigrationPromise = migrateLegacyLocalPasswords().catch(() => {});
      const savedQuestions = getLocal(STORAGE_QUESTIONS, null);
      const legacyDefaults = Array.isArray(savedQuestions)
        && savedQuestions.length === 10
        && savedQuestions.every((question, index) => question?.id === `q${index + 1}_1`);
      if (!Array.isArray(savedQuestions) || legacyDefaults) {
        saveLocal(STORAGE_QUESTIONS, DEFAULT_QUESTIONS);
      } else {
        const currentQuestions = savedQuestions.filter(question => Number(question?.levelId) >= 1 && Number(question?.levelId) <= 8);
        if (currentQuestions.length !== savedQuestions.length) saveLocal(STORAGE_QUESTIONS, currentQuestions);
      }
    },

    isLiveMode: () => isLive,
    getConfig: () => FIREBASE_CONFIG,

    startGuest: function(agentName) {
      const clean = String(agentName || "Cyber Explorer").trim();
      if (!/^[a-zA-Z0-9 _-]{2,18}$/.test(clean)) {
        throw new Error("Use 2–18 letters, numbers, spaces, _ or - for your game name.");
      }
      const guest = {
        agentName: clean,
        avatar: "🦊",
        score: 0,
        lives: 3,
        unlockedLevel: 1,
        completedLevels: [],
        achievements: [],
        registeredAt: new Date().toISOString(),
        rankTitle: "Cyber Explorer",
        isGuest: true
      };
      saveLocal(STORAGE_CURRENT, guest);
      logActivity("GUEST_START", clean, "Started a local CyberQuest game");
      return guest;
    },

    // Authentication
    register: async function(agentName, password, avatar = "🥷") {
      const clean = String(agentName || "").trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) throw new Error("Use 3–20 letters, numbers, or _ for your game name.");
      if (!password || password.length < 8 || password.length > 128) throw new Error("Choose a passphrase between 8 and 128 characters.");

      const branding = this.getBrandingConfig();
      const newUser = {
        agentName: clean,
        avatar: VALID_AVATARS.includes(avatar) ? avatar : "🥷",
        leaderboardId: createLeaderboardId(),
        score: 0,
        lives: (branding && branding.defaultLives !== undefined) ? branding.defaultLives : 3,
        unlockedLevel: 1,
        completedLevels: [],
        achievements: [],
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        rankTitle: "Cyber Explorer"
      };

      let liveSuccess = false;
      if (isLive && auth && db) {
        try {
          const fakeEmail = `${clean.toLowerCase()}@cybershield.agency`;
          const cred = await auth.createUserWithEmailAndPassword(fakeEmail, password);
          newUser.uid = cred.user.uid;
          try {
            await db.collection("agents").doc(cred.user.uid).set(newUser);
            liveSuccess = true;
          } catch {
            await cred.user.delete().catch(() => {});
            throw new Error("Could not save your player profile. Please try again.");
          }
        } catch (error) {
          if (error?.code === "auth/email-already-in-use" || error?.code === "auth/weak-password") {
            throw error;
          }
          console.warn("Live Firebase register failed, falling back to secure local storage:", error);
        }
      }

      if (!liveSuccess) {
        await localMigrationPromise;
        const users = getLocal(STORAGE_USERS, {});
        if (users[clean.toLowerCase()]) throw new Error("That game name is already used on this device.");
        const verifier = await hashLocalPassword(password);
        users[clean.toLowerCase()] = { ...newUser, passwordSalt: verifier.salt, passwordHash: verifier.hash };
        saveLocal(STORAGE_USERS, users);
      }

      const safeProfile = safeUser(newUser);
      const users = getLocal(STORAGE_USERS, {});
      if (!liveSuccess) users[clean.toLowerCase()] = { ...users[clean.toLowerCase()], ...newUser };
      else users[clean.toLowerCase()] = safeProfile;
      saveLocal(STORAGE_USERS, users);
      saveLocal(STORAGE_CURRENT, safeProfile);

      this.updateLeaderboardEntry(safeProfile);
      if (liveSuccess && newUser.uid) {
        try { await syncPublicScore(newUser.uid); } catch { console.warn("Live scores could not be updated."); }
      }
      logActivity("AGENT_REGISTER", clean, "New cyber recruit joined the grid");
      return safeProfile;
    },

    login: async function(agentName, password) {
      const clean = String(agentName || "").trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean) || !password || password.length > 128) throw new Error("Enter your game name and passphrase.");

      if (isLive && auth && db) {
        const fakeEmail = `${clean.toLowerCase()}@cybershield.agency`;
        let credential = null;
        try {
          credential = await auth.signInWithEmailAndPassword(fakeEmail, password);
        } catch (error) {
          console.warn("Live Firebase sign-in failed, checking local storage:", error?.code || error);
        }
        if (credential) {
          const profileRef = db.collection("agents").doc(credential.user.uid);
          let profileSnapshot;
          try {
            profileSnapshot = await profileRef.get();
          } catch {
            await auth.signOut().catch(() => {});
            throw new Error("Could not load your player profile. Please try again.");
          }
          const user = profileSnapshot.exists ? safeUser(profileSnapshot.data()) : {
            agentName: clean, avatar: "🦊", score: 0, lives: 3, unlockedLevel: 1,
            completedLevels: [], achievements: [], rankTitle: "Cyber Explorer", registeredAt: new Date().toISOString()
          };
          const legacyUnlockedLevel = Number(user.unlockedLevel);
          const legacyCompletedCount = Array.isArray(user.completedLevels) ? user.completedLevels.length : 0;
          user.avatar = VALID_AVATARS.includes(user.avatar) ? user.avatar : "🦊";
          if (!/^[a-f0-9]{48}$/.test(String(user.leaderboardId || ""))) user.leaderboardId = createLeaderboardId();
          user.score = Math.max(0, Math.min(100000, Math.floor(Number(user.score) || 0)));
          user.rankTitle = user.score >= 1800 ? "Cyber Hero"
            : user.score >= 1000 ? "Safety Star"
            : user.score >= 400 ? "Quest Explorer"
            : "Cyber Explorer";
          const currentLives = Number(user.lives);
          user.lives = Number.isFinite(currentLives)
            ? Math.max(0, Math.min(10, Math.floor(currentLives)))
            : 3;
          user.unlockedLevel = Math.max(1, Math.min(9, Math.floor(Number(user.unlockedLevel) || 1)));
          user.completedLevels = Array.isArray(user.completedLevels)
            ? [...new Set(user.completedLevels.filter(level => Number.isInteger(level) && level >= 1 && level <= 8))]
            : [];
          if (legacyUnlockedLevel > 9 || legacyCompletedCount > 8) user.unlockedLevel = 9;
          user.achievements = Array.isArray(user.achievements)
            ? [...new Set(user.achievements.filter(id => /^b[1-8]$/.test(id)))]
            : [];
          user.uid = credential.user.uid;
          user.lastLogin = new Date().toISOString();
          try {
            const patch = { ...user };
            const oldProfile = profileSnapshot.exists ? profileSnapshot.data() : {};
            if (oldProfile.password !== undefined) patch.password = firebase.firestore.FieldValue.delete();
            if (oldProfile.isAdmin !== undefined) patch.isAdmin = firebase.firestore.FieldValue.delete();
            await profileRef.set(patch, { merge: true });
          } catch {
            await auth.signOut().catch(() => {});
            throw new Error("Could not update your player profile. Please try again.");
          }
          const users = getLocal(STORAGE_USERS, {});
          users[clean.toLowerCase()] = user;
          saveLocal(STORAGE_USERS, users);
          saveLocal(STORAGE_CURRENT, user);
          this.updateLeaderboardEntry(user);
          try { await syncPublicScore(user.uid); } catch { console.warn("Live scores could not be updated."); }
          logActivity("AGENT_LOGIN", clean, "Player signed in");
          return safeUser(user);
        }
      }

      await localMigrationPromise;
      const users = getLocal(STORAGE_USERS, {});
      const user = users[clean.toLowerCase()];
      if (!user || !(await verifyLocalPassword(password, user))) {
        throw new Error("We could not sign you in. Check the game name and passphrase.");
      }
      user.lastLogin = new Date().toISOString();
      users[clean.toLowerCase()] = user;
      saveLocal(STORAGE_USERS, users);
      const safeProfile = safeUser(user);
      saveLocal(STORAGE_CURRENT, safeProfile);
      this.updateLeaderboardEntry(safeProfile);
      logActivity("AGENT_LOGIN", clean, "Player signed in");
      return safeProfile;
    },

    getCurrentUser: () => safeUser(getLocal(STORAGE_CURRENT, null)),

    logout: function() {
      const u = this.getCurrentUser();
      if (u) logActivity("AGENT_LOGOUT", u.agentName, "Agent signed out");
      localStorage.removeItem(STORAGE_CURRENT);
      if (isLive && auth) auth.signOut().catch(() => {});
    },

    // Administrators need a Firebase account that is explicitly listed in
    // the read-only admins collection. There is no built-in shared password.
    adminLogin: async function(email, password) {
      if (!isLive || !auth || !db) throw new Error("Administrator sign-in is not configured.");
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !password || password.length > 128) {
        throw new Error("Enter a valid administrator email and password.");
      }

      let credential;
      try {
        credential = await auth.signInWithEmailAndPassword(cleanEmail, password);
        const snapshot = await db.collection("admins").doc(credential.user.uid).get();
        if (!snapshot.exists || snapshot.data()?.role !== "admin") {
          await auth.signOut().catch(() => {});
          throw new Error("This account is not set up as an administrator.");
        }
      } catch (error) {
        if (error.message === "This account is not set up as an administrator.") throw error;
        const safeError = new Error("We could not verify this administrator account.");
        safeError.code = error?.code || "";
        throw safeError;
      }

      const adminData = {
        uid: credential.user.uid,
        email: credential.user.email || cleanEmail,
        role: "admin",
        loginTime: new Date().toISOString()
      };
      saveLocal("cybershield_admin_session", adminData);
      logActivity("ADMIN_AUTH_SUCCESS", adminData.email, "Administrator signed in");
      return adminData;
    },

    getAdminSession: function() {
      const session = getLocal("cybershield_admin_session", null);
      if (!isLive || !session?.uid || auth?.currentUser?.uid !== session.uid) return null;
      return session;
    },

    adminLogout: function() {
      const sess = this.getAdminSession();
      if (sess) logActivity("ADMIN_LOGOUT", sess.email, "Administrator signed out of #/admin");
      localStorage.removeItem("cybershield_admin_session");
      if (isLive && auth) auth.signOut().catch(() => {});
    },

    saveUserProgress: async function(userData, options = {}) {
      if (!userData || !userData.agentName) {
        return { cloudSaved: false, leaderboardSynced: false, localOnly: true };
      }
      if (userData.isGuest) {
        saveLocal(STORAGE_CURRENT, userData);
        this.updateLeaderboardEntry(userData);
        return { cloudSaved: false, leaderboardSynced: false, localOnly: true };
      }
      const key = userData.agentName.toLowerCase();
      const users = getLocal(STORAGE_USERS, {});
      const profile = { ...users[key], ...safeUser(userData) };
      let cloudSaved = false;
      let leaderboardSynced = false;
      if (isLive && db && userData.uid) {
        try {
          await db.collection("agents").doc(userData.uid).update(safeUser(userData));
          cloudSaved = true;
        } catch {
          if (options.requireRemote) {
            throw new Error("Your level clear could not be saved online. Check your connection and try again.");
          }
          console.warn("Player progress could not be synced; it is saved on this device.");
        }
        if (cloudSaved && options.syncLeaderboard !== false) {
          try {
            await syncPublicScore(userData.uid);
            leaderboardSynced = true;
          } catch {
            console.warn("Progress was saved, but the live Ranks board could not be refreshed yet.");
          }
        }
      }

      users[key] = profile;
      saveLocal(STORAGE_USERS, users);
      saveLocal(STORAGE_CURRENT, safeUser(profile));
      this.updateLeaderboardEntry(safeUser(users[key]));
      return {
        cloudSaved,
        leaderboardSynced,
        localOnly: !cloudSaved
      };
    },

    getAllAgents: function() {
      const users = getLocal(STORAGE_USERS, {});
      return Object.values(users).map(safeUser);
    },

    updateLeaderboardEntry: function(user) {
      let board = getLocal(STORAGE_LEADERBOARD, []);
      const idx = board.findIndex(b => b.agentName.toLowerCase() === user.agentName.toLowerCase());
      const entry = {
        agentName: user.agentName,
        score: user.score || 0,
        level: user.unlockedLevel || 1,
        avatar: user.avatar || "🥷",
        badge: user.rankTitle || "Cyber Recruit",
        completed: user.completedLevels ? user.completedLevels.length : 0
      };

      if (idx >= 0) board[idx] = entry;
      else board.push(entry);

      board.sort((a, b) => b.score - a.score);
      board = board.slice(0, 15).map((item, i) => ({ ...item, rank: i + 1 }));
      saveLocal(STORAGE_LEADERBOARD, board);
    },

    getLeaderboard: async function() {
      if (isLive && db && auth?.currentUser?.uid) {
        try {
          const snapshot = await db.collection("public_scores")
            .orderBy("score", "desc")
            .limit(15)
            .get();
          return mapPublicScores(snapshot);
        } catch (error) {
          console.warn("Live scores could not be loaded.");
        }
      }
      return getLocal(STORAGE_LEADERBOARD, []).slice(0, 15).map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    },

    watchLeaderboard: function(onChange) {
      if (!isLive || !db || !auth || typeof onChange !== "function") return null;
      let disposed = false;
      let stopScores = null;
      const stopAuth = auth.onAuthStateChanged(user => {
        if (disposed) return;
        if (!user) {
          if (stopScores) {
            stopScores();
            stopScores = null;
          }
          onChange(null, new Error("Sign in to see live scores."));
          return;
        }
        if (stopScores) stopScores();
        stopScores = db.collection("public_scores")
          .orderBy("score", "desc")
          .limit(15)
          .onSnapshot(snapshot => onChange(mapPublicScores(snapshot), null), error => onChange(null, error));
      }, error => onChange(null, error));

      return () => {
        disposed = true;
        if (stopScores) stopScores();
        stopAuth();
      };
    },

    // Question Management (built-in practice plus shared admin questions)
    getQuestions: function(levelId) {
      const saved = getLocal(STORAGE_QUESTIONS, DEFAULT_QUESTIONS);
      const localList = Array.isArray(saved) ? saved : DEFAULT_QUESTIONS;
      const defaultIds = new Set(DEFAULT_QUESTIONS.map(question => question.id));
      const customQuestions = remoteQuestions === null
        ? localList.filter(question => !defaultIds.has(question?.id))
        : remoteQuestions;
      const byId = new Map(DEFAULT_QUESTIONS.map(question => [question.id, question]));
      customQuestions.forEach(question => {
        if (question && typeof question.id === "string") byId.set(question.id, question);
      });
      const list = [...byId.values()];
      return levelId ? list.filter(question => Number(question?.levelId) === Number(levelId)) : list;
    },

    addQuestion: async function(q) {
      const levelId = Number(q?.levelId);
      const answer = Number(q?.answer);
      const options = Array.isArray(q?.options) ? q.options : [];
      if (!Number.isInteger(levelId) || levelId < 1 || levelId > 8
        || typeof q?.question !== "string" || !q.question.trim() || q.question.length > 300
        || options.length !== 4 || options.some(option => typeof option !== "string" || !option.trim() || option.length > 180)
        || !Number.isInteger(answer) || answer < 0 || answer > 3) {
        throw new Error("Add a question, four choices, and one correct answer.");
      }
      const list = this.getQuestions();
      if (list.length >= 100) throw new Error("The shared question list is full.");
      const newQ = {
        id: "q_" + createLeaderboardId(),
        levelId,
        question: q.question.trim(),
        options: options.map(option => option.trim()),
        answer,
        explanation: String(q.explanation || "Great job checking carefully.").slice(0, 400)
      };
      list.push(newQ);
      saveLocal(STORAGE_QUESTIONS, list);
      if (remoteQuestions !== null) remoteQuestions = [...remoteQuestions, newQ];
      logActivity("ADMIN_ADD_QUESTION", "Admin", `Added question to Level ${newQ.levelId}`);
      if (isLive && db) {
        try { await db.collection("questions").doc(newQ.id).set(newQ); }
        catch { remoteQuestions = null; throw new Error("Saved on this device, but could not share the new question online."); }
      }
      return newQ;
    },

    updateQuestion: async function(id, q) {
      const cleanId = String(id || "");
      if (!/^q_[A-Za-z0-9_-]{1,60}$/.test(cleanId)) return null;
      const list = this.getQuestions();
      const idx = list.findIndex(item => item.id === cleanId);
      if (idx < 0 || DEFAULT_QUESTIONS.some(question => question.id === cleanId)) return null;
      const updated = {
        ...list[idx],
        levelId: Number(q.levelId),
        question: String(q.question || "").trim().slice(0, 300),
        options: Array.isArray(q.options) ? q.options.map(option => String(option).trim().slice(0, 180)) : [],
        answer: Number(q.answer),
        explanation: String(q.explanation || "").slice(0, 400)
      };
      if (!Number.isInteger(updated.levelId) || updated.levelId < 1 || updated.levelId > 8
        || !updated.question || updated.options.length !== 4 || updated.options.some(option => !option)
        || !Number.isInteger(updated.answer) || updated.answer < 0 || updated.answer > 3) {
        throw new Error("The question details are not valid.");
      }
      list[idx] = updated;
      saveLocal(STORAGE_QUESTIONS, list);
      if (remoteQuestions !== null) remoteQuestions = remoteQuestions.map(question => question.id === cleanId ? updated : question);
      logActivity("ADMIN_UPDATE_QUESTION", "Admin", `Updated question ${cleanId}`);
      if (isLive && db) {
        try { await db.collection("questions").doc(cleanId).set(updated); }
        catch { remoteQuestions = null; throw new Error("Saved on this device, but the online question update failed."); }
      }
      return updated;
    },

    deleteQuestion: async function(id) {
      const cleanId = String(id || "");
      if (!/^q_[A-Za-z0-9_-]{1,60}$/.test(cleanId)
        || DEFAULT_QUESTIONS.some(question => question.id === cleanId)) return false;
      const list = this.getQuestions().filter(question => question.id !== cleanId);
      saveLocal(STORAGE_QUESTIONS, list);
      if (remoteQuestions !== null) remoteQuestions = remoteQuestions.filter(question => question.id !== cleanId);
      logActivity("ADMIN_DELETE_QUESTION", "Admin", `Deleted question ${cleanId}`);
      if (isLive && db) {
        try { await db.collection("questions").doc(cleanId).delete(); }
        catch { remoteQuestions = null; throw new Error("Removed on this device, but the online question could not be removed."); }
      }
      return true;
    },

    // System Branding & Customization Management
    getBrandingConfig: function() {
      const stored = remoteBranding !== null ? remoteBranding : getLocal(STORAGE_BRANDING, {});
      const branding = normalizeBranding(stored);
      if (branding.appName === "CYBER SHIELD") {
        branding.appName = DEFAULT_BRANDING.appName;
      }
      if (branding.appSubtitle === "10-LEVEL CYBER DEFENSE") {
        branding.appSubtitle = DEFAULT_BRANDING.appSubtitle;
      }
      if (branding.appSubtitle === "ONLINE SAFETY ADVENTURE") {
        branding.appSubtitle = DEFAULT_BRANDING.appSubtitle;
      }
      if (branding.loginSubtitle === "LOGIN") {
        branding.loginSubtitle = DEFAULT_BRANDING.loginSubtitle;
      }
      if (branding.loginMotto === "Secure Today • Safer Tomorrow") {
        branding.loginMotto = DEFAULT_BRANDING.loginMotto;
      }
      if (branding.announcementMessage === "🚨 CYBER THREAT ALERT: DEFCON 2 active. Zero-day exploit defenses engaged across the grid.") {
        branding.announcementMessage = DEFAULT_BRANDING.announcementMessage;
      }
      if (branding.welcomeTitle === "WELCOME TO CYBER SHIELD ACADEMY") {
        branding.welcomeTitle = DEFAULT_BRANDING.welcomeTitle;
      }
      if ([
        "Learn to spot online tricks and keep your accounts safe. Choose a game and follow the clues!",
        "You have been cleared for operational duty. Complete each mission to establish your defensive baseline and protect corporate infrastructure.",
        "You have been cleared for operational duty. Complete each mission to establish your defensive baseline.",
        "You have been cleared for operational duty."
      ].includes(branding.welcomeMessage)) {
        branding.welcomeMessage = DEFAULT_BRANDING.welcomeMessage;
      }
      if (branding.certificateOrgName === "CYBER SHIELD DEFENSE ACADEMY") {
        branding.certificateOrgName = DEFAULT_BRANDING.certificateOrgName;
      }
      if (branding.certificateSubtitle === "OFFICIAL CERTIFICATE OF CYBERSECURITY PROFICIENCY") {
        branding.certificateSubtitle = DEFAULT_BRANDING.certificateSubtitle;
      }
      if (branding.missionVictoryMessage === "Outstanding defensive execution, Agent!") {
        branding.missionVictoryMessage = DEFAULT_BRANDING.missionVictoryMessage;
      }
      return branding;
    },

    saveBrandingConfig: async function(newConfig) {
      const current = this.getBrandingConfig();
      const merged = normalizeBranding({ ...current, ...newConfig });
      saveLocal(STORAGE_BRANDING, merged);
      if (isLive && db) remoteBranding = merged;
      logActivity("ADMIN_UPDATE_BRANDING", "Admin", `Customized branding & messages: ${merged.appName}`);

      if (isLive && db) {
        try { await db.collection("system_config").doc("branding").set(merged); }
        catch { remoteBranding = null; throw new Error("Saved on this device, but the shared branding update failed."); }
      }
      return merged;
    },

    resetBrandingConfig: async function() {
      const reset = { ...DEFAULT_BRANDING };
      saveLocal(STORAGE_BRANDING, reset);
      if (isLive && db) remoteBranding = reset;
      logActivity("ADMIN_RESET_BRANDING", "Admin", "Reset branding and messages to system default");
      if (isLive && db) {
        try { await db.collection("system_config").doc("branding").set(reset); }
        catch { remoteBranding = null; throw new Error("Reset on this device, but the shared branding reset failed."); }
      }
      return reset;
    },

    // Level Syllabus & Mission Configuration
    getLevelsConfig: function(fallbackLevels) {
      const stored = getLocal(STORAGE_LEVELS, null);
      if (!fallbackLevels) return stored || [];

      const oldLevels = Array.isArray(stored) ? stored : [];
      const sharedLevels = Array.isArray(remoteLevels) ? remoteLevels : [];
      const levels = fallbackLevels.map(defaultLevel => {
        const local = oldLevels.find(item => Number(item.id) === defaultLevel.id) || {};
        const shared = sharedLevels.find(item => Number(item.id) === defaultLevel.id) || {};
        return normalizeLevel({ ...local, ...shared, briefing: { ...local.briefing, ...shared.briefing } }, defaultLevel);
      });
      saveLocal(STORAGE_LEVELS, levels);
      return levels;
    },

    saveLevelConfig: async function(levelId, updatedData) {
      let levels = getLocal(STORAGE_LEVELS, []);
      if (!Array.isArray(levels) || !levels.length) return null;
      const idx = levels.findIndex(l => l.id === Number(levelId));
      if (idx >= 0) {
        levels[idx] = normalizeLevel({
          ...levels[idx],
          ...updatedData,
          briefing: { ...levels[idx].briefing, ...updatedData.briefing }
        }, levels[idx]);
        saveLocal(STORAGE_LEVELS, levels);
        if (remoteLevels !== null) {
          remoteLevels = [...remoteLevels.filter(level => Number(level.id) !== Number(levelId)), levels[idx]];
        }
        logActivity("ADMIN_UPDATE_LEVEL", "Admin", `Updated game settings for Level ${levelId}: ${levels[idx].name}`);
        if (isLive && db) {
          try { await db.collection("levels").doc(String(levelId)).set(levels[idx]); }
          catch { remoteLevels = null; throw new Error("Saved on this device, but the shared game settings could not be updated."); }
        }
        return levels[idx];
      }
      return null;
    },

    resetLevelsConfig: async function(defaultLevels) {
      const levels = defaultLevels.map(level => normalizeLevel(level, level));
      saveLocal(STORAGE_LEVELS, levels);
      if (isLive && db) remoteLevels = levels;
      logActivity("ADMIN_RESET_LEVELS", "Admin", "Restored default game settings");
      if (isLive && db) {
        try {
          const batch = db.batch();
          levels.forEach(level => batch.set(db.collection("levels").doc(String(level.id)), level));
          await batch.commit();
        } catch {
          remoteLevels = null;
          throw new Error("Reset on this device, but the shared game settings could not be reset.");
        }
      }
      return defaultLevels;
    },

    // Activity Logs
    getActivityLogs: function() {
      return getLocal(STORAGE_LOGS, []);
    },
    logActivity: logActivity,

    // Report Generation
    exportCSVReport: function() {
      const agents = this.getAllAgents();
      let csv = "Agent Codename,Clearance Rank,Total Score,Lives,Levels Cleared,Achievements Count,Registered Date,Last Login\n";
      agents.forEach(a => {
        csv += `"${a.agentName}","${a.rankTitle || 'Recruit'}",${a.score || 0},${a.lives || 3},${a.completedLevels ? a.completedLevels.length : 0},${a.achievements ? a.achievements.length : 0},"${a.registeredAt || ''}","${a.lastLogin || ''}"\n`;
      });
      return csv;
    },

    exportJSONReport: function() {
      return JSON.stringify({
        generatedAt: new Date().toISOString(),
        firebaseProject: FIREBASE_CONFIG.projectId,
        totalAgents: this.getAllAgents().length,
        agents: this.getAllAgents(),
        activityLogs: this.getActivityLogs(),
        questions: this.getQuestions()
      }, null, 2);
    }
  };
})();

window.FirebaseBridge = FirebaseBridge;
