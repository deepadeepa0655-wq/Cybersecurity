// Comprehensive Verification of CyberQuest Functions and Architecture
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

console.log('=== 1. VERIFYING JAVASCRIPT SYNTAX ===');
const jsFiles = [
  'server.js',
  'healthcheck.js',
  'js/cyber-fx.js',
  'js/sound.js',
  'js/state.js',
  'js/certificate.js',
  'js/popup.js',
  'js/firebase-config.js',
  'js/admin.js',
  'js/app.js',
  'js/games/level1_password.js',
  'js/games/level2_phishing.js',
  'js/games/quest_level3_links.js',
  'js/games/quest_level4_files.js',
  'js/games/quest_level5_ransomware.js',
  'js/games/level7_spydew.js',
  'js/games/quest_level7_password.js',
  'js/games/level4_socialeng.js'
];

jsFiles.forEach(file => {
  try {
    execSync(`node -c "${file}"`);
    assert(true, `Syntax OK: ${file}`);
  } catch (e) {
    assert(false, `Syntax Error in ${file}: ${e.message}`);
  }
});

console.log('\n=== 2. VERIFYING APPSTATE & GAME LEVELS ===');
global.window = {};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); }
};
global.FirebaseBridge = {
  getLevelsConfig(defs) { return defs; },
  saveUserProgress: async () => ({ success: true }),
  logActivity: () => {},
  getBrandingConfig: () => ({ appName: 'CYBERQUEST' })
};

require('./js/state.js');
const AppState = global.window.AppState;
assert(typeof AppState === 'object', 'AppState defined and attached to window');
assert(typeof AppState.getLevels === 'function', 'AppState.getLevels is a function');
const levels = AppState.getLevels();
assert(levels.length === 8, `AppState has exactly 8 levels (got: ${levels.length})`);
assert(levels[0].name === 'Password Parkour', 'Level 1 is Password Parkour');
assert(levels[7].name === 'Think Before You Share', 'Level 8 is Think Before You Share');

const achievements = AppState.getAllAchievements();
assert(achievements.length === 8, `AppState has exactly 8 achievements (got: ${achievements.length})`);

// Test user scoring & level completion
AppState.setUser({ agentName: 'TestHero', unlockedLevel: 1, completedLevels: [], score: 0, lives: 3 });
assert(AppState.getUser().agentName === 'TestHero', 'AppState setUser/getUser works');
AppState.addScore(100, false);
assert(AppState.getUser().score === 100, 'AppState addScore works');

console.log('\n=== 3. VERIFYING ACTIVE MINI-GAME ENGINES ===');
const activeEngines = [
  { file: 'js/games/level1_password.js', name: 'Level1_Password' },
  { file: 'js/games/level2_phishing.js', name: 'Level2_Phishing' },
  { file: 'js/games/quest_level3_links.js', name: 'QuestLevel3Links' },
  { file: 'js/games/quest_level4_files.js', name: 'QuestLevel4Files' },
  { file: 'js/games/quest_level5_ransomware.js', name: 'QuestLevel5Ransomware' },
  { file: 'js/games/level7_spydew.js', name: 'Level7_SpyDevice' },
  { file: 'js/games/quest_level7_password.js', name: 'QuestLevel7Password' },
  { file: 'js/games/level4_socialeng.js', name: 'Level4_SocialEngineering' }
];

activeEngines.forEach(eng => {
  const content = fs.readFileSync(eng.file, 'utf8');
  assert(content.includes(`const ${eng.name}`) || content.includes(`var ${eng.name}`) || content.includes(`window.${eng.name}`), `${eng.name} engine declared in ${eng.file}`);
  assert(content.includes('init:') || content.includes('init('), `${eng.name} has init() method`);
  assert(content.includes('cleanup:') || content.includes('cleanup('), `${eng.name} has cleanup() method`);
});

console.log('\n=== 4. VERIFYING INDEX.HTML SCRIPT INCLUDES ===');
const html = fs.readFileSync('index.html', 'utf8');
jsFiles.forEach(file => {
  if (file === 'server.js' || file === 'healthcheck.js') return;
  assert(html.includes(file) || html.includes(file.replace(/\\/g, '/')), `index.html includes script: ${file}`);
});

console.log('\n=== 5. VERIFYING SERVER STRUCTURE ===');
const serverCode = fs.readFileSync('server.js', 'utf8');
assert(serverCode.includes("express = require('express')"), 'server.js uses Express');
assert(serverCode.includes("app.get('/api/health'"), 'server.js defines /api/health');
assert(serverCode.includes("app.get('/api/animations'"), 'server.js defines /api/animations');
assert(serverCode.includes("express.static"), 'server.js serves static assets');
assert(serverCode.includes("module.exports = app"), 'server.js exports app');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
console.log(`========================================`);

if (failCount > 0) process.exit(1);
process.exit(0);
