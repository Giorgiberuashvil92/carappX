const { withInfoPlist, withDangerousMod, withXcodeProject } = require('expo/config-plugins')
const path = require('path');

const withAppIconName = (config) => {
  // First, ensure CFBundleIconName is in Info.plist - ALWAYS set it
  config = withInfoPlist(config, (config) => {
    // Always ensure CFBundleIconName is set to AppIcon (even if it exists)
    config.modResults.CFBundleIconName = 'AppIcon';
    return config;
  });

  // Then, fix Contents.json AND Info.plist after expo-asset runs (must be after expo-asset)
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      
      // Fix Contents.json
      const contentsJsonPath = path.join(
        platformRoot,
        'Marte',
        'Images.xcassets',
        'AppIcon.appiconset',
        'Contents.json'
      );
      
      if (fs.existsSync(contentsJsonPath)) {
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
        
        fs.writeFileSync(contentsJsonPath, JSON.stringify(contentsJson, null, 2));
      }
      
      // Fix Info.plist - ALWAYS ensure CFBundleIconName is set correctly
      const infoPlistPath = path.join(platformRoot, 'Marte', 'Info.plist');
      if (fs.existsSync(infoPlistPath)) {
        let plistContent = fs.readFileSync(infoPlistPath, 'utf8');
        let modified = false;
        
        // Check if CFBundleIconName exists and is correct
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
            }
          }
          modified = true;
        }
        
        if (modified) {
          fs.writeFileSync(infoPlistPath, plistContent);
        }
      }
      
      return config;
    }
  ]);

  return config;
};

module.exports = withAppIconName;

