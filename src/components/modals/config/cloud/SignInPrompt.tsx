import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

// Shared "sign in to use this feature" empty state for the cloud config tabs.
// `children` renders an optional footer (e.g. the Saved-rankings private-preview
// note); when present the Sign In button keeps its bottom margin.
const SignInPrompt: React.FC<{
  icon: IconDefinition;
  title: string;
  description: string;
  onSignIn: () => void;
  children?: React.ReactNode;
}> = ({ icon, title, description, onSignIn, children }) => (
  <div className="flex flex-col items-center text-center py-6 px-2">
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--er-button-primary)]/30 to-[var(--er-button-primary-hover)]/20 flex items-center justify-center mb-4 ring-1 ring-[var(--er-button-primary)]/20">
      <FontAwesomeIcon icon={icon} className="text-[var(--er-button-primary)] text-lg" />
    </div>
    <h3 className="text-base font-semibold text-[var(--er-text-primary)] mb-1">{title}</h3>
    <p className="text-sm text-[var(--er-text-subtle)] max-w-xs mb-5">{description}</p>
    <button
      type="button"
      onClick={onSignIn}
      className={`px-5 py-2 text-sm font-medium text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] rounded-md transition-colors shadow-sm${children ? ' mb-5' : ''}`}
    >
      Sign In
    </button>
    {children}
  </div>
);

export default SignInPrompt;
