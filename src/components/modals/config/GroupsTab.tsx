import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCheck,
    faCircleInfo,
    faCopy,
    faCrown,
    faLink,
    faPlus,
    faRotate,
    faShareNodes,
    faTrash,
    faUserGroup,
    faUserPlus,
    faRightFromBracket,
    faPen,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { AppState } from '../../../redux/store';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import GlobalConfirmationModal from '../GlobalConfirmationModal';
import {
    addGroupInvite,
    removeGroup,
    removeGroupIdFromRanking,
    removeGroupInvite,
    setGroupDetail,
    setGroupInvites,
    setGroups,
    setGroupSharedRankings,
    upsertGroup,
} from '../../../redux/rootSlice';
import {
    createGroup,
    createInvite,
    deleteGroup,
    getGroup,
    leaveGroup,
    listGroupRankings,
    listGroups,
    listInvites,
    revokeInvite,
    unshareRankingFromGroup,
    updateGroup,
} from '../../../utilities/api/groups';
import {
    ApiError,
    Group,
    GroupInvite,
    SharedRanking,
} from '../../../utilities/api/types';

interface GroupsTabProps {
    openAuthModal: () => void;
}

const sectionLabel =
    'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--er-text-subtle)]';
const inputClass =
    'border text-sm rounded-md block w-full p-2 bg-[color:var(--er-surface-primary)] border-white/5 placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/40 focus:border-[var(--er-button-primary)]/40';
const primaryBtn =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:bg-[var(--er-button-neutral)]/40 disabled:text-[var(--er-text-subtle)] disabled:cursor-not-allowed transition-colors';
const ghostBtn =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
// Min 36px tap target; mobile-friendly hit zone.
const iconBtn =
    'min-w-9 h-9 inline-flex items-center justify-center rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 disabled:opacity-40 transition-colors';
// Labeled action chip. Icon + text so the action reads clearly without a
// tooltip (mobile has none). min-h keeps a comfortable tap target.
const actionBtn =
    'inline-flex items-center gap-1.5 px-2.5 min-h-[34px] text-[11px] font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 transition-colors';
const dangerActionBtn =
    'inline-flex items-center gap-1.5 px-2.5 min-h-[34px] text-[11px] font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors';

function apiErrToast(e: unknown, fallback: string) {
    if (e instanceof ApiError) toast.error(e.body?.trim() || fallback);
    else toast.error(fallback);
}

function shortDate(s?: string): string {
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
}

function timeUntil(s?: string): string {
    if (!s) return '';
    const ms = new Date(s).getTime() - Date.now();
    if (ms <= 0) return 'expired';
    const days = Math.floor(ms / 86400_000);
    if (days >= 1) return `${days}d`;
    const hours = Math.floor(ms / 3600_000);
    if (hours >= 1) return `${hours}h`;
    const mins = Math.floor(ms / 60_000);
    return `${mins}m`;
}

