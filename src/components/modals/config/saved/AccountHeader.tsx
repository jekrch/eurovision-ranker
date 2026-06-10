import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { sectionLabel } from '../cloud/styles';

// Signed-in account header: avatar, email, and a sign-out button.
const AccountHeader: React.FC<{ email: string; onSignOut: () => void }> = ({
  email,
  onSignOut,
}) => {
  const userInitial = (email || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
        {userInitial}
      </div>
      <div className="min-w-0 flex-1">
        <div className={sectionLabel}>Signed in</div>
        <div className="truncate text-[var(--er-text-primary)] text-sm">{email}</div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 transition-colors shrink-0"
        title="Sign out"
      >
        <FontAwesomeIcon icon={faRightFromBracket} />
      </button>
    </div>
  );
};

export default AccountHeader;
