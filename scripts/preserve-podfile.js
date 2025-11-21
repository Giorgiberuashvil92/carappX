#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const log = (...args) => {
  console.log('[preserve-podfile]', ...args);
};

const error = (...args) => {
  console.error('[preserve-podfile ERROR]', ...args);
};

const projectRoot = path.join(__dirname, '..');
const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
const podfileBackupPath = path.join(projectRoot, 'ios', 'Podfile.backup.custom');

// Check if we need to preserve (before prebuild) or restore (after prebuild)
const action = process.argv[2] || 'preserve';

if (action === 'preserve') {
  // Before prebuild: backup custom Podfile
  if (fs.existsSync(podfilePath)) {
    const podfileContent = fs.readFileSync(podfilePath, 'utf8');
    
    // Check if this is our custom Podfile (has our custom content)
    if (podfileContent.includes('$RNFirebaseAsStaticFramework') || 
        podfileContent.includes('Force modular headers for Firebase')) {
      fs.writeFileSync(podfileBackupPath, podfileContent);
      log('✅ Custom Podfile backed up to:', podfileBackupPath);
    } else {
      log('ℹ️ Podfile does not contain custom modifications, skipping backup');
    }
  } else {
    log('⚠️ Podfile not found, will be created by prebuild');
  }
} else if (action === 'restore') {
  // After prebuild: restore custom Podfile
  if (fs.existsSync(podfileBackupPath)) {
    const customPodfile = fs.readFileSync(podfileBackupPath, 'utf8');
    
    // Ensure ios directory exists
    const iosDir = path.dirname(podfilePath);
    if (!fs.existsSync(iosDir)) {
      error('❌ ios directory does not exist!');
      process.exit(1);
    }
    
    // Write our custom Podfile back
    fs.writeFileSync(podfilePath, customPodfile);
    log('✅ Custom Podfile restored from backup');
    
    // Verify it was written
    if (fs.existsSync(podfilePath)) {
      const restored = fs.readFileSync(podfilePath, 'utf8');
      if (restored.includes('$RNFirebaseAsStaticFramework')) {
        log('✅ Verified: Custom Podfile is restored correctly');
      } else {
        error('❌ Warning: Restored Podfile might not be correct!');
      }
    }
  } else {
    log('ℹ️ No custom Podfile backup found, keeping prebuild-generated Podfile');
  }
} else {
  error('❌ Unknown action:', action);
  error('Usage: node scripts/preserve-podfile.js [preserve|restore]');
  process.exit(1);
}

log('✅ preserve-podfile.js completed');

