# 🏘 PropManager — Landlord App
### Offline PWA · Built for Ghana 🇬🇭

---

## How to Deploy (5 Minutes)

### Step 1 — Create a GitHub Account
Go to https://github.com and sign up for a free account.

### Step 2 — Create a New Repository
1. Click the **+** button (top right) → **New repository**
2. Name it: `propmanager` (or anything you like)
3. Set it to **Public**
4. Click **Create repository**

### Step 3 — Upload Your Files
1. On the repository page, click **uploading an existing file**
2. Drag and drop ALL files from this folder:
   - index.html
   - manifest.json
   - sw.js
   - icon.svg
   - icon-192.png
   - icon-512.png
3. Click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Click **Settings** (in your repository)
2. Click **Pages** (left sidebar)
3. Under "Source" select **Deploy from a branch**
4. Set Branch to **main** and folder to **/ (root)**
5. Click **Save**

### Step 5 — Get Your URL
Wait 1–2 minutes, then your app is live at:
```
https://YOUR-USERNAME.github.io/propmanager/
```

Open that URL in Chrome on your phone or computer.

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
1. Make changes to `index.html`
2. Go to your GitHub repository
3. Click on `index.html` → click pencil icon → paste new content
4. Or drag and drop the new file to replace it
5. Changes go live in 1–2 minutes

---

*PropManager · Made for Ghana 🇬🇭 · Free forever*
