import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleInfo,
    faCrown,
    faPlus,
    faRotate,
    faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { AppState } from '../../../redux/store';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import { setGroups } from '../../../redux/rootSlice';
import { listGroups } from '../../../utilities/api/groups';
import { ApiError } from '../../../utilities/api/types';
import { sectionLabel, primaryBtn, iconBtn } from './cloud/styles';
import SignInPrompt from './cloud/SignInPrompt';
import GroupAvatar from './groups/GroupAvatar';
import CreateGroupModal from './groups/CreateGroupModal';
import GroupDetailView from './groups/GroupDetailView';

interface GroupsTabProps {
    openAuthModal: () => void;
}

// Remember the group the user last opened so re-opening the config modal
// (which remounts this tab) restores the detail view instead of the list.
// Mirrors the active-tab persistence in ConfigModal.
const SELECTED_GROUP_STORAGE_KEY = 'groupsTabSelectedGroup';

const GroupsTab: React.FC<GroupsTabProps> = ({ openAuthModal }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s: AppState) => s.auth.user);
    const groups = useAppSelector((s: AppState) => s.groups.groups);
    const groupDetails = useAppSelector((s: AppState) => s.groups.groupDetails);

    const [view, setView] = useState<{ kind: 'list' } | { kind: 'detail'; id: string }>(() => {
        try {
            const stored = localStorage.getItem(SELECTED_GROUP_STORAGE_KEY);
            return stored ? { kind: 'detail', id: stored } : { kind: 'list' };
        } catch {
            return { kind: 'list' };
        }
    });

    // List-view state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const refresh = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const list = await listGroups();
            dispatch(setGroups(list ?? []));
        } catch (e) {
            if (e instanceof ApiError) setError(e.body?.trim() || e.message);
            else setError('Failed to load groups.');
        } finally {
            setLoading(false);
        }
    }, [user, dispatch]);

    // Only fetch the list when we don't have it cached. The user can pull
    // a manual refresh with the rotate button. Avoids hitting the server
    // every time the modal is reopened.
    useEffect(() => {
        if (user && groups === null) refresh();
    }, [user, groups, refresh]);

    // Persist the open group so the selection survives a modal close/reopen
    // (and page reload). Cleared when the user backs out to the list.
    useEffect(() => {
        try {
            if (view.kind === 'detail') {
                localStorage.setItem(SELECTED_GROUP_STORAGE_KEY, view.id);
            } else {
                localStorage.removeItem(SELECTED_GROUP_STORAGE_KEY);
            }
        } catch {
            // ignore storage failures
        }
    }, [view]);

    if (!user) {
        return (
            <SignInPrompt
                icon={faUserGroup}
                title="Rank together"
                description="Sign in to create a group and share rankings with friends."
                onSignIn={openAuthModal}
            />
        );
    }

    if (view.kind === 'detail') {
        return (
            <GroupDetailView
                groupId={view.id}
                cached={groupDetails[view.id]}
                onBack={() => setView({ kind: 'list' })}
                onLeftOrDeleted={() => setView({ kind: 'list' })}
            />
        );
    }

    return (
        <div className="text-sm space-y-4">
            <div className={`${sectionLabel} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span>My groups</span>
                    {groups && groups.length > 0 && (
                        <span className="normal-case tracking-normal text-[var(--er-text-subtle)] font-normal">
                            {groups.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={loading}
                        className={iconBtn}
                        title="Refresh"
                    >
                        <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className={primaryBtn}
                        title="New group"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        New
                    </button>
                </div>
            </div>

            {loading && (
                <div className="text-xs text-[var(--er-text-subtle)] py-2">Loading…</div>
            )}
            {error && <div className="text-xs text-red-400 py-2">{error}</div>}

            {!loading && !error && groups && groups.length === 0 && (
                <div className="rounded-lg border border-dashed border-[var(--er-border-lightest)] dark:border-[var(--er-border-darker)] py-6 text-center text-xs text-[var(--er-text-subtle)]">
                    You're not in any groups yet.
                </div>
            )}

            {!loading && !error && groups && groups.length > 0 && (
                <ul className="space-y-1.5">
                    {groups.map((g) => (
                        <li key={g.id}>
                            <button
                                type="button"
                                onClick={() => setView({ kind: 'detail', id: g.id })}
                                className="w-full text-left rounded-md px-3 py-2.5 flex items-center gap-3 bg-[var(--er-button-neutral)]/15 hover:bg-[var(--er-button-neutral)]/30 transition-colors"
                            >
                                <GroupAvatar group={g} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate font-medium text-[var(--er-text-primary)]">
                                            {g.name}
                                        </span>
                                        {g.role === 'owner' && (
                                            <FontAwesomeIcon
                                                icon={faCrown}
                                                className="text-[10px] text-amber-400 shrink-0"
                                                title="You own this group"
                                            />
                                        )}
                                    </div>
                                    <div className="text-xs text-[var(--er-text-subtle)] mt-0.5">
                                        {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="rounded-lg border-[0.7px] border-[var(--er-button-primary)]/30 bg-[var(--er-button-primary)]/10 p-3 flex gap-2.5">
                <FontAwesomeIcon icon={faCircleInfo} className="text-[var(--er-button-primary)] mt-0.5 shrink-0" />
                <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">
                    Have an invite link? Open it on this device while signed in to join the group.
                </div>
            </div>

            <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={(g) => {
                setShowCreate(false);
                setView({ kind: 'detail', id: g.id });
            }} />
        </div>
    );
};

export default GroupsTab;
