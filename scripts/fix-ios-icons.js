#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const log = (...args) => {
  console.log('[fix-ios-icons]', ...args);
};

const error = (...args) => {
  console.error('[fix-ios-icons ERROR]', ...args);
  process.stderr.write('[fix-ios-icons ERROR] ' + args.join(' ') + '\n');
};

// Ignore unknown command line arguments (like --platform from EAS Build)
process.argv = process.argv.filter(arg => !arg.startsWith('--platform'));

log('🔧 fix-ios-icons.js started...');
log('📁 Working directory:', process.cwd());
log('📁 Script path:', __filename);

const projectRoot = path.join(__dirname, '..');
const sourceIconPath = path.join(projectRoot, 'assets', 'images', 'icon.png');
const canUseSips = process.platform === 'darwin';

const ensureSourceIcon = () => {
  if (!fs.existsSync(sourceIconPath)) {
    error('❌ Base icon not found at', sourceIconPath);
    return false;
  }
  return true;
};

const possibleContentsJsonPaths = [
  path.join(__dirname, '..', 'ios', 'Marte', 'Images.xcassets', 'AppIcon.appiconset', 'Contents.json'),
  path.join(__dirname, '..', 'ios', 'build', 'Marte', 'Images.xcassets', 'AppIcon.appiconset', 'Contents.json'),
  path.join(process.cwd(), 'ios', 'Marte', 'Images.xcassets', 'AppIcon.appiconset', 'Contents.json'),
  path.join(process.cwd(), 'ios', 'build', 'Marte', 'Images.xcassets', 'AppIcon.appiconset', 'Contents.json'),
];

