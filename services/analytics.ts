import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  private isEnabled = true;

  // Initialize analytics
  async initialize() {
    try {
      await analytics().setAnalyticsCollectionEnabled(true);
      console.log('✅ Firebase Analytics initialized');
    } catch (error) {
      console.error('❌ Error initializing Analytics:', error);
      this.isEnabled = false;
    }
  }

  // Log screen view (fire-and-forget for performance)
  logScreenView(screenName: string, screenClass?: string) {
    if (!this.isEnabled) return;
    analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    }).catch(() => {
    });
  }

  // Log custom event (fire-and-forget for performance)
  logEvent(eventName: string, params?: Record<string, any>) {
    if (!this.isEnabled) return;
    // Fire and forget - don't block UI
    analytics().logEvent(eventName, params).catch(() => {
      // Silently fail - analytics should never block the app
    });
  }

  // Set user properties (fire-and-forget for performance)
  setUserProperties(properties: Record<string, string>) {
    if (!this.isEnabled) return;
    // Fire and forget - don't block UI
    Promise.all(
      Object.entries(properties).map(([key, value]) =>
        analytics().setUserProperty(key, value)
      )
    ).catch(() => {
      // Silently fail - analytics should never block the app
    });
  }

  // Set user ID (fire-and-forget for performance)
  setUserId(userId: string) {
    if (!this.isEnabled) return;
    // Fire and forget - don't block UI
    analytics().setUserId(userId).catch(() => {
      // Silently fail - analytics should never block the app
    });
  }

  // Reset analytics (on logout) - fire-and-forget
  reset() {
    if (!this.isEnabled) return;
    // Fire and forget - don't block UI
    analytics().resetAnalyticsData().catch(() => {
      // Silently fail - analytics should never block the app
    });
  }

  // Predefined events for common actions
  
  // Service events (all fire-and-forget)
  logServiceViewed(serviceId: string, serviceName: string, category: string) {
    this.logEvent('service_viewed', {
      service_id: serviceId,
      service_name: serviceName,
      category: category,
    });
  }

  logServiceSearched(searchQuery: string, resultsCount: number) {
    this.logEvent('service_searched', {
      search_term: searchQuery,
      results_count: resultsCount,
    });
  }

  // Booking events
  logBookingCreated(bookingId: string, serviceType: string, price?: number) {
    this.logEvent('booking_created', {
      booking_id: bookingId,
      service_type: serviceType,
      value: price,
      currency: 'GEL',
    });
  }

  logBookingCancelled(bookingId: string, serviceType: string) {
    this.logEvent('booking_cancelled', {
      booking_id: bookingId,
      service_type: serviceType,
    });
  }

  // Parts events
  logPartViewed(partId: string, partName: string, category: string) {
    this.logEvent('part_viewed', {
      part_id: partId,
      part_name: partName,
      category: category,
    });
  }

  logPartSearched(searchQuery: string, resultsCount: number) {
    this.logEvent('part_searched', {
      search_term: searchQuery,
      results_count: resultsCount,
    });
  }

  // User events
  logUserRegistered(userId: string, method: string) {
    this.logEvent('sign_up', {
      method: method,
    });
    this.setUserId(userId);
  }

  logUserLogin(userId: string, method: string) {
    this.logEvent('login', {
      method: method,
    });
    this.setUserId(userId);
  }

  // Call events
  logCallInitiated(phoneNumber: string, serviceType: string) {
    this.logEvent('call_initiated', {
      phone_number: phoneNumber.replace(/\d/g, '*'), // Privacy: mask phone
      service_type: serviceType,
    });
  }

  // Navigation events
  logNavigation(from: string, to: string) {
    this.logEvent('navigation', {
      from_screen: from,
      to_screen: to,
    });
  }

  // Filter events
  logFilterApplied(filterType: string, filterValue: string) {
    this.logEvent('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }

  // Share events
  logShare(contentType: string, itemId: string) {
    this.logEvent('share', {
      content_type: contentType,
      item_id: itemId,
    });
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

