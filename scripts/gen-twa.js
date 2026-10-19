#!/usr/bin/env node
/**
 * Generates the TWA (Trusted Web Activity / Android) project in ./twa
 * from the live web manifest at https://missblac.github.io/PropManager/,
 * completely non-interactively (no prompts).
 *
 * Usage: node scripts/gen-twa.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const APP_URL = 'https://missblac.github.io/PropManager';
const CORE = require('@bubblewrap/core');
const CLI_SHARED = require('@bubblewrap/cli/dist/lib/cmds/shared.js');

async function main() {
  const targetDirectory = path.resolve(process.cwd(), 'twa');
  if (!fs.existsSync(targetDirectory)) fs.mkdirSync(targetDirectory, { recursive: true });

  // Download and inspect the live web manifest, exactly like `bubblewrap init`.
  const twaManifest = await CORE.TwaManifest.fromWebManifest(`${APP_URL}/manifest.json`);

  // Project-specific settings ------------------------------------------------
  twaManifest.packageId = 'com.missblac.propmanager';     // Android package name
  twaManifest.launcherName = 'PropManager';              // Icon label on the phone
  twaManifest.appVersionCode = 1;                        // Bumped by CI on every build
  twaManifest.appVersionName = '1.0.0';                  // Matching package.json
  twaManifest.minSdkVersion = 23;                        // Android 6.0+ (older phone support)
  twaManifest.signingKey.path = '../signing/propmanager.jks';
  twaManifest.signingKey.alias = 'propmanager';
  twaManifest.shortcuts = [];                            // Web shortcuts use SVG icons; skip on Android
  twaManifest.enableNotifications = true;                // Delegated web notification support (POST_NOTIFICATIONS + DelegationService)
  if (!/^.*\.(png|jpg|jpeg|webp)$/.test(twaManifest.iconUrl || '')) {
    twaManifest.iconUrl = `${APP_URL}/icon-512.png`;
  }

  await twaManifest.saveToFile(path.join(targetDirectory, 'twa-manifest.json'));

  // Generate the full Android/Gradle project (template is bundled with the library).
  const generator = new CORE.TwaGenerator();
  await generator.createTwaProject(targetDirectory, twaManifest);

  // The CLI writes this checksum used to detect manifest changes.
  await CLI_SHARED.generateManifestChecksumFile(
    path.join(targetDirectory, 'twa-manifest.json'),
    targetDirectory
  );

  console.log('TWA project generated at', targetDirectory);
}

main().catch((err) => {
  console.error('GENERATION FAILED:', err.message);
  process.exit(1);
});