const GroupsTab: React.FC<GroupsTabProps> = ({ openAuthModal }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s: AppState) => s.user);
    const groups = useAppSelector((s: AppState) => s.groups);
    const groupDetails = useAppSelector((s: AppState) => s.groupDetails);

    const [view, setView] = useState<{ kind: 'list' } | { kind: 'detail'; id: string }>({ kind: 'list' });

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

    if (!user) {
        return (
            <div className="flex flex-col items-center text-center py-6 px-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--er-button-primary)]/30 to-[var(--er-button-primary-hover)]/20 flex items-center justify-center mb-4 ring-1 ring-[var(--er-button-primary)]/20">
                    <FontAwesomeIcon icon={faUserGroup} className="text-[var(--er-button-primary)] text-lg" />
                </div>
                <h3 className="text-base font-semibold text-[var(--er-text-primary)] mb-1">
                    Rank together
                </h3>
                <p className="text-sm text-[var(--er-text-subtle)] max-w-xs mb-5">
                    Sign in to create a group and share rankings with friends.
                </p>
                <button
                    type="button"
                    onClick={openAuthModal}
                    className="px-5 py-2 text-sm font-medium text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] rounded-md transition-colors shadow-sm"
                >
                    Sign In
                </button>
            </div>
        );
    }

    if (view.kind === 'detail') {
        return (
            <GroupDetail
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

const GroupAvatar: React.FC<{ group: Group }> = ({ group }) => {
    const initial = (group.name || '?').trim().charAt(0).toUpperCase();
    if (group.image_url) {
        return (
            <img
                src={group.image_url}
                alt=""
                className="w-10 h-10 rounded-md object-cover shrink-0 ring-1 ring-white/10"
            />
        );
    }
    return (
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm">
            {initial}
        </div>
    );
};

// --- Create group modal --------------------------------------------------

const CreateGroupModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreated: (g: Group) => void;
}> = ({ isOpen, onClose, onCreated }) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
            setImageUrl('');
            setSaving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error('Name is required.');
            return;
        }
        setSaving(true);
        try {
            const g = await createGroup({
                name: trimmed,
                description: description.trim() || undefined,
                image_url: imageUrl.trim() || undefined,
            });
            dispatch(upsertGroup(g));
            toast.success('Group created.');
            onCreated(g);
        } catch (e) {
            apiErrToast(e, 'Failed to create group.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <NestedSheet onClose={onClose} title="New group">
            <form onSubmit={submit} className="space-y-3">
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Name</span>
                    <input
                        className={inputClass}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        autoFocus
                        required
                    />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Description (optional)</span>
                    <textarea
                        className={`${inputClass} min-h-[60px]`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                    />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Image URL (optional)</span>
                    <input
                        className={inputClass}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        maxLength={500}
                        placeholder="https://…"
                        type="url"
                    />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={saving} className={primaryBtn}>
                        {saving ? 'Creating…' : 'Create'}
                    </button>
                </div>
            </form>
        </NestedSheet>
    );
};

// Lightweight inline sheet for in-tab forms. Avoids stacking real Modal
// components (which interferes with focus and outside-click handling).
const NestedSheet: React.FC<{
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ onClose, title, children }) => (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div
            className="w-full sm:max-w-md bg-[var(--er-surface-secondary)] rounded-t-xl sm:rounded-xl ring-1 ring-white/10 shadow-2xl shadow-black/40 p-5 m-0 sm:m-4 max-h-[85vh] overflow-y-auto [scrollbar-gutter:stable]"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--er-text-primary)]">{title}</h3>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/5"
                    aria-label="Close"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

// --- Group detail --------------------------------------------------------

