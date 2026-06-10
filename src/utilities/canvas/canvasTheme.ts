import { RankingColors } from './canvasTypes';

/*
  Theme + color helpers shared across the canvas styles.
*/

// Helper function to get CSS variable value
export const getCSSVariable = (variableName: string, fallback: string): string => {
  if (typeof window === 'undefined' || !document.documentElement) {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return value || fallback;
};

// Function to get theme colors from CSS variables
export const getThemeColors = (): RankingColors => {
  return {
    background: getCSSVariable('--er-body-bg', '#0d0f1d'),
    backgroundGradient: [
      getCSSVariable('--er-body-bg', '#0d0f1d'),
      getCSSVariable('--er-ranked-bg-end', '#28315b'),
      getCSSVariable('--er-body-bg', '#0d0f1d')
    ],
    headerGradient: [
      getCSSVariable('--er-nav-gradient-start', '#13172b'),
      getCSSVariable('--er-nav-gradient-end', '#334678')
    ],
    cardBackground: getCSSVariable('--er-surface-tertiary', '#03022d'),
    titleText: getCSSVariable('--er-text-primary', '#e2e8f0'),
    rankText: '#FFFFFF',
    artistText: getCSSVariable('--er-text-primary', '#e2e8f0'),
    songText: getCSSVariable('--er-text-secondary', '#cbd5e1'),
    footerText: getCSSVariable('--er-text-tertiary', '#a7b9d2'),
    shadow: 'rgba(0, 0, 0, 0.3)',
    rankBoxColor: getCSSVariable('--er-nav-gradient-end', '#334678'),
    flagBoxColor: getCSSVariable('--er-surface-accent', '#1c214c'),
  };
};

export const getColorForCountryCode = (countryKey: string): string => {
  const colorMap: Record<string, string> = {
    'al': '#dc3545', 'am': '#dc3545', 'au': '#28a745', 'at': '#dc3545',
    'az': '#17a2b8', 'be': '#000000', 'hr': '#dc3545', 'cy': '#ffc107',
    'cz': '#fd7e14', 'dk': '#343a40', 'ee': '#6f42c1', 'fi': '#28a745',
    'fr': '#0d6efd', 'ge': '#dc3545', 'de': '#6c757d', 'gr': '#28a745',
    'is': '#fd7e14', 'ie': '#28a745', 'il': '#28a745', 'it': '#28a745',
    'lv': '#6f42c1', 'lt': '#ffc107', 'lu': '#dc3545', 'mt': '#28a745',
    'me': '#6c757d', 'nl': '#fd7e14', 'no': '#dc3545', 'pl': '#6c757d',
    'pt': '#28a745', 'sm': '#28a745', 'rs': '#dc3545', 'si': '#28a745',
    'es': '#6f42c1', 'se': '#28a745', 'ch': '#6f42c1', 'ua': '#28a745',
    'gb': '#28a745', 'uk': '#28a745'
  };

  if (colorMap[countryKey.toLowerCase()]) {
    return colorMap[countryKey.toLowerCase()];
  }

  let hash = 0;
  for (let i = 0; i < countryKey.length; i++) {
    hash = countryKey.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + Math.min(Math.max(value, 60), 200).toString(16)).slice(-2);
  }
  return color;
};
