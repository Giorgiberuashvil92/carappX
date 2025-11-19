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
    
    // Add legacy icon files if not present (Hacking with Swift approach)
    // Note: CFBundleIconFiles should contain only the base name without @2x/@3x or extension
    const iconFiles = plist.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles;
    if (!iconFiles.includes('Icon')) {
      iconFiles.push('Icon');
    }
    // Also ensure UIPrerenderedIcon is set
    if (plist.CFBundleIcons.CFBundlePrimaryIcon.UIPrerenderedIcon === undefined) {
      plist.CFBundleIcons.CFBundlePrimaryIcon.UIPrerenderedIcon = false;
    }
    
    // Ensure CFBundleIcons~ipad exists (Apple Developer Forums approach)
    if (!plist['CFBundleIcons~ipad']) {
      plist['CFBundleIcons~ipad'] = {};
    }
    if (!plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon) {
      plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon = {};
    }
    if (!plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.CFBundleIconFiles) {
      plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.CFBundleIconFiles = [];
    }
    
    // Add iPad icon files if not present (use base name "Icon" for ~ipad variants)
    const ipadIconFiles = plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.CFBundleIconFiles;
    if (!ipadIconFiles.includes('Icon')) {
      ipadIconFiles.push('Icon');
    }
    // Also ensure UIPrerenderedIcon is set for iPad
    if (plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.UIPrerenderedIcon === undefined) {
      plist['CFBundleIcons~ipad'].CFBundlePrimaryIcon.UIPrerenderedIcon = false;
    }
    
    return config;
  });
  
  // Then, add icons to Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    
    // Icon files to add (Apple Developer Forums 2022 approach)
    // iPhone: Icon@2x.png (120x120), Icon@3x.png (180x180)
    // iPad: Icon@2x~ipad.png (152x152), Icon@3x~ipad.png (167x167)
    // Note: Icon.png (1x) is not needed for iOS 10+
    const icons = [
      'Icon@2x.png',
      'Icon@3x.png',
      'Icon@2x~ipad.png',
      'Icon@3x~ipad.png',
    ];

    // Find the main group
    const mainGroup = project.findPBXGroupKey({ name: 'Marte' }) || project.getFirstProject().firstProject.mainGroup;

    icons.forEach((iconName) => {
      const iconPath = `Marte/${iconName}`;
      
      // Always add/update file reference to ensure it's in the project
      // Check if file already exists in project
      let fileRef = project.findFirst('fileRef', (ref) => {
        const file = project.getPBXFileByKey(ref);
        return file && file.path === iconName;
      });
      
      if (!fileRef) {
        // Add file reference
        fileRef = project.addFile(iconPath, mainGroup, {
          lastKnownFileType: 'image.png',
          name: iconName,
        });
      }

      if (fileRef) {
        // Always add to Resources build phase (even if already exists, this is idempotent)
        const targetUuid = project.getFirstTarget().uuid;
        project.addToPbxResourcesBuildPhase(fileRef, targetUuid);
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