const GroupDetail: React.FC<{
    groupId: string;
    cached?: Group;
    onBack: () => void;
    onLeftOrDeleted: () => void;
}> = ({ groupId, cached, onBack, onLeftOrDeleted }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s: AppState) => s.user);
    const sharedRankings = useAppSelector((s: AppState) => s.groupSharedRankings[groupId]);
    const invites = useAppSelector((s: AppState) => s.groupInvites[groupId]);
    const detail = useAppSelector((s: AppState) => s.groupDetails[groupId]) ?? cached;

    const [loading, setLoading] = useState(false);
    const [loadingShares, setLoadingShares] = useState(false);
    const [loadingInvites, setLoadingInvites] = useState(false);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [confirmUnshare, setConfirmUnshare] = useState<SharedRanking | null>(null);

    const isOwner = detail?.role === 'owner';

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        try {
            const fresh = await getGroup(groupId);
            dispatch(setGroupDetail(fresh));
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                toast.error('Group not found.');
                dispatch(removeGroup(groupId));
                onLeftOrDeleted();
            } else {
                apiErrToast(e, 'Failed to load group.');
            }
        } finally {
            setLoading(false);
        }
    }, [groupId, dispatch, onLeftOrDeleted]);

    const fetchShared = useCallback(async () => {
        setLoadingShares(true);
        try {
            const list = await listGroupRankings(groupId);
            dispatch(setGroupSharedRankings({ groupId, rankings: list ?? [] }));
        } catch (e) {
            apiErrToast(e, 'Failed to load shared rankings.');
        } finally {
            setLoadingShares(false);
        }
    }, [groupId, dispatch]);

    const fetchInvites = useCallback(async () => {
        setLoadingInvites(true);
        try {
            const list = await listInvites(groupId);
            dispatch(setGroupInvites({ groupId, invites: list ?? [] }));
        } catch (e) {
            apiErrToast(e, 'Failed to load invites.');
        } finally {
            setLoadingInvites(false);
        }
    }, [groupId, dispatch]);

    // Fetch members on first open if we don't have them. Re-uses the cache
    // across modal closes/reopens.
    useEffect(() => {
        if (!detail?.members) fetchDetail();
    }, [detail?.members, fetchDetail]);

    // Shared rankings: fetch once when missing.
    useEffect(() => {
        if (sharedRankings === undefined) fetchShared();
    }, [sharedRankings, fetchShared]);

    // Invites: only owners can see them, fetch lazily.
    useEffect(() => {
        if (isOwner && invites === undefined) fetchInvites();
    }, [isOwner, invites, fetchInvites]);

    const handleDelete = async () => {
        try {
            await deleteGroup(groupId);
            dispatch(removeGroup(groupId));
            toast.success('Group deleted.');
            onLeftOrDeleted();
        } catch (e) {
            apiErrToast(e, 'Failed to delete group.');
        }
    };

    const handleLeave = async () => {
        try {
            await leaveGroup(groupId);
            dispatch(removeGroup(groupId));
            toast.success('Left group.');
            onLeftOrDeleted();
        } catch (e) {
            apiErrToast(e, 'Failed to leave group.');
        }
    };

    const handleNewInvite = async () => {
        try {
            const inv = await createInvite(groupId);
            dispatch(addGroupInvite(inv));
            const link = inv.url ?? `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(inv.token)}`;
            try {
                await navigator.clipboard.writeText(link);
                toast.success('Invite link copied.');
            } catch {
                window.prompt('Copy this invite link:', link);
            }
        } catch (e) {
            apiErrToast(e, 'Failed to create invite.');
        }
    };

    const handleCopyInvite = async (inv: GroupInvite) => {
        const link = inv.url ?? `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(inv.token)}`;
        try {
            await navigator.clipboard.writeText(link);
            toast.success('Invite link copied.');
        } catch {
            window.prompt('Copy this invite link:', link);
        }
    };

    const handleRevokeInvite = async (inv: GroupInvite) => {
        try {
            await revokeInvite(groupId, inv.token);
            dispatch(removeGroupInvite({ groupId, token: inv.token }));
            toast.success('Invite revoked.');
        } catch (e) {
            apiErrToast(e, 'Failed to revoke invite.');
        }
    };

    const handleUnshare = async (r: SharedRanking) => {
        try {
            await unshareRankingFromGroup(groupId, r.ranking_id);
            // Drop from local list immediately.
            const next = (sharedRankings ?? []).filter(x => x.ranking_id !== r.ranking_id);
            dispatch(setGroupSharedRankings({ groupId, rankings: next }));
            dispatch(removeGroupIdFromRanking({ rankingId: r.ranking_id, groupId }));
            toast.success('Unshared.');
        } catch (e) {
            apiErrToast(e, 'Failed to unshare.');
        }
    };

    if (!detail) {
        return (
            <div className="text-sm">
                <button type="button" onClick={onBack} className={`${ghostBtn} mb-3`}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Back
                </button>
                <div className="text-xs text-[var(--er-text-subtle)]">
                    {loading ? 'Loading…' : 'Group not available.'}
                </div>
            </div>
        );
    }

    return (
        <div className="text-sm space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2">
                <button type="button" onClick={onBack} className={ghostBtn}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back
                </button>
                <button
                    type="button"
                    onClick={() => { fetchDetail(); fetchShared(); if (isOwner) fetchInvites(); }}
                    disabled={loading}
                    className={`${iconBtn} ml-auto`}
                    title="Refresh"
                >
                    <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex items-start gap-3">
                <GroupAvatar group={detail} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--er-text-primary)] truncate">
                            {detail.name}
                        </h3>
                        {isOwner && (
                            <button
                                type="button"
                                onClick={() => setEditing(true)}
                                className={iconBtn}
                                title="Edit group"
                            >
                                <FontAwesomeIcon icon={faPen} className="text-xs" />
                            </button>
                        )}
                    </div>
                    {detail.description && (
                        <p className="text-xs text-[var(--er-text-subtle)] mt-0.5 whitespace-pre-line break-words">
                            {detail.description}
                        </p>
                    )}
                    <div className="text-[11px] text-[var(--er-text-subtle)] mt-1">
                        {detail.member_count} / 20 {detail.member_count === 1 ? 'member' : 'members'}
                    </div>
                </div>
            </div>

            {/* Members */}
            <section>
                <div className={`${sectionLabel} mb-2`}>Members</div>
                {!detail.members && (
                    <div className="text-xs text-[var(--er-text-subtle)]">Loading…</div>
                )}
                {detail.members && (
                    <ul className="space-y-1">
                        {detail.members.map((m) => (
                            <li key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--er-button-neutral)]/15">
                                <div className="w-7 h-7 rounded-full bg-[var(--er-button-neutral)]/40 flex items-center justify-center text-[10px] text-[var(--er-text-primary)] font-semibold shrink-0">
                                    {(m.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate flex-1 text-[var(--er-text-primary)]">{m.email}</span>
                                {m.role === 'owner' && (
                                    <FontAwesomeIcon icon={faCrown} className="text-[10px] text-amber-400" title="Owner" />
                                )}
                                {user?.id === m.user_id && (
                                    <span className="text-[10px] text-[var(--er-text-subtle)] uppercase">You</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Invites (owner only) */}
            {isOwner && (
                <section>
                    <div className={`${sectionLabel} mb-2 flex items-center justify-between`}>
                        <span>Invite links</span>
                        <button
                            type="button"
                            onClick={handleNewInvite}
                            disabled={detail.member_count >= 20}
                            className={primaryBtn}
                            title={detail.member_count >= 20 ? 'Group full' : 'Generate link'}
                        >
                            <FontAwesomeIcon icon={faUserPlus} />
                            New link
                        </button>
                    </div>
                    {loadingInvites && (
                        <div className="text-xs text-[var(--er-text-subtle)] py-1">Loading…</div>
                    )}
                    {!loadingInvites && invites && invites.length === 0 && (
                        <div className="text-xs text-[var(--er-text-subtle)] py-1">
                            No active links. Each link is single-use and expires in 7 days.
                        </div>
                    )}
                    {invites && invites.length > 0 && (
                        <ul className="space-y-1">
                            {invites.map((inv) => (
                                <li key={inv.token} className="flex flex-col gap-2 px-2.5 py-2 rounded-md bg-[var(--er-button-neutral)]/15">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FontAwesomeIcon icon={faLink} className="text-[10px] text-[var(--er-text-subtle)] shrink-0" />
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
                                        <button type="button" onClick={() => handleCopyInvite(inv)} className={actionBtn}>
                                            <FontAwesomeIcon icon={faCopy} className="text-xs" />
                                            Copy link
                                        </button>
                                        <button type="button" onClick={() => handleRevokeInvite(inv)} className={dangerActionBtn}>
                                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                            Revoke
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {/* Shared rankings */}
            <section>
                <div className={`${sectionLabel} mb-2 flex items-center justify-between`}>
                    <span>Shared rankings</span>
                    <button
                        type="button"
                        onClick={fetchShared}
                        disabled={loadingShares}
                        className={iconBtn}
                        title="Refresh"
                    >
                        <FontAwesomeIcon icon={faRotate} className={`text-xs ${loadingShares ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {loadingShares && (
                    <div className="text-xs text-[var(--er-text-subtle)] py-1">Loading…</div>
                )}
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
                                <li key={`${r.ranking_id}-${r.user_id}`} className="flex flex-col gap-2 px-2.5 py-2 rounded-md bg-[var(--er-button-neutral)]/15">
                                    <div className="flex items-start gap-2 min-w-0">
                                        <FontAwesomeIcon icon={faShareNodes} className="text-[10px] text-[var(--er-text-subtle)] shrink-0 mt-1" />
                                        <div className="min-w-0">
                                            <div className="truncate text-[var(--er-text-primary)]">
                                                {r.name || <span className="italic text-[var(--er-text-subtle)]">Untitled</span>}
                                            </div>
                                            <div className="text-[10px] text-[var(--er-text-subtle)]">
                                                {r.owner_email}
                                                {r.year ? ` · ${r.year}` : ''}
                                                {r.shared_at ? ` · ${shortDate(r.shared_at)}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1 -ml-1.5">
                                        <a
                                            href={`${window.location.pathname}?id=${encodeURIComponent(r.ranking_id)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={actionBtn}
                                        >
                                            <FontAwesomeIcon icon={faLink} className="text-xs" />
                                            Open
                                        </a>
                                        {mine && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmUnshare(r)}
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

            {/* Danger zone */}
            <section className="pt-2 border-t border-white/5">
                {isOwner ? (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete group
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmLeave(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                    >
                        <FontAwesomeIcon icon={faRightFromBracket} />
                        Leave group
                    </button>
                )}
            </section>

            {editing && (
                <EditGroupModal
                    group={detail}
                    onClose={() => setEditing(false)}
                />
            )}

            <GlobalConfirmationModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                message={`Delete "${detail.name}"? Members, invites, and shared rankings will be removed. This can't be undone.`}
            />
            <GlobalConfirmationModal
                isOpen={confirmLeave}
                onClose={() => setConfirmLeave(false)}
                onConfirm={handleLeave}
                message={`Leave "${detail.name}"? You'll lose access to anything shared with this group.`}
            />
            <GlobalConfirmationModal
                isOpen={!!confirmUnshare}
                onClose={() => setConfirmUnshare(null)}
                onConfirm={() => { if (confirmUnshare) handleUnshare(confirmUnshare); }}
                message={`Stop sharing "${confirmUnshare?.name || 'this ranking'}" with the group?`}
            />
        </div>
    );
};

// --- Edit group modal ----------------------------------------------------

const EditGroupModal: React.FC<{
    group: Group;
    onClose: () => void;
}> = ({ group, onClose }) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description ?? '');
    const [imageUrl, setImageUrl] = useState(group.image_url ?? '');
    const [saving, setSaving] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error('Name is required.');
            return;
        }
        setSaving(true);
        try {
            const updated = await updateGroup(group.id, {
                name: trimmed,
                description: description.trim() || undefined,
                image_url: imageUrl.trim() || undefined,
            });
            // Preserve members from the prior detail since PATCH may not return them.
            dispatch(setGroupDetail({ ...updated, members: updated.members ?? group.members }));
            dispatch(upsertGroup({ ...updated, members: undefined }));
            toast.success('Saved.');
            onClose();
        } catch (e) {
            apiErrToast(e, 'Failed to update.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <NestedSheet onClose={onClose} title="Edit group">
            <form onSubmit={submit} className="space-y-3">
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Name</span>
                    <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus required />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Description</span>
                    <textarea className={`${inputClass} min-h-[60px]`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
                </label>
                <label className="block">
                    <span className={`${sectionLabel} block mb-1`}>Image URL</span>
                    <input className={inputClass} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={500} placeholder="https://…" type="url" />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={saving} className={primaryBtn}>
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </NestedSheet>
    );
};

export default GroupsTab;
