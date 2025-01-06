const COOKIE_CONSENT_KEY = 'eurovision-ranker-cookie-consent';

export interface CookieConsent {
    analytics: boolean;
    necessary: boolean;
    timestamp: string;
  }

export interface CookieConsentState {
  consent: CookieConsent | null;
  isOpen: boolean;
}

export const saveCookieConsent = (consent: CookieConsent): void => {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
};

export const loadCookieConsent = (): CookieConsent | null => {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  return stored ? JSON.parse(stored) : null;
};
