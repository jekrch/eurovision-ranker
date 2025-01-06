// src/components/CookieConsent/CookieConsent.tsx
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppState } from '../redux/store';
import { loadCookieConsent, saveCookieConsent } from '../utilities/cookiesStorage';
import { initializeAnalytics } from '../utilities/analytics';
import { useAppSelector } from '../hooks/stateHooks';
import { setConsent } from '../redux/rootSlice';

export const CookieConsent: React.FC = () => {
  const dispatch = useDispatch();
  const { consent, isOpen } = useAppSelector((state: AppState) => state.cookieConsent);

  useEffect(() => {
    const storedConsent = loadCookieConsent();
    if (storedConsent) {
      dispatch(setConsent(storedConsent));
      initializeAnalytics(storedConsent.analytics);
      dispatch(setConsent(storedConsent));
    }
  }, [dispatch]);

  const handleAcceptAll = () => {
    const newConsent = {
      analytics: true,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    dispatch(setConsent(newConsent));
    saveCookieConsent(newConsent);
    initializeAnalytics(true);
  };

  const handleAcceptNecessary = () => {
    const newConsent = {
      analytics: false,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    dispatch(setConsent(newConsent));
    saveCookieConsent(newConsent);
    initializeAnalytics(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-slate-700 shadow-lg p-4 border-t border-gray-800 z-[5000] animate-fade-up"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            We use cookies to enhance your experience. By continuing to visit this site, you agree to our use of cookies.
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleAcceptNecessary}
              className="px-4 py-2 text-sm text-gray-200 border border-gray-300 rounded-md hover:bg-gray-500"
            >
              Accept Necessary
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};