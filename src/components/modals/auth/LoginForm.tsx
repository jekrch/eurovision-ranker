import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

import { AuthErrorBox, IconInput } from './AuthFormElements';
import { primaryBtn } from './authStyles';
import { AuthTab } from './authTypes';

type LoginFormProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  authError: string | null | undefined;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  switchTab: (tab: AuthTab) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  authError,
  loading,
  onSubmit,
  switchTab,
}) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <IconInput
      icon={faEnvelope}
      type="email"
      placeholder="Email address"
      autoComplete="email"
      value={email}
      onChange={setEmail}
    />
    <IconInput
      icon={faLock}
      type="password"
      placeholder="Password"
      autoComplete="current-password"
      value={password}
      onChange={setPassword}
    />

    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => switchTab('reset')}
        className="text-xs text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] transition-colors"
      >
        Forgot password?
      </button>
    </div>

    <AuthErrorBox error={authError} />

    <button type="submit" disabled={loading} className={primaryBtn}>
      {loading ? 'Signing in…' : 'Sign In'}
    </button>
  </form>
);

export default LoginForm;
