import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { analyticsService } from '../services/analytics';

export default function SessionTracker() {
  const { user } = useUser();
  const sessionStartTime = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Start session when component mounts
    const startTime = analyticsService.logSessionStart(user?.id);
    sessionStartTime.current = startTime;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // When app goes to background, end session
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (sessionStartTime.current) {
          analyticsService.logSessionEnd(user?.id, sessionStartTime.current);
          sessionStartTime.current = null;
        }
      }
      
      // When app comes to foreground, start new session
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const newStartTime = analyticsService.logSessionStart(user?.id);
        sessionStartTime.current = newStartTime;
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // End session when component unmounts
      if (sessionStartTime.current) {
        analyticsService.logSessionEnd(user?.id, sessionStartTime.current);
      }
      subscription?.remove();
    };
  }, [user?.id]);

  return null;
}
