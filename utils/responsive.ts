import { Dimensions, Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Check if device is a tablet
 */
export function isTablet(): boolean {
  if (Platform.OS === 'ios') {
    // Use Device.isTablet for iOS
    return Device.deviceType === Device.DeviceType.TABLET;
  } else if (Platform.OS === 'android') {
    // For Android, check screen size
    const { width, height } = Dimensions.get('window');
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const smallestWidth = Math.min(width, height);
    // Consider device as tablet if smallest width >= 600dp (tablet threshold)
    return smallestWidth >= 600;
  }
  return false;
}

/**
 * Get responsive dimensions with max width constraint for tablets
 */
export function getResponsiveDimensions() {
  const { width, height } = Dimensions.get('window');
  const tablet = isTablet();
  
  // Max content width for tablets (similar to many apps)
  const MAX_CONTENT_WIDTH = 768;
  
  // For tablets, limit content width and center it
  const contentWidth = tablet 
    ? Math.min(width, MAX_CONTENT_WIDTH)
    : width;
  
  return {
    screenWidth: width,
    screenHeight: height,
    contentWidth,
    isTablet: tablet,
    // Calculate margins for centering on tablet
    horizontalMargin: tablet ? (width - contentWidth) / 2 : 0,
  };
}

/**
 * Get responsive card width for grid layouts
 * @param columns - Number of columns in grid
 * @param gap - Gap between items
 * @param padding - Container padding
 */
export function getResponsiveCardWidth(
  columns: number = 2,
  gap: number = 16,
  padding: number = 20
): number {
  const { contentWidth, isTablet } = getResponsiveDimensions();
  
  // For tablets, use more columns if screen is wide
  const adjustedColumns = isTablet && contentWidth > 600 
    ? Math.min(columns + 1, 4) 
    : columns;
  
  const totalPadding = padding * 2;
  const totalGap = gap * (adjustedColumns - 1);
  return (contentWidth - totalPadding - totalGap) / adjustedColumns;
}

/**
 * Responsive font size multiplier
 */
export function getFontScale(): number {
  const tablet = isTablet();
  return tablet ? 1.1 : 1.0;
}