// Standard Contents.json with all required icons
const contentsJson = {
  "images": [
    {
      "filename": "40.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "20x20"
    },
    {
      "filename": "60.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "20x20"
    },
    {
      "filename": "58.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "29x29"
    },
    {
      "filename": "87.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "29x29"
    },
    {
      "filename": "80.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "40x40"
    },
    {
      "filename": "120.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "40x40"
    },
    {
      "filename": "120.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "60x60"
    },
    {
      "filename": "180.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "60x60"
    },
    {
      "filename": "1024.png",
      "idiom": "ios-marketing",
      "scale": "1x",
      "size": "1024x1024"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
};

const requiredIconSizes = contentsJson.images.reduce((acc, imageConfig) => {
  const baseSize = parseFloat(imageConfig.size.split('x')[0]);
  const scale = parseInt(imageConfig.scale.replace('x', ''), 10);
  const pixelSize = Math.round(baseSize * scale);
  acc[imageConfig.filename] = pixelSize;
  return acc;
}, {});

const generateIconImage = (iconsetDir, filename, size) => {
  if (!ensureSourceIcon()) {
    return false;
  }

  const destinationPath = path.join(iconsetDir, filename);
  fs.mkdirSync(iconsetDir, { recursive: true });

  if (!canUseSips) {
    try {
      fs.copyFileSync(sourceIconPath, destinationPath);
      log(`⚠️ Copied base icon to ${filename} (sips unavailable on ${process.platform})`);
      return true;
    } catch (copyError) {
      error('❌ Failed to copy base icon:', copyError.message);
      return false;
    }
  }

  const result = spawnSync('sips', ['-z', size, size, sourceIconPath, '--out', destinationPath], {
    stdio: 'ignore'
  });

  if (result.status !== 0) {
    error('❌ sips failed to generate icon', filename, 'exit code:', result.status);
    return false;
  }

  return true;
};

const ensureIconImages = (iconsetDir) => {
  Object.entries(requiredIconSizes).forEach(([filename, size]) => {
    const success = generateIconImage(iconsetDir, filename, size);
    if (success) {
      log(`🖼️ Ensured ${filename} (${size}x${size}) in ${iconsetDir}`);
    }
  });
};

const processedIconsetDirs = new Set();
let contentsJsonFixed = false;
for (const contentsJsonPath of possibleContentsJsonPaths) {
  if (fs.existsSync(contentsJsonPath)) {
    // Also check if the directory exists
    const dirPath = path.dirname(contentsJsonPath);
    if (fs.existsSync(dirPath) && !processedIconsetDirs.has(dirPath)) {
      fs.writeFileSync(contentsJsonPath, JSON.stringify(contentsJson, null, 2));
      log('✅ Fixed Contents.json at:', contentsJsonPath);
      contentsJsonFixed = true;
      processedIconsetDirs.add(dirPath);

      ensureIconImages(dirPath);
      
      // Verify it was written correctly
      const verifyContent = JSON.parse(fs.readFileSync(contentsJsonPath, 'utf8'));
      const has120x120 = verifyContent.images.some(img => 
        img.idiom === 'iphone' && 
        img.size === '60x60' && 
        img.scale === '2x' &&
        img.filename === '120.png'
      );
      if (has120x120) {
        log('✅ Verified: Contents.json has required 120x120 icon (60x60@2x)');
      } else {
        error('❌ Warning: Contents.json might be missing 120x120 icon');
      }
    }
  }
}

if (!contentsJsonFixed) {
  log('⚠️ Contents.json not found at any of the expected paths:', possibleContentsJsonPaths);
  log('⚠️ This is OK if running before prebuild');
}

// Fix Info.plist to ensure CFBundleIconName is set
// Try multiple possible paths for Info.plist
const possibleInfoPlistPaths = [
  path.join(__dirname, '..', 'ios', 'Marte', 'Info.plist'),
  path.join(__dirname, '..', 'ios', 'build', 'Marte', 'Info.plist'),
  path.join(process.cwd(), 'ios', 'Marte', 'Info.plist'),
  path.join(process.cwd(), 'ios', 'build', 'Marte', 'Info.plist'),
];

let infoPlistPath = null;
for (const possiblePath of possibleInfoPlistPaths) {
  if (fs.existsSync(possiblePath)) {
    infoPlistPath = possiblePath;
    break;
  }
}

if (infoPlistPath) {
  let plistContent = fs.readFileSync(infoPlistPath, 'utf8');
  let modified = false;
  
  // Always ensure CFBundleIconName exists and is correct
  const iconNamePattern = /<key>CFBundleIconName<\/key>\s*<string>[^<]*<\/string>/;
  const hasIconName = iconNamePattern.test(plistContent);
  const hasCorrectIconName = /<key>CFBundleIconName<\/key>\s*<string>AppIcon<\/string>/.test(plistContent);
  
  if (!hasIconName || !hasCorrectIconName) {
    if (hasIconName) {
      // Replace existing with correct value
      plistContent = plistContent.replace(
        iconNamePattern,
        '<key>CFBundleIconName</key>\n    <string>AppIcon</string>'
      );
    } else {
      // Insert after CFBundleVersion or after CFBundleExecutable if CFBundleVersion not found
      const afterVersionPattern = /(<key>CFBundleVersion<\/key>\s*<string>[^<]+<\/string>)/;
      const afterExecutablePattern = /(<key>CFBundleExecutable<\/key>\s*<string>[^<]+<\/string>)/;
      
      if (afterVersionPattern.test(plistContent)) {
        plistContent = plistContent.replace(
          afterVersionPattern,
          `$1\n    <key>CFBundleIconName</key>\n    <string>AppIcon</string>`
        );
      } else if (afterExecutablePattern.test(plistContent)) {
        plistContent = plistContent.replace(
          afterExecutablePattern,
          `$1\n    <key>CFBundleIconName</key>\n    <string>AppIcon</string>`
        );
      } else {
        // Last resort: insert after CFBundleDisplayName
        const afterDisplayNamePattern = /(<key>CFBundleDisplayName<\/key>\s*<string>[^<]+<\/string>)/;
        if (afterDisplayNamePattern.test(plistContent)) {
          plistContent = plistContent.replace(
            afterDisplayNamePattern,
            `$1\n    <key>CFBundleIconName</key>\n    <string>AppIcon</string>`
          );
        }
      }
    }
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(infoPlistPath, plistContent);
    log('✅ Fixed CFBundleIconName in Info.plist at:', infoPlistPath);
    
    // Verify it was written correctly
    const verifyContent = fs.readFileSync(infoPlistPath, 'utf8');
    if (verifyContent.includes('<key>CFBundleIconName</key>') && 
        verifyContent.includes('<string>AppIcon</string>')) {
      log('✅ Verified: CFBundleIconName is correctly set to AppIcon');
    } else {
      error('❌ Failed to set CFBundleIconName correctly!');
      process.exit(1);
    }
  } else {
    log('✅ CFBundleIconName already exists and is correct in Info.plist at:', infoPlistPath);
  }
} else {
  log('⚠️ Info.plist not found at any of the expected paths:', possibleInfoPlistPaths);
  log('⚠️ This is OK if running before prebuild');
}

log('✅ fix-ios-icons.js completed');

