
export const initializeAnalytics = (analyticsConsent: boolean): void => {
    if (analyticsConsent) {
      // initialize Google Analytics
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    } else {
      // disable Google Analytics
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  };
  