# CyberQuest production setup

CyberQuest is a static browser game with Firebase Authentication and Cloud Firestore for online player accounts and live ranks. Guest progress is stored in the browser. The Express server can host the same page for self-hosted deployments.

## Firebase Hosting

The browser app and Firebase CLI target the `cybersecurity-1a` Firebase project. Before deploying, make sure Email/Password sign-in and Cloud Firestore are enabled for that project.

Deploy the site and its access rules together:

```sh
firebase deploy --project cybersecurity-1a --only hosting,firestore:rules
```

The live Ranks screen uses Firestore listeners. Its rules allow signed-in players to read up to 15 public score records containing a game nickname, avatar, score, and level count. The game also reads public branding, eight level settings, and up to 100 practice questions; only administrators can change those settings. Private player profiles remain limited to the owner and administrators. Keep the deployed rules aligned with [firestore.rules](firestore.rules).

To enable the administrator page, create an Authentication account and then provision `admins/{user-uid}` from a trusted Firebase console or Admin SDK workflow with `{ "role": "admin" }`. Client apps cannot create or change admin records.

## Self-hosted Node server

Install the current Node.js LTS release, then run:

```sh
npm ci
npm start
```

The server listens on port `5000` by default. Set `PORT` and `NODE_ENV` in the host environment as needed. Put it behind a managed HTTPS reverse proxy for public access; do not expose development or administrative credentials in the browser or image build.

Docker is also supported:

```sh
docker compose up --build -d
```

The Compose app publishes its HTTP port on `127.0.0.1` only. Put a TLS reverse proxy in front of it for public access. The sample Nginx configuration is a template: replace `yourdomain.com` and provide the certificate files before enabling that service.

The Docker build excludes `.env*` files. The server provides `/api/health` and `/api/animations`; all game questions are built into the browser app.

## Before going live

- Confirm Firebase Authentication and Firestore are enabled in `cybersecurity-1a`.
- Deploy the current Firestore rules before enabling live ranks and shared game settings.
- Keep guest sessions local and ask players to use a nickname instead of their real name.
- Serve the Node deployment through HTTPS and keep environment files outside the web root.
- Do not treat the friendly game score board as a prize or identity verification system.
