import { Country } from "./Country";

// Each country's `key` is a lowercase alpha-2 code that must have a matching
// SVG in src/assets/flags/, so adding a country requires dropping its flag there.
//
// Ids are encoded into shared ranking URLs, so an id must never be renumbered
// or reused. New countries take an unused two-char `.x` id.

// Countries that have competed in the traditional contest (ESC).
export const escCountries: Country[] = [
  { id: 'a', name: 'Albania', key: 'al', icon: 'flag-icon-al' },
  { id: '.p', name: 'Andorra', key: 'ad', icon: 'flag-icon-ad' },
  { id: 'b', name: 'Armenia', key: 'am', icon: 'flag-icon-am' },
  { id: 'c', name: 'Australia', key: 'au', icon: 'flag-icon-au' },
  { id: '.d', name: 'Austria', key: 'at', icon: 'flag-icon-at' },
  { id: '.e', name: 'Azerbaijan', key: 'az', icon: 'flag-icon-az' },
  { id: '.f', name: 'Belarus', key: 'by', icon: 'flag-icon-by' },
  { id: '.g', name: 'Belgium', key: 'be', icon: 'flag-icon-be' },
  { id: '.h', name: 'Bulgaria', key: 'bg', icon: 'flag-icon-bg' },
  { id: '.m', name: 'Bosnia & Herzegovina', key: 'ba', icon: 'flag-icon-ba' },
  { id: 'i', name: 'Croatia', key: 'hr', icon: 'flag-icon-hr' },
  { id: 'j', name: 'Cyprus', key: 'cy', icon: 'flag-icon-cy' },
  { id: 'k', name: 'Czechia', key: 'cz', icon: 'flag-icon-cz' },
  { id: 'l', name: 'Denmark', key: 'dk', icon: 'flag-icon-dk' },
  { id: 'm', name: 'Estonia', key: 'ee', icon: 'flag-icon-ee' },
  { id: 'n', name: 'Finland', key: 'fi', icon: 'flag-icon-fi' },
  { id: 'o', name: 'France', key: 'fr', icon: 'flag-icon-fr' },
  { id: 'p', name: 'Georgia', key: 'ge', icon: 'flag-icon-ge' },
  { id: 'q', name: 'Germany', key: 'de', icon: 'flag-icon-de' },
  { id: 'r', name: 'Greece', key: 'gr', icon: 'flag-icon-gr' },
  { id: 's', name: 'Hungary', key: 'hu', icon: 'flag-icon-hu' },
  { id: 't', name: 'Iceland', key: 'is', icon: 'flag-icon-is' },
  { id: 'u', name: 'Ireland', key: 'ie', icon: 'flag-icon-ie' },
  { id: 'v', name: 'Israel', key: 'il', icon: 'flag-icon-il' },
  { id: 'w', name: 'Italy', key: 'it', icon: 'flag-icon-it' },
  { id: 'x', name: 'Latvia', key: 'lv', icon: 'flag-icon-lv' },
  { id: 'y', name: 'Lithuania', key: 'lt', icon: 'flag-icon-lt' },
  { id: 'z', name: 'Luxembourg', key: 'lu', icon: 'flag-icon-lu' },
  { id: '0', name: 'Malta', key: 'mt', icon: 'flag-icon-mt' },
  { id: '1', name: 'Moldova', key: 'md', icon: 'flag-icon-md' },
  { id: '2', name: 'Montenegro', key: 'me', icon: 'flag-icon-me' },
  { id: '.i', name: 'Monaco', key: 'mc', icon: 'flag-icon-mc' },
  { id: '.l', name: 'Morocco', key: 'ma', icon: 'flag-icon-ma' },
  { id: '3', name: 'Netherlands', key: 'nl', icon: 'flag-icon-nl' },
  { id: '4', name: 'Norway', key: 'no', icon: 'flag-icon-no' },
  { id: '5', name: 'North Macedonia', key: 'mk', icon: 'flag-icon-mk' },
  { id: '6', name: 'Poland', key: 'pl', icon: 'flag-icon-pl' },
  { id: '7', name: 'Portugal', key: 'pt', icon: 'flag-icon-pt' },
  { id: '8', name: 'Romania', key: 'ro', icon: 'flag-icon-ro' },
  { id: '9', name: 'Russia', key: 'ru', icon: 'flag-icon-ru' },
  { id: '.a', name: 'San Marino', key: 'sm', icon: 'flag-icon-sm' },
  { id: '.b', name: 'Serbia', key: 'rs', icon: 'flag-icon-rs' },
  { id: '.o', name: 'Serbia & Montenegro', key: 'cs', icon: 'flag-icon-cs' },
  { id: '.c', name: 'Slovenia', key: 'si', icon: 'flag-icon-si' },
  { id: '.n', name: 'Slovakia', key: 'sk', icon: 'flag-icon-sk' },
  { id: 'd', name: 'Spain', key: 'es', icon: 'flag-icon-es' },
  { id: 'e', name: 'Sweden', key: 'se', icon: 'flag-icon-se' },
  { id: 'f', name: 'Switzerland', key: 'ch', icon: 'flag-icon-ch' },
  { id: '.k', name: 'Turkey', key: 'tr', icon: 'flag-icon-tr' },
  { id: 'g', name: 'Ukraine', key: 'ua', icon: 'flag-icon-ua' },
  { id: 'h', name: 'United Kingdom', key: 'gb', icon: 'flag-icon-gb' },
  { id: '.j', name: 'Yugoslavia', key: 'yu', icon: 'flag-icon-yu' },
];

// Eurovision Song Contest Asia participants that have never competed in ESC.
// A country in both contests keeps its single entry in escCountries.
export const asiaOnlyCountries: Country[] = [
  { id: '.q', name: 'Bangladesh', key: 'bd', icon: 'flag-icon-bd' },
  { id: '.r', name: 'Bhutan', key: 'bt', icon: 'flag-icon-bt' },
  { id: '.s', name: 'Cambodia', key: 'kh', icon: 'flag-icon-kh' },
  { id: '.t', name: 'Laos', key: 'la', icon: 'flag-icon-la' },
  { id: '.u', name: 'Malaysia', key: 'my', icon: 'flag-icon-my' },
  { id: '.v', name: 'Mongolia', key: 'mn', icon: 'flag-icon-mn' },
  { id: '.w', name: 'Nepal', key: 'np', icon: 'flag-icon-np' },
  { id: '.x', name: 'Philippines', key: 'ph', icon: 'flag-icon-ph' },
  { id: '.y', name: 'South Korea', key: 'kr', icon: 'flag-icon-kr' },
  { id: '.z', name: 'Thailand', key: 'th', icon: 'flag-icon-th' },
  { id: '.0', name: 'Vietnam', key: 'vn', icon: 'flag-icon-vn' },
];

// Every country of every contest. Ids and keys are unique across the lot.
export const countries: Country[] = [...escCountries, ...asiaOnlyCountries];
