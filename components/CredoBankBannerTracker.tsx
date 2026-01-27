import { useEffect, useRef } from 'react';
import { View } from 'react-native';

interface CredoBankBannerTrackerProps {
  onView: () => void;
}

export default function CredoBankBannerTracker({ onView }: CredoBankBannerTrackerProps) {
  const viewTimeRef = useRef<number | null>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    // Track view when component mounts (banner is visible)
    if (!hasTrackedView.current) {
      viewTimeRef.current = Date.now();
      onView();
      hasTrackedView.current = true;
    }

    return () => {
      // Track time spent when component unmounts (banner is no longer visible)
      if (viewTimeRef.current) {
        const durationSeconds = Math.round((Date.now() - viewTimeRef.current) / 1000);
        if (durationSeconds > 0) {
          // Import analytics service dynamically to avoid circular dependencies
          import('../services/analytics').then(({ analyticsService }) => {
            analyticsService.logCredoBankBannerTimeSpent(durationSeconds);
          }).catch(() => {
            // Silently fail
          });
        }
      }
    };
  }, [onView]);

  return null;
}
