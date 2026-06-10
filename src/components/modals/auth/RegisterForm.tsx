import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

import { AuthErrorBox, EmailSentNotice, IconInput, InviteAlert } from './AuthFormElements';
import { primaryBtn } from './authStyles';

type RegisterInitiateFormProps = {
  email: string;
  setEmail: (value: string) => void;
  inviteBlocked: boolean;
  emailSent: boolean;
  authError: string | null | undefined;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export const RegisterInitiateForm: React.FC<RegisterInitiateFormProps> = ({
  email,
  setEmail,
  inviteBlocked,
  emailSent,
  authError,
  loading,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-3">
    {inviteBlocked ? (
      <InviteAlert />
    ) : emailSent ? (
      <EmailSentNotice>
        Check <span className="font-semibold text-[var(--er-text-primary)]">{email}</span> for a
        verification link. Open it to finish creating your account.
      </EmailSentNotice>
    ) : (
      <>
        <IconInput
          icon={faEnvelope}
          type="email"
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <AuthErrorBox error={authError} />
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Sending…' : 'Create Account'}
        </button>
      </>
    )}
  </form>
);

type RegisterCompleteFormProps = {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  authError: string | null | undefined;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export const RegisterCompleteForm: React.FC<RegisterCompleteFormProps> = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  authError,
  loading,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <IconInput
      icon={faLock}
      type="password"
      placeholder="Password"
      autoComplete="new-password"
      value={password}
      onChange={setPassword}
    />
    <IconInput
      icon={faLock}
      type="password"
      placeholder="Confirm password"
      autoComplete="new-password"
      value={confirmPassword}
      onChange={setConfirmPassword}
    />
    <AuthErrorBox error={authError} />
    <button type="submit" disabled={loading} className={primaryBtn}>
      {loading ? 'Creating…' : 'Create Account'}
    </button>
  </form>
);
