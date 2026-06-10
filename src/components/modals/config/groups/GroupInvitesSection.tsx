import { faCopy, faLink, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { Group, GroupInvite } from '../../../../utilities/api/types';
import { timeUntil } from '../cloud/helpers';
import { sectionLabel, primaryBtn, actionBtn, dangerActionBtn } from '../cloud/styles';

// Owner-only invite-link management: generate a single-use link, copy it, or
// revoke an active one.
const GroupInvitesSection: React.FC<{
  detail: Group;
  invites: GroupInvite[] | undefined;
  loadingInvites: boolean;
  onNewInvite: () => void;
  onCopyInvite: (inv: GroupInvite) => void;
  onRevokeInvite: (inv: GroupInvite) => void;
}> = ({ detail, invites, loadingInvites, onNewInvite, onCopyInvite, onRevokeInvite }) => (
  <section>
    <div className={`${sectionLabel} mb-2 flex items-center justify-between`}>
      <span>Invite links</span>
      <button
        type="button"
        onClick={onNewInvite}
        disabled={detail.member_count >= 20}
        className={primaryBtn}
        title={detail.member_count >= 20 ? 'Group full' : 'Generate link'}
      >
        <FontAwesomeIcon icon={faUserPlus} />
        New link
      </button>
    </div>
    {loadingInvites && <div className="text-xs text-[var(--er-text-subtle)] py-1">Loading…</div>}
    {!loadingInvites && invites && invites.length === 0 && (
      <div className="text-xs text-[var(--er-text-subtle)] py-1">
        No active links. Each link is single-use and expires in 7 days.
      </div>
    )}
    {invites && invites.length > 0 && (
      <ul className="space-y-1">
        {invites.map((inv) => (
          <li
            key={inv.token}
            className="flex flex-col gap-2 px-2.5 py-2 rounded-md bg-[var(--er-button-neutral)]/15"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FontAwesomeIcon
                icon={faLink}
                className="text-[10px] text-[var(--er-text-subtle)] shrink-0"
              />
              <div className="min-w-0">
                <div className="truncate text-xs text-[var(--er-text-tertiary)]">
                  …{inv.token.slice(-12)}
                </div>
                <div className="text-[10px] text-[var(--er-text-subtle)]">
                  expires in {timeUntil(inv.expires_at)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 -ml-1.5">
              <button type="button" onClick={() => onCopyInvite(inv)} className={actionBtn}>
                <FontAwesomeIcon icon={faCopy} className="text-xs" />
                Copy link
              </button>
              <button type="button" onClick={() => onRevokeInvite(inv)} className={dangerActionBtn}>
                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                Revoke
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default GroupInvitesSection;
