# GitHub and production deployment

This repository is prepared for:

- repeatable installation from a fresh clone with npm workspaces;
- automatic verification with GitHub Actions;
- static web-client deployment to GitHub Pages;
- backend deployment as a Node.js service or Docker container.

GitHub Pages hosts only the web client. The Socket.IO backend must run on a public host that supports WebSockets and HTTPS.

## 1. Verify locally

Use Node.js 22.13 or newer:

```powershell
npm ci
npm run check
```

Run the complete local web game:

```powershell
npm run web
```

Open `http://localhost:8081`.

## 2. Create and push the GitHub repository

Create an empty repository on GitHub, without generating another README or `.gitignore`. From this project directory:

```powershell
git add .
git commit -m "Prepare Arabic Codenames for GitHub"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPOSITORY.git
git push -u origin main
```

If `origin` already exists, inspect it with `git remote -v` and update it with:

```powershell
git remote set-url origin https://github.com/YOUR-NAME/YOUR-REPOSITORY.git
```

The `Verify project` workflow runs tests, Expo Doctor, the production web export, and a backend container build.

## 3. Deploy the backend first

The backend is in `server/` and listens on the host and port supplied by the environment:

```text
HOST=0.0.0.0
PORT=3001
CORS_ORIGIN=https://YOUR-NAME.github.io
```

For a GitHub Pages project site, the browser origin does not include the repository path, so the CORS value remains `https://YOUR-NAME.github.io`.

Any Node.js host with HTTPS and WebSocket support can run:

```powershell
npm ci --omit=dev
npm start
```

from the `server` directory.

Alternatively, deploy the included container:

```powershell
docker build -t arabic-codenames-server ./server
docker run --rm -p 3001:3001 `
  -e CORS_ORIGIN=https://YOUR-NAME.github.io `
  arabic-codenames-server
```

Verify the public deployment:

```text
https://YOUR-BACKEND.example/health
```

It must return JSON containing `"ok": true`. The public URL must use `https://`; Socket.IO will use secure WebSockets from the HTTPS GitHub Pages site.

The current server stores rooms in memory. Rooms disappear when the process restarts, and horizontal scaling requires a shared adapter such as Redis.

## 4. Configure the frontend URL in GitHub

In the GitHub repository:

1. Open **Settings → Secrets and variables → Actions → Variables**.
2. Create the repository variable `EXPO_PUBLIC_SERVER_URL`.
3. Set it to the public HTTPS backend URL, without a trailing path, for example:

   ```text
   https://arabic-codenames-api.example
   ```

This value is public by design because it is embedded in the browser bundle. Do not put passwords or tokens in any `EXPO_PUBLIC_` variable.

## 5. Enable GitHub Pages

1. Open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Open **Actions → Deploy web client to GitHub Pages**.
4. Choose **Run workflow** for the first deployment.

After the first successful run, pushes to `main` deploy automatically. If the backend URL variable is missing, the client still deploys with a workflow warning; multiplayer requires a public HTTPS backend configured through the variable or the app's server settings.

The workflow automatically:

- detects whether the site is hosted at `/REPOSITORY-NAME` or the domain root;
- configures Expo's production base URL;
- embeds the public Pages URL used by room QR invitations;
- exports the web bundle;
- generates the installable web-app manifest, service worker, home-screen icons, and SPA fallback;
- disables Jekyll processing for Expo's `_expo` directory;
- uploads and deploys the GitHub Pages artifact.

The public site will normally be:

```text
https://YOUR-NAME.github.io/YOUR-REPOSITORY/
```

On Android, use the in-app **install** button or the browser's **Install app** command. On iPhone, open the site in Safari, tap **Share**, then **Add to Home Screen**. Both launch with the `الشفرة` icon in standalone mode.

## 6. Native iOS and Android builds

GitHub stores and verifies the source but does not turn it into App Store or Play Store binaries. Use EAS Build when native distribution is needed:

```powershell
npx eas-cli@latest build --platform all
```

Set the production `EXPO_PUBLIC_SERVER_URL` in the EAS build profile before building.

## Repository safety

- `.env` and `.env.*` are ignored; only example environment files are committed.
- `node_modules`, Expo state, generated native projects, signing keys, and production bundles are ignored.
- Never commit Apple certificates, Android keystores, passwords, tokens, or service credentials.
- The CI workflow uses only read access. The Pages workflow receives only the permissions required for Pages deployment.
