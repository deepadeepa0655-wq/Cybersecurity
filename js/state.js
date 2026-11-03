// CyberQuest progress and eight child-friendly game levels
const AppState = (function() {
  const DEFAULT_LEVELS = [
    {
      id: 1,
      name: "Password Parkour",
      codename: "Build a strong password",
      icon: "🔐",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Jump over weak passwords and collect strong passphrase pieces.",
      tip: "Use a long, one-of-a-kind password. Keep it private.",
      clearReward: 250,
      defaultTime: "02:30",
      briefing: {
        threat: "Easy passwords are easier to guess.",
        defense: "Use a long password that is hard to guess.",
        rule: "Never share your password."
      }
    },
    {
      id: 2,
      name: "Phishing Patrol",
      codename: "Spot the tricky message",
      icon: "✉️",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Sort real messages from tricky ones before they reach your inbox.",
      tip: "Pause when a message rushes you or asks for a secret.",
      clearReward: 300,
      defaultTime: "02:30",
      briefing: {
        threat: "Fake messages try to trick you into clicking or sharing.",
        defense: "Check the sender and ask a trusted adult if you are unsure.",
        rule: "Never send a password or sign-in code in a message."
      }
    },
    {
      id: 3,
      name: "Safe Link Safari",
      codename: "Choose a safe link",
      icon: "🔗",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Pick the safest link from a group of look-alikes.",
      tip: "Check the full website name before opening a link.",
      clearReward: 320,
      defaultTime: "02:30",
      briefing: {
        threat: "Tricky links can lead to fake pages or unsafe downloads.",
        defense: "Use a known, trusted website address.",
        rule: "Ask before opening a surprising link."
      }
    },
    {
      id: 4,
      name: "Virus File Hunt",
      codename: "Spot unsafe files",
      icon: "🦠",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Find the suspicious files and keep the computer safe.",
      tip: "Only open files from people and places you trust.",
      clearReward: 350,
      defaultTime: "02:30",
      briefing: {
        threat: "Some files can carry harmful software.",
        defense: "Check with a trusted adult before opening an unexpected file.",
        rule: "Do not download surprise attachments."
      }
    },
    {
      id: 5,
      name: "Ransomware Rescue",
      codename: "Help the locked files",
      icon: "🐙",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Answer safety questions and help rescue the locked files.",
      tip: "Tell a trusted adult right away if files suddenly look locked.",
      clearReward: 380,
      defaultTime: "02:30",
      briefing: {
        threat: "Ransomware can lock files and demand money.",
        defense: "Stop and get help from a trusted adult.",
        rule: "Do not pay or click anything by yourself."
      }
    },
    {
      id: 6,
      name: "Spy Gadget Search",
      codename: "Find hidden devices",
      icon: "🕵️",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Look carefully and find the hidden spy gadgets in the room.",
      tip: "If a device seems strange, leave it alone and tell an adult.",
      clearReward: 360,
      defaultTime: "02:30",
      briefing: {
        threat: "Unfamiliar devices may be unsafe or out of place.",
        defense: "Do not touch unknown gadgets. Ask a trusted adult.",
        rule: "Stay curious, but let a grown-up check it."
      }
    },
    {
      id: 7,
      name: "Password Power-Up",
      codename: "Pick the strongest",
      icon: "🛡️",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Choose the strongest password for a made-up game character.",
      tip: "Never use real names, birthdays, or other personal details.",
      clearReward: 350,
      defaultTime: "02:30",
      briefing: {
        threat: "Guessable details can make passwords easier to crack.",
        defense: "Make up a long password that is not about you.",
        rule: "Keep real personal details out of passwords."
      }
    },
    {
      id: 8,
      name: "Think Before You Share",
      codename: "Stop the trick",
      icon: "📱",
      theme: "blue",
      accent: "#39c7ff",
      goal: "Spot fake calls, pop-ups, and requests for sign-in codes.",
      tip: "Never share a one-time code. Check with a trusted adult.",
      clearReward: 380,
      defaultTime: "02:30",
      briefing: {
        threat: "Scammers may pretend to be a friend, a game, or a helper.",
        defense: "Stop, do not share, and check with a trusted adult.",
        rule: "A real helper will not ask you to read out your sign-in code."
      }
    }
  ];

  const ALL_ACHIEVEMENTS = [
    { id: "b1", title: "Password Pathfinder", desc: "Built a hard-to-guess password.", icon: "🔐" },
    { id: "b2", title: "Phish Spotter", desc: "Spotted a tricky message.", icon: "✉️" },
    { id: "b3", title: "Link Lookout", desc: "Found the safer link.", icon: "🔗" },
    { id: "b4", title: "File Finder", desc: "Found the suspicious file.", icon: "🦠" },
    { id: "b5", title: "File Rescuer", desc: "Learned what to do about locked files.", icon: "🐙" },
    { id: "b6", title: "Gadget Sleuth", desc: "Found the hidden gadgets.", icon: "🕵️" },
    { id: "b7", title: "Password Pro", desc: "Picked a strong pretend-game password.", icon: "🛡️" },
    { id: "b8", title: "Share-Safe Star", desc: "Kept sign-in codes private.", icon: "⭐" }
  ];

  let currentUser = null;
  let currentLevels = null;

  return {
    getDefaultLevels: () => DEFAULT_LEVELS,
    reloadLevels: () => {
      currentLevels = FirebaseBridge.getLevelsConfig(DEFAULT_LEVELS);
      return currentLevels;
    },
    getLevels: () => {
      if (!currentLevels) {
        currentLevels = FirebaseBridge.getLevelsConfig(DEFAULT_LEVELS);
      }
      return currentLevels;
    },
    getLevelById: (id) => {
      return AppState.getLevels().find(l => l.id === Number(id));
    },
    updateLevel: async (id, updatedData) => {
      if (currentLevels) {
        const idx = currentLevels.findIndex(l => l.id === Number(id));
        if (idx >= 0) {
          currentLevels[idx] = { ...currentLevels[idx], ...updatedData };
        }
      }
      return await FirebaseBridge.saveLevelConfig(id, updatedData);
    },
    resetLevels: async () => {
      currentLevels = DEFAULT_LEVELS.map(level => ({ ...level, briefing: { ...level.briefing } }));
      await FirebaseBridge.resetLevelsConfig(DEFAULT_LEVELS);
      currentLevels = FirebaseBridge.getLevelsConfig(DEFAULT_LEVELS);
      return currentLevels;
    },
    getAllAchievements: () => ALL_ACHIEVEMENTS,

    setUser: (u) => { currentUser = u; },
    getUser: () => currentUser,

    isNewUser: () => {
      if (!currentUser) return true;
      return (!currentUser.completedLevels || currentUser.completedLevels.length === 0) && (currentUser.score === 0);
    },

    addScore: (points, save = true) => {
      if (!currentUser) return;
      currentUser.score = (currentUser.score || 0) + points;
      if (currentUser.score >= 1800) currentUser.rankTitle = "Cyber Hero";
      else if (currentUser.score >= 1000) currentUser.rankTitle = "Safety Star";
      else if (currentUser.score >= 400) currentUser.rankTitle = "Quest Explorer";
      else currentUser.rankTitle = "Cyber Explorer";

      if (save) FirebaseBridge.saveUserProgress(currentUser);
    },

    setLives: (n) => {
      if (!currentUser) return;
      currentUser.lives = Math.max(0, n);
      FirebaseBridge.saveUserProgress(currentUser, { syncLeaderboard: false });
    },

    completeLevel: async (levelId, levelScore = 0) => {
      const safeLevelId = Number(levelId);
      if (!currentUser || !Number.isInteger(safeLevelId) || safeLevelId < 1 || safeLevelId > 8) return 0;
      if (safeLevelId !== Math.max(1, Number(currentUser.unlockedLevel) || 1)) return 0;
      if (!currentUser.completedLevels) currentUser.completedLevels = [];
      if (currentUser.completedLevels.includes(safeLevelId)) return 0;
      const previousUser = {
        ...currentUser,
        completedLevels: [...currentUser.completedLevels],
        achievements: Array.isArray(currentUser.achievements) ? [...currentUser.achievements] : []
      };
      const pointsAwarded = Math.max(1, Math.min(1000, Math.floor(Number(levelScore) || 0)));
      currentUser.completedLevels.push(safeLevelId);
      currentUser.unlockedLevel = Math.max(currentUser.unlockedLevel || 1, safeLevelId + 1);

      // Unlock corresponding badge
      AppState.unlockAchievement("b" + safeLevelId, false);

      AppState.addScore(pointsAwarded, false);
      let saveResult;
      try {
        saveResult = await FirebaseBridge.saveUserProgress(currentUser, { requireRemote: true });
      } catch (error) {
        currentUser = previousUser;
        throw error;
      }
      FirebaseBridge.logActivity("LEVEL_COMPLETE", currentUser.agentName, `Cleared Level ${safeLevelId}: ${AppState.getLevelById(safeLevelId)?.name}`);
      return { pointsAwarded, ...saveResult };
    },

    unlockAchievement: (badgeId, save = true) => {
      if (!currentUser) return;
      if (!currentUser.achievements) currentUser.achievements = [];
      if (!currentUser.achievements.includes(badgeId)) {
        currentUser.achievements.push(badgeId);
        Sound.win();
        if (save) FirebaseBridge.saveUserProgress(currentUser);
      }
    },

    isEligibleForCertificate: () => {
      if (!currentUser) return false;
      return (currentUser.completedLevels && currentUser.completedLevels.length >= 5) || (currentUser.score >= 1200);
    }
  };
})();

window.AppState = AppState;
