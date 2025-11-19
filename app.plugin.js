const { withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const path = require('path');

/**
 * Expo config plugin to add legacy iOS icons to Xcode project
 * This ensures icons are included in the bundle for iOS 10 compatibility
 */
const withLegacyIcons = (config) => {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    
    // Icon files to add
    const icons = [
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
};

module.exports = (config) => {
  config = withLegacyIcons(config);
  return config;
};

