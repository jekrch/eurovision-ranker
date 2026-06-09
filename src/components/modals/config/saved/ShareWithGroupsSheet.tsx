import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Group, UserRanking } from '../../../../utilities/api/types';

// Bottom sheet for toggling which groups a ranking is shared with. Kept as a
// bespoke overlay (rather than the shared NestedSheet) because it carries a
// subtitle and a scrollable list of group toggles.
const ShareWithGroupsSheet: React.FC<{
    target: UserRanking;
    groups: Group[] | null;
    rankings: UserRanking[] | null;
    shareLoading: boolean;
    pendingShareToggle: string | null;
    onClose: () => void;
    onToggleShare: (current: UserRanking, groupId: string, shared: boolean) => void;
}> = ({ target, groups, rankings, shareLoading, pendingShareToggle, onClose, onToggleShare }) => (
    <div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
    >
        <div
            className="w-full sm:max-w-md bg-[var(--er-surface-secondary)] rounded-t-xl sm:rounded-xl ring-1 ring-white/10 shadow-2xl shadow-black/40 p-5 sm:m-4 max-h-[85vh] overflow-y-auto [scrollbar-gutter:stable]"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--er-text-primary)] truncate">
                        Share with groups
                    </h3>
                    <p className="text-xs text-[var(--er-text-subtle)] truncate">
                        {target.name || 'Untitled'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/5 shrink-0"
                    aria-label="Close"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>

            {shareLoading && (
                <div className="text-xs text-[var(--er-text-subtle)] py-3">Loading groups…</div>
            )}

            {!shareLoading && groups && groups.length === 0 && (
                <div className="rounded-lg border border-dashed border-[var(--er-border-lightest)] dark:border-[var(--er-border-darker)] py-6 text-center text-xs text-[var(--er-text-subtle)]">
                    You're not in any groups yet. Create one from the Groups tab.
                </div>
            )}

            {!shareLoading && groups && groups.length > 0 && (
                <ul className="space-y-1">
                    {groups.map((g) => {
                        // Use the latest copy from the cache for live group_ids updates.
                        const current = rankings?.find(x => x.ranking_id === target.ranking_id) ?? target;
                        const shared = !!current.group_ids?.includes(g.id);
                        const pending = pendingShareToggle === g.id;
                        return (
                            <li key={g.id}>
                                <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() => onToggleShare(current, g.id, shared)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${shared ? 'bg-[var(--er-button-primary)]/10 ring-1 ring-inset ring-[var(--er-button-primary)]/30' : 'bg-[var(--er-button-neutral)]/15 hover:bg-[var(--er-button-neutral)]/30'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    <div className={`w-5 h-5 rounded border ${shared ? 'bg-[var(--er-button-primary)] border-[var(--er-button-primary)]' : 'border-white/20'} flex items-center justify-center shrink-0`}>
                                        {shared && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="truncate text-sm text-[var(--er-text-primary)]">{g.name}</div>
                                        <div className="text-[11px] text-[var(--er-text-subtle)]">
                                            {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="mt-3 text-[11px] text-[var(--er-text-subtle)] leading-relaxed">
                Group members can view this ranking. They can't edit it.
            </div>
        </div>
    </div>
);

export default ShareWithGroupsSheet;
