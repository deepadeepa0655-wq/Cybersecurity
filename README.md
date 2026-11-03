# CyberQuest

CyberQuest is an interactive online safety learning game designed for young players, parents, and classrooms. It features eight engaging mini-games, an animated welcome briefing, and layouts tailored for both desktop computers and mobile devices.

---

## Important Project Notes

### Purpose and Philosophy
- Teaches essential digital safety habits through short, hands-on challenges.
- Avoids fear-based lessons, focusing instead on positive, empowering safety principles: pause, inspect, verify, and ask a trusted adult.
- Keeps complexity low and interactions immediate so learners of all ages can play and learn independently.

### The Eight Safety Missions
1. **Password Parkour**: Jump over weak, predictable passwords and assemble long, memorable passphrases with mixed characters.
2. **Phishing Patrol**: Inspect incoming messages to sort authentic communications from deceptive lures and urgent scams.
3. **Safe Link Safari**: Compare similar web addresses and identify safe, verified domain names before clicking.
4. **Virus File Hunt**: Locate unexpected or suspicious file attachments and isolate untrusted software.
5. **Ransomware Rescue**: Understand what ransomware is, how files get locked, and why asking a trusted adult is always the right step.
6. **Spy Gadget Search**: Scan a room to discover hidden hardware keyloggers, rogue chargers, and unknown recording devices.
7. **Password Power-Up**: Create strong, unique credentials for fictional game characters without using personal details like real names or birthdays.
8. **Think Before You Share**: Practice deflecting social engineering, fake phone calls, and deceptive requests for one-time verification codes.

---

## Gameplay and User Experience Notes

### Starting a Game
- New players can immediately play as a guest by choosing a creative game nickname that is not their real name.
- Guest progress and high scores are saved locally on the player's device.
- Players with an existing account can sign in using their nickname and passphrase to synchronize progress across sessions.

### Controls and Accessibility
- Designed for keyboard, mouse, and touchscreen input.
- Navigation supports both click and tap interactions with large touch targets.
- Animations respect system accessibility preferences, automatically shortening transitions when reduced motion is preferred.
- Audio cues provide instant positive reinforcement for safe choices and gentle feedback for incorrect attempts without external audio files.

### Rewards and Progression
- Unlocking Levels: Completing a mission unlocks the next challenge in sequence.
- Badge Collection: Clearing each level earns a distinct safety badge.
- Official Certificate: Clearing at least five levels or reaching twelve hundred points qualifies the player for a printable completion certificate.
- Live Score Board: Signed-in players can view community rankings that update as missions are cleared.

---

## Privacy and Protection Notes

### Kid-Safe Data Principles
- No personal identifying information (real name, phone number, address, or email address) is requested or required.
- Passwords and personal secrets should never be entered into the game.
- The leaderboard shares only a player's chosen nickname, selected avatar emoji, score, and number of levels cleared.
- Private accounts and administrator documents are protected by strict security rules.

---

## Administration and Customization Notes

### Shared Configuration
- An administrator dashboard allows updating game titles, welcome text, announcements, safety tips, and practice quiz questions.
- Time limits can be customized for timed missions (Password Parkour, Phishing Patrol, Spy Gadget Search, and Think Before You Share).
- First-clear points and starting life counts can be adjusted to tune difficulty for different age groups.
- Practice questions are stored for classroom review and are delivered directly to the browser for instant feedback.

---

## System Architecture Notes

### Application Components
- **Game Engine**: Pure client-side JavaScript architecture with zero heavy third-party framework dependencies.
- **State Controller**: Manages level definitions, player progress, unlocked badges, and certificate eligibility in a streamlined module.
- **Animation and FX**: Zero-dependency visual effects engine delivering celebratory confetti, pulse effects, and score rollups.
- **Audio Synthesizer**: Web Audio API engine producing real-time sound effects and chimes without downloading external sound files.
- **Web Server**: Minimal Express server that delivers static assets and health status while enforcing strict security headers.
- **Cloud Backend**: Optional Firebase Authentication and Firestore database for live community ranks and synchronized administrator settings.
