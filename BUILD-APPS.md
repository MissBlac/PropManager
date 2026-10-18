# Building installable apps

This repository can produce native installable apps for **Android, Windows, macOS and Linux** from the same web app, with no local tooling required.

---

## 1. Build on GitHub (recommended — nothing to install)

1. Go to the repo on GitHub → **Actions** tab.
2. Select **Build PropManager installers** → **Run workflow**.
3. Optionally type a version (e.g. `1.1.0`), then **Run workflow**.
4. When the run finishes (a few minutes), open the run and download the artifacts:

| Artifact | Contains |
|---|---|
| `PropManager-installers-windows-latest` | `PropManager-Setup-x.y.z.exe` installer + a portable `.zip` |
| `PropManager-installers-macos-latest` | `.dmg` images (Apple Silicon + Intel) |
| `PropManager-installers-ubuntu-latest` | `PropManager-x.y.z.AppImage` + `.deb` |
| `PropManager-android` | Signed release `PropManager.apk` |

Artifact downloads arrive as `.zip` folders from the GitHub UI — extract them to get the installers.

### Installing the Android APK

1. Copy the APK to the phone (WhatsApp, USB, Drive …).
2. Open it → allow **Install unknown apps** for the app you used if asked.
3. PropManager installs as a normal app with its own icon and full-screen window.

The APK is a **Trusted Web Activity**: it wraps the live app at
`https://missblac.github.io/PropManager/` inside a native chrome-less container,
so it needs one brief online moment after install, then works fully offline.
It shares data with the same site opened in Chrome on that phone.

Android verifies the APK against the app's own signature via
`.well-known/assetlinks.json`, which GitHub Pages publishes automatically
from this repository. Keep the signing key and version scheme consistent
(see below) so updates overwrite cleanly.

### Signing key (important!)

The APK is signed with `signing/propmanager.jks`
(alias `propmanager`, password `PropManagerGH2026`).

- The workflow uses this file directly, so future builds stay updatable.
- **Keep your own copy of this file, plus its alias/password, somewhere safe *outside* GitHub.** Losing it means new builds can only be installed after uninstalling (all local records are lost).
- Before ever publishing to Google Play, move signing into repo **Secrets** and stop committing the keystore, since a public keystore means anyone could sign updates with your app identity.

---

## 2. Build locally (optional)

Requirements: Node.js 22+, Java 17, Android SDK command-line tools.

```bash
# Desktop app (current OS): output in dist/
npm install
npm run dist          # builds for the machine you run this on
npm run dist:linux    # or dist:win / dist:mac
npm start             # run the desktop app without packaging

# Android APK: output at twa/app-release-signed.apk
npx @bubblewrap/cli build --skipPwaValidation --directory twa
```

Local Android builds additionally need `$ANDROID_HOME` and
`~/.bubblewrap/config.json` pointing at your JDK/SDK paths.

---

## Notes

- Desktop apps simply bundle the web files; they run 100 % offline.
- The web/PWA version deployed on GitHub Pages is unchanged by all of this —
  the packaging lives in `package.json`, `electron/`, `twa/`, `build/`,
  `signing/`, `.well-known/` and `.github/workflows/build-apps.yml`.
- Bump versions via the workflow input, or edit `package.json` +
  `twa/twa-manifest.json` manually. The Android `versionCode` is stamped from
  the workflow run number so installs always update in place.
