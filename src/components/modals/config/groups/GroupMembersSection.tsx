import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { AuthUser, Group } from '../../../../utilities/api/types';
import { sectionLabel } from '../cloud/styles';

const GroupMembersSection: React.FC<{ detail: Group; user: AuthUser | null }> = ({
  detail,
  user,
}) => (
  <section>
    <div className={`${sectionLabel} mb-2`}>Members</div>
    {!detail.members && <div className="text-xs text-[var(--er-text-subtle)]">Loading…</div>}
    {detail.members && (
      <ul className="space-y-1">
        {detail.members.map((m) => (
          <li
            key={m.user_id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--er-button-neutral)]/15"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--er-button-neutral)]/40 flex items-center justify-center text-[10px] text-[var(--er-text-primary)] font-semibold shrink-0">
              {(m.email || '?').charAt(0).toUpperCase()}
            </div>
            <span className="truncate flex-1 text-[var(--er-text-primary)]">{m.email}</span>
            {m.role === 'owner' && (
              <FontAwesomeIcon
                icon={faCrown}
                className="text-[10px] text-amber-400"
                title="Owner"
              />
            )}
            {user?.id === m.user_id && (
              <span className="text-[10px] text-[var(--er-text-subtle)] uppercase">You</span>
            )}
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default GroupMembersSection;
