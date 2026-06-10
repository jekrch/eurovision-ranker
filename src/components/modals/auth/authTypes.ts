export type AuthTab = 'login' | 'reset' | 'register';
export type AuthView =
  | { tab: 'login' }
  | { tab: 'reset'; step: 1 | 2; token?: string }
  | { tab: 'register'; step: 1 | 2; token?: string };
