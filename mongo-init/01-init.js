// =============================================================================
// Cyber Shield Platform - MongoDB Initialization Script
// Runs on first container startup to create collections and indexes
// =============================================================================

// Switch to the cybershield database
db = db.getSiblingDB('cybershield');

// =============================================================================
// Create Collections with Validation
// =============================================================================

// Users Collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['agentName', 'password', 'avatar', 'score', 'lives', 'unlockedLevel', 'completedLevels', 'achievements', 'rankTitle', 'registeredAt', 'lastLogin'],
      properties: {
        agentName: { bsonType: 'string', minLength: 3, maxLength: 32 },
        password: { bsonType: 'string', minLength: 4 },
        avatar: { bsonType: 'string' },
        score: { bsonType: 'int', minimum: 0 },
        lives: { bsonType: 'int', minimum: 0, maximum: 10 },
        unlockedLevel: { bsonType: 'int', minimum: 1, maximum: 12 },
        completedLevels: { bsonType: 'array', items: { bsonType: 'int' } },
        achievements: { bsonType: 'array', items: { bsonType: 'string' } },
        rankTitle: { bsonType: 'string' },
        registeredAt: { bsonType: 'date' },
        lastLogin: { bsonType: 'date' },
        uid: { bsonType: 'string' },
        isAdmin: { bsonType: 'bool' }
      }
    }
  }
});

// Questions Collection
db.createCollection('questions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'levelId', 'question', 'options', 'answer', 'explanation'],
      properties: {
        id: { bsonType: 'string' },
        levelId: { bsonType: 'int', minimum: 1, maximum: 12 },
        question: { bsonType: 'string', minLength: 10 },
        options: { bsonType: 'array', minItems: 2, maxItems: 6, items: { bsonType: 'string' } },
        answer: { bsonType: 'int', minimum: 0 },
        explanation: { bsonType: 'string' }
      }
    }
  }
});

// Levels Collection
db.createCollection('levels', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'targetScore', 'defaultTime', 'isActive'],
      properties: {
        id: { bsonType: 'int', minimum: 1, maximum: 12 },
        name: { bsonType: 'string', minLength: 3 },
        targetScore: { bsonType: 'int', minimum: 100 },
        defaultTime: { bsonType: 'string', pattern: '^\\d{2}:\\d{2}$' },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

// Activity Logs Collection
db.createCollection('activity_logs', {
  capped: true,
  size: 10485760, // 10MB
  max: 10000
});

// Admins Collection
db.createCollection('admins', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'role', 'created'],
      properties: {
        email: { bsonType: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        role: { bsonType: 'string', enum: ['Master Administrator', 'Administrator', 'Moderator'] },
        created: { bsonType: 'date' }
      }
    }
  }
});

// System Config Collection
db.createCollection('system_config', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id'],
      properties: {
        _id: { bsonType: 'string' }
      }
    }
  }
});

// =============================================================================
// Create Indexes
// =============================================================================

