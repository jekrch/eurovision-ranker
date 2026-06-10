import { faLink, faRotate, faShareNodes, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { AuthUser, SharedRanking } from '../../../../utilities/api/types';
import { shortDate } from '../cloud/helpers';
import { sectionLabel, iconBtn, actionBtn, dangerActionBtn } from '../cloud/styles';

// Rankings shared with the group. Each member can open any shared ranking;
// you can unshare your own.
const GroupSharedRankingsSection: React.FC<{
  sharedRankings: SharedRanking[] | undefined;
  loadingShares: boolean;
  user: AuthUser | null;
  onRefresh: () => void;
  onOpen: (r: SharedRanking) => void;
  onConfirmUnshare: (r: SharedRanking) => void;
}> = ({ sharedRankings, loadingShares, user, onRefresh, onOpen, onConfirmUnshare }) => (
  <section>
    <div className={`${sectionLabel} mb-2 flex items-center justify-between`}>
      <span>Shared rankings</span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loadingShares}
        className={iconBtn}
        title="Refresh"
      >
        <FontAwesomeIcon
          icon={faRotate}
          className={`text-xs ${loadingShares ? 'animate-spin' : ''}`}
        />
      </button>
    </div>
    {loadingShares && <div className="text-xs text-[var(--er-text-subtle)] py-1">Loading…</div>}
    {!loadingShares && sharedRankings && sharedRankings.length === 0 && (
      <div className="text-xs text-[var(--er-text-subtle)] py-1">
        Nothing shared yet. From the Account tab, tap Share on a ranking.
      </div>
    )}
    {sharedRankings && sharedRankings.length > 0 && (
      <ul className="space-y-1">
        {sharedRankings.map((r) => {
          const mine = r.user_id === user?.id;
          return (
            <li
              key={`${r.ranking_id}-${r.user_id}`}
              className="flex flex-col gap-2 px-2.5 py-2 rounded-md bg-[var(--er-button-neutral)]/15"
            >
              <div className="flex items-start gap-2 min-w-0">
                <FontAwesomeIcon
                  icon={faShareNodes}
                  className="text-[10px] text-[var(--er-text-subtle)] shrink-0 mt-1"
                />
                <div className="min-w-0">
                  <div className="truncate text-[var(--er-text-primary)]">
                    {r.name || (
                      <span className="italic text-[var(--er-text-subtle)]">Untitled</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--er-text-subtle)]">
                    {r.owner_email}
                    {r.year ? ` · ${r.year}` : ''}
                    {r.shared_at ? ` · ${shortDate(r.shared_at)}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 -ml-1.5">
                <button type="button" onClick={() => onOpen(r)} className={actionBtn}>
                  <FontAwesomeIcon icon={faLink} className="text-xs" />
                  Open
                </button>
                {mine && (
                  <button
                    type="button"
                    onClick={() => onConfirmUnshare(r)}
                    className={dangerActionBtn}
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                    Unshare
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default GroupSharedRankingsSection;
