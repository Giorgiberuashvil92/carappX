const { withXcodeProject, withInfoPlist } = require('@expo/config-plugins');
const path = require('path');

/**
 * Expo config plugin to add legacy iOS icons to Xcode project
 * This ensures icons are included in the bundle for iOS 10 compatibility
 */
const withLegacyIcons = (config) => {
  // First, ensure Info.plist has CFBundleIconFiles
  config = withInfoPlist(config, (config) => {
    const plist = config.modResults;
    
    // Ensure CFBundleIconName exists
    if (!plist.CFBundleIconName) {
      plist.CFBundleIconName = 'AppIcon';
    }
    
    // Ensure CFBundleIcons exists with legacy icon files
    if (!plist.CFBundleIcons) {
      plist.CFBundleIcons = {};
    }
    if (!plist.CFBundleIcons.CFBundlePrimaryIcon) {
      plist.CFBundleIcons.CFBundlePrimaryIcon = {};
    }
    if (!plist.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles) {
      plist.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles = [];
    }
    
    // Add legacy icon files if not present (both naming conventions)
    const iconFiles = plist.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles;
    if (!iconFiles.includes('Icon')) {
      iconFiles.push('Icon');
    }
    if (!iconFiles.includes('Icon@2x')) {
      iconFiles.push('Icon@2x');
    }
    if (!iconFiles.includes('Icon@3x')) {
      iconFiles.push('Icon@3x');
    }
    if (!iconFiles.includes('Icon-60@2x')) {
      iconFiles.push('Icon-60@2x');
    }
    if (!iconFiles.includes('Icon-60@3x')) {
      iconFiles.push('Icon-60@3x');
    }
    
    // Ensure CFBundleIcons~ipad exists
    if (!plist['CFBundleIcons~ipad']) {
      plist['CFBundleIcons~ipad'] = {};
    }
    if (!plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon) {
      plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon = {};
    }
    if (!plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.CFBundleIconFiles) {
      plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.CFBundleIconFiles = [];
    }
    
    // Add iPad icon files if not present
    const ipadIconFiles = plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.CFBundleIconFiles;
    if (!ipadIconFiles.includes('Icon-76@2x')) {
      ipadIconFiles.push('Icon-76@2x');
    }
    if (!ipadIconFiles.includes('Icon-83.5@2x')) {
      ipadIconFiles.push('Icon-83.5@2x');
    }
    
    return config;
  });
  
  // Then, add icons to Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    
    // Icon files to add (both legacy and modern naming)
    const icons = [
      'Icon.png',
      'Icon@2x.png',
      'Icon@3x.png',
      'Icon-60@2x.png',
      'Icon-60@3x.png',
      'Icon-76@2x.png',
      'Icon-83.5@2x.png',
    ];

    // Find the main group
    const mainGroup = project.findPBXGroupKey({ name: 'Marte' }) || project.getFirstProject().firstProject.mainGroup;

    icons.forEach((iconName) => {
      const iconPath = `Marte/${iconName}`;
      
      // Check if file already exists in project
      const fileExists = project.hasFile(iconPath);
      
      if (!fileExists) {
        // Add file reference
        const fileRef = project.addFile(iconPath, mainGroup, {
          lastKnownFileType: 'image.png',
          name: iconName,
        });

        if (fileRef) {
          // Add to Resources build phase
          const targetUuid = project.getFirstTarget().uuid;
          project.addToPbxResourcesBuildPhase(fileRef, targetUuid);
        }
      }
    });

    return config;
  });
  
  return config;
};

module.exports = (config) => {
  config = withLegacyIcons(config);
  return config;
};

