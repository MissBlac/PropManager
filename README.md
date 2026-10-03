# 🏘 PropManager — Landlord App
### Offline PWA · Built for Ghana 🇬🇭

---

## Publish This Repository

The project is hosted in [MissBlac/PropManager](https://github.com/MissBlac/PropManager). You do not need to create another repository or upload the files again.

To publish or check the live site:
1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then click **Save**.
4. Wait for GitHub Pages to finish deploying. The Pages settings show the published URL and deployment status.

The expected project-site URL is:

**https://missblac.github.io/PropManager/**

If that address returns 404, GitHub Pages is not enabled/deployed for this repository yet, or the deployment has not finished. Confirm the Pages settings and check the repository's **Actions** tab for the Pages deployment status. Once published, open the URL in your device browser to use or install PropManager.

---

## Install as an App

### On Android (Chrome)
1. Open your URL in Chrome
2. Tap the **three dots menu** (⋮)
3. Tap **"Add to Home Screen"**
4. Tap **Add**
5. The app appears on your home screen like a real app ✓

### On Windows (Chrome)
1. Open your URL in Chrome
2. Look for the **install icon** (⊕) in the address bar
3. Click it → **Install**
4. PropManager opens as a desktop app ✓

### On iPhone (Safari)
1. Open your URL in **Safari**
2. Tap the **Share button** (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add** ✓

---

## Your Data is Private
- Property, tenant, payment and settings data is stored in **your browser's localStorage**
- Signed agreements and imported PDFs/photos are stored in **your browser's IndexedDB**
- Nothing is sent to any server
- GitHub only hosts the app files, not your data
- Use **Settings → Data Backup & Restore** regularly. Backups include saved documents and can be large.
- Browser storage can be cleared by the browser/device. A backup is the way to move or recover your data on another device.

## Profiles and Appearance
- Add an owner photo and contact details in **Settings**, plus an optional tenant photo on each tenant record.
- Choose an optional app wallpaper and adjust its visibility; reset it any time to return to the default background.
- Photos and wallpaper are compressed and stored offline in this browser. Backup/restore includes them with saved documents, so use a fresh backup to transfer them to another device.
- Images and records remain device/browser-specific until you export and restore a backup. Clearing browser storage removes the local copies.

## Destructive Action Protection
- Optionally set a 4–6 digit PIN or a password of at least 8 characters in **Settings**. It is requested before **Restore Backup** or **Clear All**; everyday app use and backup export remain available without it.
- Save the one-time recovery code somewhere separate from the device. If you forget the PIN/password, choose **Forgot PIN/password?**, enter the recovery code, and set a replacement credential and recovery code.
- The safeguard is stored only in this browser and is not included in backups, so restoring a backup does not replace it. Clearing all records also leaves the safeguard enabled until you turn it off in Settings.
- Turning off destructive-action protection also turns off app lock because they share the same credential. Turning off only app lock leaves destructive-action protection enabled.
- This is an offline accidental-action deterrent, not encryption or tamper-proof security. Someone with direct access to browser storage can bypass it. Browser/site-data deletion removes both app data and the safeguard.

## Welcome and App Lock
- On first use, a short welcome explains offline storage and backups. You can skip it, enable the optional app lock, and reopen the welcome from **Settings**.
- The optional app lock shares the PIN/password and recovery code above. It adds a **Lock app** button; it locks only when you choose it and stays locked across reloads until unlocked. It does not automatically lock on every app launch.
- To unlock, enter the PIN/password; use the recovery code if needed. Disabling app lock requires the PIN/password, while destructive-action protection can remain enabled.
- App access lock is an offline privacy convenience, not encryption or tamper-proof security.

## Rent Schedules and Reminders
- Rent schedules list each lease period, amount paid, and remaining balance.
- Payments can be allocated to a selected period or automatically applied oldest-first.
- Record rent changes with their effective date; schedules and reports use the saved rate history.
- Rent and lease reminders are calculated on this device whenever the app is opened. Browsers cannot guarantee scheduled alerts while the app is closed without an online service.

## Agreements and Sharing
- Create a lease agreement from a tenant record and collect signatures on screen, or import an externally signed PDF/photo.
- Signed files are kept locally, can be downloaded or shared manually through the device share sheet, and are included in backups.
- An on-screen signature records a mark but does not independently verify identity or certify legal validity.
- Sharing to WhatsApp or another service is a user-initiated device action; the app does not connect to messaging accounts or send messages.

## Updating the App
1. Make and commit changes to the project files on the `main` branch.
2. GitHub Pages publishes the updated site from the repository's configured source. If deployment is not automatic, check **Actions** for the Pages deployment workflow/status.
3. Wait for deployment to finish, then reload the published URL. A previously installed PWA may need a moment to receive its updated app shell.

---

*PropManager · Made for Ghana 🇬🇭 · Free forever*
