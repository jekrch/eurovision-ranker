import { faCircleInfo, faEnvelope, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { inputWithIcon } from './authStyles';

export const InviteAlert: React.FC = () => (
  <div className="rounded-lg border-[0.7px] border-[var(--er-button-primary)]/30 bg-[var(--er-button-primary)]/10 p-3 flex gap-2.5">
    <FontAwesomeIcon
      icon={faCircleInfo}
      className="text-[var(--er-button-primary)] mt-0.5 shrink-0"
    />
    <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">
      <span className="font-semibold text-[var(--er-text-primary)]">Private preview.</span> Accounts
      are invite-only while this feature is being tested with a small group. Public sign-ups will
      open in a future release. Thanks for your patience!
    </div>
  </div>
);

export const FieldIcon: React.FC<{ icon: typeof faEnvelope }> = ({ icon }) => (
  <FontAwesomeIcon
    icon={icon}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--er-text-subtle)] text-xs pointer-events-none"
  />
);

// the inline error banner repeated across each auth form; renders nothing when empty
export const AuthErrorBox: React.FC<{ error: string | null | undefined }> = ({ error }) =>
  error ? (
    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
      {error}
    </div>
  ) : null;

// a single icon-prefixed text/email/password input used throughout the auth forms
export const IconInput: React.FC<{
  icon: typeof faEnvelope;
  type: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ icon, type, placeholder, autoComplete, value, onChange }) => (
  <div className="relative">
    <FieldIcon icon={icon} />
    <input
      className={inputWithIcon}
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  </div>
);

// the green confirmation banner shown after a reset/verification email is sent
export const EmailSentNotice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
    <FontAwesomeIcon icon={faCheck} className="text-emerald-400 mt-0.5 shrink-0" />
    <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">{children}</div>
  </div>
);