// Users indexes
db.users.createIndex({ agentName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
db.users.createIndex({ score: -1 });
db.users.createIndex({ unlockedLevel: -1 });
db.users.createIndex({ registeredAt: -1 });
db.users.createIndex({ lastLogin: -1 });
db.users.createIndex({ uid: 1 }, { sparse: true });

// Questions indexes
db.questions.createIndex({ levelId: 1 });
db.questions.createIndex({ id: 1 }, { unique: true });

// Levels indexes
db.levels.createIndex({ id: 1 }, { unique: true });
db.levels.createIndex({ isActive: 1 });

// Activity logs indexes (TTL for automatic cleanup)
db.activity_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Admins indexes
db.admins.createIndex({ email: 1 }, { unique: true });

// System config indexes
db.system_config.createIndex({ _id: 1 }, { unique: true });

// =============================================================================
// Insert Default Levels Data
// =============================================================================

const defaultLevels = [
  { id: 1, name: 'Password Security', targetScore: 250, defaultTime: '01:30', isActive: true },
  { id: 2, name: 'Phishing Detection', targetScore: 300, defaultTime: '01:20', isActive: true },
  { id: 3, name: 'Malware & Ransomware Awareness', targetScore: 420, defaultTime: '02:30', isActive: true },
  { id: 4, name: 'Social Engineering Awareness', targetScore: 350, defaultTime: '01:45', isActive: true },
  { id: 5, name: 'Safe Internet Browsing', targetScore: 400, defaultTime: '01:15', isActive: true },
  { id: 6, name: 'Clone Phishing', targetScore: 450, defaultTime: '01:30', isActive: true },
  { id: 7, name: 'Spy Device Hunt', targetScore: 380, defaultTime: '01:30', isActive: true },
  { id: 8, name: 'Baiting', targetScore: 350, defaultTime: '01:20', isActive: true },
  { id: 9, name: 'Two-Factor Authentication (2FA)', targetScore: 450, defaultTime: '01:30', isActive: true },
  { id: 10, name: 'Final Cyber Security Challenge', targetScore: 600, defaultTime: '02:00', isActive: true },
  { id: 11, name: 'Cloud Security & API Leaks', targetScore: 500, defaultTime: '01:45', isActive: true },
  { id: 12, name: 'Zero Trust Architecture', targetScore: 550, defaultTime: '02:00', isActive: true }
];

db.levels.insertMany(defaultLevels);

// =============================================================================
// Insert Default Questions Data
// =============================================================================

const defaultQuestions = [
  { id: 'q1_1', levelId: 1, question: 'Which password has the highest entropy?', options: ['P@ssw0rd2024', 'correct-horse-battery-staple-9!', '1234567890', 'CyberSecurity'], answer: 1, explanation: 'Length plus varied character sets provide exponential brute-force resistance.' },
  { id: 'q2_1', levelId: 2, question: 'What is the primary indicator of a phishing email?', options: ['Artificial urgency demanding immediate action', 'Official logo in header', 'Formal salutation', 'PlainText formatting'], answer: 0, explanation: 'False urgency is designed to make victims bypass critical scrutiny.' },
  { id: 'q3_1', levelId: 3, question: 'What is the immediate priority during a ransomware outbreak?', options: ['Pay the ransom in Bitcoin', 'Air-gap and isolate the affected machine immediately', 'Restart 5 times', 'Forward infected email to colleagues'], answer: 1, explanation: 'Air-gapping prevents lateral movement to servers and network shares.' },
  { id: 'q4_1', levelId: 4, question: 'In Social Engineering, what is Pretexting?', options: ['Fabricating a trusted scenario to manipulate victims', 'Scanning ports', 'Writing code', 'Installing an antivirus'], answer: 0, explanation: 'Pretexting exploits trust through fabricated backstories.' },
  { id: 'q5_1', levelId: 5, question: 'What does HTTPS in the address bar ensure?', options: ['Site is 100% verified safe', 'Data in transit is encrypted using SSL/TLS', 'Site cannot be cloned', 'Your PC is immune to malware'], answer: 1, explanation: 'HTTPS encrypts communications between client and server.' },
  { id: 'q6_1', levelId: 6, question: 'How does Clone Phishing work?', options: ['Creates a brand new layout', 'Duplicates a genuine past email with replaced malicious links', 'Only targets SMS', 'Requires physical hardware'], answer: 1, explanation: 'Clone phishing duplicates authentic past communications.' },
  { id: 'q7_1', levelId: 7, question: 'Which covert device intercepts keystrokes in shared offices?', options: ['Hardware USB keylogger', 'HDMI cable', 'Mousepad', 'USB fan'], answer: 0, explanation: 'Hardware keyloggers log keystrokes before software antivirus can detect them.' },
  { id: 'q8_1', levelId: 8, question: 'What constitutes a Baiting attack?', options: ['Leaving infected USBs in parking lots', 'Running an SSH scan', 'Sending meeting invites', 'Performing backups'], answer: 0, explanation: 'Baiting exploits human curiosity using weaponized physical or digital media.' },
  { id: 'q9_1', levelId: 9, question: 'Why is TOTP Authenticator superior to SMS 2FA?', options: ['SMS is vulnerable to SIM-Swapping', 'SMS expires in 10s', 'Authenticators require no phone', 'SMS is not encrypted on cellular towers'], answer: 0, explanation: 'Attackers can intercept SMS via carrier social engineering (SIM swap).' },
  { id: 'q10_1', levelId: 10, question: 'What is Defense in Depth?', options: ['Relying exclusively on a single firewall', 'Layering multiple security controls (Identity, Network, Endpoint, Backup)', 'Only encrypting passwords', 'Scanning once a year'], answer: 1, explanation: 'Layered security ensures failure of one control does not compromise the perimeter.' },
  { id: 'q11_1', levelId: 11, question: 'What is a common cause of cloud data breaches?', options: ['Misconfigured S3 buckets with public access', 'Strong encryption at rest', 'Regular security audits', 'Using private subnets only'], answer: 0, explanation: 'Misconfigured storage buckets are a leading cause of cloud data exposure.' },
  { id: 'q12_1', levelId: 12, question: 'What is the core principle of Zero Trust Architecture?', options: ['Trust but verify', 'Never trust, always verify', 'Trust internal network', 'Perimeter-based security'], answer: 1, explanation: 'Zero Trust assumes no implicit trust, requiring verification for every request.' }
];

db.questions.insertMany(defaultQuestions);

// =============================================================================
// Insert Default System Branding Config
// =============================================================================

db.system_config.insertOne({
  _id: 'branding',
  appName: 'CYBER SHIELD',
  appSubtitle: '10-LEVEL CYBER DEFENSE',
  loginSubtitle: 'LOGIN',
  loginMotto: 'Secure Today • Safer Tomorrow',
  logoType: 'emoji',
  logoIcon: '🛡️',
  logoImageUrl: '',
  announcementEnabled: true,
  announcementMessage: '🚨 CYBER THREAT ALERT: DEFCON 2 active. Zero-day exploit defenses engaged across the grid.',
  welcomeTitle: 'WELCOME TO CYBER SHIELD ACADEMY',
  welcomeMessage: 'You have been cleared for operational duty. Complete each mission to establish your defensive baseline and protect corporate infrastructure.',
  certificateOrgName: 'CYBER SHIELD DEFENSE ACADEMY',
  certificateSubtitle: 'OFFICIAL CERTIFICATE OF CYBERSECURITY PROFICIENCY',
  defaultLives: 3,
  missionVictoryMessage: 'Outstanding defensive execution, Agent!'
});

// =============================================================================
// Create Admin User (password should be changed on first login)
// =============================================================================

// Note: The actual admin authentication is handled in firebase-config.js
// This is just a placeholder document for reference
db.admins.insertOne({
  email: 'admin@cybershield.agency',
  role: 'Master Administrator',
  created: new Date()
});

// =============================================================================
// Log initialization completion
// =============================================================================

print('✅ Cyber Shield MongoDB initialization completed successfully!');
print('Collections created: users, questions, levels, activity_logs, admins, system_config');
print('Indexes created and default data inserted.');