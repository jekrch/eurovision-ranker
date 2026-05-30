import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUpload, faPen, faPlus, faSave, faRightFromBracket, faGlobe, faLock, faLink, faCheck, faRotate, faCircleInfo, faShareNodes, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppState } from '../../../redux/store';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import GlobalConfirmationModal from '../GlobalConfirmationModal';
import {
    listRankings,
    createRanking,
    updateRanking,
    deleteRanking,
    getRanking,
} from '../../../utilities/api/rankings';
import {
    listGroups,
    shareRankingWithGroup,
    unshareRankingFromGroup,
} from '../../../utilities/api/groups';
import { ApiError, UserRanking } from '../../../utilities/api/types';
import {
    setCurrentRankingId,
    setLastSavedSignature,
    setName,
    clearCurrentRanking,
    logout,
    setSavedRankings,
    upsertSavedRanking,
    removeSavedRanking,
    setCategories,
    setActiveCategory,
    setShowTotalRank,
    setGroups,
    addGroupIdToRanking,
    removeGroupIdFromRanking,
} from '../../../redux/rootSlice';
import { parseCategoriesUrlParam } from '../../../utilities/CategoryUtil';
import { buildSignature, signatureFromRanking } from '../../../utilities/api/rankingSignature';
import {
    buildRankingParamsFromUrl,
    MAX_RANKING_LENGTH,
    parseStoredRanking,
} from '../../../utilities/api/rankingParams';

interface SavedRankingsTabProps {
    openAuthModal: () => void;
}

const sectionLabel =
    'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--er-text-subtle)]';
const inputClass =
    'border text-sm rounded-md block w-full p-2 bg-[color:var(--er-surface-primary)] border-white/5 placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/40 focus:border-[var(--er-button-primary)]/40';

// Labeled action chip. Icon + text so the action is clear without a tooltip
// (mobile has none). min-h keeps it a comfortable tap target.
const actionBtn =
    'inline-flex items-center gap-1.5 px-2.5 min-h-[34px] text-[11px] font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 transition-colors';
const dangerActionBtn =
    'inline-flex items-center gap-1.5 px-2.5 min-h-[34px] text-[11px] font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors';

function yearToNumber(year: string | undefined): number | undefined {
    if (!year) return undefined;
    return /^\d+$/.test(year) ? Number(year) : undefined;
}

// Wipe everything the app keeps in the URL and re-seed from the saved record.
// Keeps any unrelated params untouched (e.g. dev/debug flags).
function applyLoadedRankingToUrl(r: UserRanking) {
    const sp = parseStoredRanking(r.ranking ?? '');
    if (r.name) sp.set('n', r.name); else sp.delete('n');
    if (r.year != null) sp.set('y', String(r.year).slice(-2)); else sp.delete('y');
    sp.delete('id');
    sp.delete('signup');
    const query = sp.toString();
    window.history.pushState(null, '', query ? `?${query}` : window.location.pathname);
}

const SavedRankingsTab: React.FC<SavedRankingsTabProps> = ({ openAuthModal }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s: AppState) => s.user);
    const name = useAppSelector((s: AppState) => s.name);
    const year = useAppSelector((s: AppState) => s.year);
    const rankedItems = useAppSelector((s: AppState) => s.rankedItems);
    const currentRankingId = useAppSelector((s: AppState) => s.currentRankingId);
    const lastSavedSignature = useAppSelector((s: AppState) => s.lastSavedSignature);

    const rankings = useAppSelector((s: AppState) => s.savedRankings);
    const groups = useAppSelector((s: AppState) => s.groups);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<UserRanking | null>(null);
    const [confirmLoad, setConfirmLoad] = useState<UserRanking | null>(null);
    const [saving, setSaving] = useState(false);
    const [shareTarget, setShareTarget] = useState<UserRanking | null>(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [pendingShareToggle, setPendingShareToggle] = useState<string | null>(null);

    // `rankingParams` reflects everything in the URL except n/y/id/signup.
    // It's recomputed whenever `rankedItems` changes (a proxy for "the URL
    // has been re-synced") so dirty-detection stays live.
    const rankingParams = useMemo(() => buildRankingParamsFromUrl(), [rankedItems]);
    const currentSignature = useMemo(
        () =>
            buildSignature({
                name: name || '',
                description: '',
                year: year || '',
                ranking: rankingParams,
                isPublic: false,
            }),
        [name, year, rankingParams]
    );

    const isDirty = currentRankingId
        ? lastSavedSignature !== currentSignature
        : true;
    const isEmpty = rankedItems.length === 0;

    const refresh = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const list = await listRankings();
            dispatch(setSavedRankings(list ?? []));
        } catch (e) {
            if (e instanceof ApiError) setError(e.body?.trim() || e.message);
            else setError('Failed to load rankings.');
        } finally {
            setLoading(false);
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (user && rankings === null) {
            refresh();
        }
    }, [user, rankings, refresh]);

    const handleSaveNew = async () => {
        if (isEmpty) {
            toast.error('Add some countries before saving.');
            return;
        }
        if (rankingParams.length > MAX_RANKING_LENGTH) {
            toast.error(`Ranking too large (${rankingParams.length}/${MAX_RANKING_LENGTH} chars). Try removing a category.`);
            return;
        }
        setSaving(true);
        try {
            const created = await createRanking({
                name: name || 'Untitled',
                description: '',
                year: yearToNumber(year),
                ranking: rankingParams,
                public: false,
                group_ids: [],
            });
            dispatch(setCurrentRankingId(created.ranking_id));
            dispatch(setLastSavedSignature(signatureFromRanking(created)));
            dispatch(upsertSavedRanking(created));
            toast.success('Saved.');
        } catch (e) {
            if (e instanceof ApiError && e.kind === 'max_rankings') {
                const match = e.body.match(/(\d+)/);
                toast.error(
                    match
                        ? `You've reached your saved-ranking limit (${match[1]}).`
                        : "You've reached your saved-ranking limit."
                );
            } else if (e instanceof ApiError) {
                toast.error(e.body?.trim() || `Failed to save (status ${e.status} ${e.kind}).`);
            } else {
                console.error('handleSaveNew: unexpected error', e);
                toast.error(`Failed to save: ${(e as any)?.message ?? String(e)}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUpdate = async () => {
        if (!currentRankingId) return;
        if (rankingParams.length > MAX_RANKING_LENGTH) {
            toast.error(`Ranking too large (${rankingParams.length}/${MAX_RANKING_LENGTH} chars). Try removing a category.`);
            return;
        }
        setSaving(true);
        try {
            // The API overwrites all fields on PATCH; carry forward description
            // and public from the saved copy so they aren't wiped.
            const existing = rankings?.find((x) => x.ranking_id === currentRankingId);
            const updated = await updateRanking({
                ranking_id: currentRankingId,
                name: name || 'Untitled',
                description: existing?.description ?? '',
                year: yearToNumber(year),
                ranking: rankingParams,
                public: existing?.public ?? false,
            });
            dispatch(setLastSavedSignature(signatureFromRanking(updated)));
            dispatch(upsertSavedRanking(updated));
            toast.success('Changes saved.');
        } catch (e) {
            if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to save changes.');
            else toast.error('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const doLoad = async (r: UserRanking) => {
        try {
            // Fetch fresh copy in case list was stale.
            const full = await getRanking(r.ranking_id);
            dispatch(upsertSavedRanking(full));
            applyLoadedRankingToUrl(full);

            // Categories and activeCategory live in Redux and are only seeded
            // from the URL on mount, so we need to dispatch them explicitly
            // when loading a saved ranking that has different ones.
            const sp = new URLSearchParams(window.location.search);
            const categoriesParam = sp.get('c');
            const parsedCategories = categoriesParam
                ? parseCategoriesUrlParam(categoriesParam)
                : [];
            dispatch(setCategories(parsedCategories));
            dispatch(setActiveCategory(parsedCategories.length ? 0 : undefined));
            dispatch(setShowTotalRank(false));

            dispatch(setName(full.name || ''));
            dispatch(setCurrentRankingId(full.ranking_id));
            dispatch(setLastSavedSignature(signatureFromRanking(full)));
            // App.tsx watches popstate to reload rankings from URL.
            window.dispatchEvent(new PopStateEvent('popstate'));
            toast.success('Loaded.');
        } catch (e) {
            if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to load.');
            else toast.error('Failed to load.');
        }
    };

    const handleLoad = (r: UserRanking) => {
        if (currentRankingId && currentRankingId !== r.ranking_id && isDirty && !isEmpty) {
            setConfirmLoad(r);
            return;
        }
        doLoad(r);
    };

    const handleDelete = async (r: UserRanking) => {
        try {
            await deleteRanking(r.ranking_id);
            if (currentRankingId === r.ranking_id) {
                dispatch(clearCurrentRanking());
            }
            dispatch(removeSavedRanking(r.ranking_id));
            toast.success('Deleted.');
        } catch (e) {
            if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to delete.');
            else toast.error('Failed to delete.');
        }
    };

    const handleTogglePublic = async (r: UserRanking) => {
        try {
            // Send full ranking — the API overwrites all fields on PATCH, not
            // a partial update, so anything we omit would be wiped.
            const updated = await updateRanking({
                ranking_id: r.ranking_id,
                name: r.name,
                description: r.description,
                year: r.year,
                ranking: r.ranking,
                public: !r.public,
            });
            if (currentRankingId === r.ranking_id) {
                dispatch(setLastSavedSignature(signatureFromRanking(updated)));
            }
            dispatch(upsertSavedRanking(updated));
            toast.success(updated.public ? 'Now public — share the link.' : 'Made private.');
        } catch (e) {
            if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to update.');
            else toast.error('Failed to update.');
        }
    };

    const handleCopyShareLink = async (r: UserRanking) => {
        const url = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(r.ranking_id)}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied.');
        } catch {
            // Fallback for browsers without clipboard permission.
            window.prompt('Copy this link:', url);
        }
    };

    const openShare = async (r: UserRanking) => {
        setShareTarget(r);
        // Lazy-load groups list if we haven't fetched it yet.
        if (groups === null) {
            setShareLoading(true);
            try {
                const list = await listGroups();
                dispatch(setGroups(list ?? []));
            } catch (e) {
                if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to load groups.');
                else toast.error('Failed to load groups.');
            } finally {
                setShareLoading(false);
            }
        }
    };

    const toggleShare = async (r: UserRanking, groupId: string, currentlyShared: boolean) => {
        setPendingShareToggle(groupId);
        try {
            if (currentlyShared) {
                await unshareRankingFromGroup(groupId, r.ranking_id);
                dispatch(removeGroupIdFromRanking({ rankingId: r.ranking_id, groupId }));
            } else {
                await shareRankingWithGroup(groupId, r.ranking_id);
                dispatch(addGroupIdToRanking({ rankingId: r.ranking_id, groupId }));
            }
        } catch (e) {
            if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to update sharing.');
            else toast.error('Failed to update sharing.');
        } finally {
            setPendingShareToggle(null);
        }
    };

    const handleRenameSubmit = async (r: UserRanking) => {
        const next = renameValue.trim();
        if (!next || next === r.name) {
            setRenameId(null);
            return;
        }
        try {
            const updated = await updateRanking({
                ranking_id: r.ranking_id,
                name: next,
                description: r.description,
                year: r.year,
                ranking: r.ranking,
                public: r.public,
            });
            if (currentRankingId === r.ranking_id) {
                dispatch(setName(updated.name));
                dispatch(setLastSavedSignature(signatureFromRanking(updated)));
            }
            dispatch(upsertSavedRanking(updated));
            setRenameId(null);
            toast.success('Renamed.');
        } catch (e) {
            if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to rename.');
            else toast.error('Failed to rename.');
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center text-center py-6 px-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--er-button-primary)]/30 to-[var(--er-button-primary-hover)]/20 flex items-center justify-center mb-4 ring-1 ring-[var(--er-button-primary)]/20">
                    <FontAwesomeIcon
                        icon={faUpload}
                        className="text-[var(--er-button-primary)] text-lg"
                    />
                </div>
                <h3 className="text-base font-semibold text-[var(--er-text-primary)] mb-1">
                    Save your rankings
                </h3>
                <p className="text-sm text-[var(--er-text-subtle)] max-w-xs mb-5">
                    Sign in to save and sync your rankings across devices.
                </p>
                <button
                    type="button"
                    onClick={openAuthModal}
                    className="px-5 py-2 text-sm font-medium text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] rounded-md transition-colors shadow-sm mb-5"
                >
                    Sign In
                </button>
                <div className="w-full max-w-sm rounded-lg border-[0.7px] border-[var(--er-button-primary)]/30 bg-[var(--er-button-primary)]/10 p-3 flex gap-2.5 text-left">
                    <FontAwesomeIcon
                        icon={faCircleInfo}
                        className="text-[var(--er-button-primary)] mt-0.5 shrink-0"
                    />
                    <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">
                        <span className="font-semibold text-[var(--er-text-primary)]">Private preview.</span>{' '}
                        Accounts are invite-only while this feature is being tested with a small group.
                        Public sign-ups will open in a future release. Thanks for your patience!
                    </div>
                </div>
            </div>
        );
    }

    const userInitial = (user.email || '?').trim().charAt(0).toUpperCase();

    return (
        <div className="text-sm space-y-5">
            {/* Account header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
                    {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                    <div className={sectionLabel}>Signed in</div>
                    <div className="truncate text-[var(--er-text-primary)] text-sm">
                        {user.email}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => dispatch(logout())}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 transition-colors shrink-0"
                    title="Sign out"
                >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                </button>
            </div>

            {/* Current ranking card */}
            <div>
                <div className={`${sectionLabel} mb-2`}>Current ranking</div>
                <div className="rounded-lg border border-[var(--er-border-lightest)] dark:border-[var(--er-border-darker)] bg-[var(--er-button-neutral)]/15 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="truncate font-medium text-[var(--er-text-primary)]">
                            {name || <span className="italic text-[var(--er-text-subtle)]">Untitled</span>}
                        </div>
                        <div className="text-xs text-[var(--er-text-subtle)] mt-0.5 flex items-center gap-1.5">
                            {year && <span>{year}</span>}
                            {year && <span className="opacity-40">·</span>}
                            <span>{rankedItems.length} {rankedItems.length === 1 ? 'country' : 'countries'}</span>
                            {currentRankingId && !isDirty && (
                                <>
                                    <span className="opacity-40">·</span>
                                    <span className="inline-flex items-center gap-1 text-[var(--er-text-tertiary)]">
                                        <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                                        Saved
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {currentRankingId ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSaveUpdate}
                                    disabled={saving || !isDirty || isEmpty}
                                    title={isDirty ? 'Save changes' : 'No unsaved changes'}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:bg-[var(--er-button-neutral)]/40 disabled:text-[var(--er-text-subtle)] disabled:cursor-not-allowed transition-colors"
                                >
                                    <FontAwesomeIcon icon={faSave} />
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveNew}
                                    disabled={saving || isEmpty}
                                    title="Save as a new copy"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    New copy
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSaveNew}
                                disabled={saving || isEmpty}
                                title="Save"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:bg-[var(--er-button-neutral)]/40 disabled:text-[var(--er-text-subtle)] disabled:cursor-not-allowed transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Save
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Saved rankings list */}
            <div>
                <div className={`${sectionLabel} mb-2 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <span>Saved rankings</span>
                        {rankings && rankings.length > 0 && (
                            <span className="normal-case tracking-normal text-[var(--er-text-subtle)] font-normal">
                                {rankings.length}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={loading}
                        className="w-6 h-6 inline-flex items-center justify-center rounded text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 disabled:opacity-40 transition-colors"
                        title="Refresh"
                    >
                        <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {loading && (
                    <div className="text-xs text-[var(--er-text-subtle)] py-2">Loading…</div>
                )}
                {error && (
                    <div className="text-xs text-red-400 py-2">{error}</div>
                )}
                {!loading && !error && rankings && rankings.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[var(--er-border-lightest)] dark:border-[var(--er-border-darker)] py-6 text-center text-xs text-[var(--er-text-subtle)]">
                        Nothing saved yet.
                    </div>
                )}
                {!loading && !error && rankings && rankings.length > 0 && (
                    <ul className="space-y-1">
                        {rankings.map((r) => {
                            const isCurrent = currentRankingId === r.ranking_id;
                            return (
                                <li
                                    key={r.ranking_id}
                                    className={`group relative rounded-md px-3 py-2.5 flex flex-col gap-2 transition-colors ${
                                        isCurrent
                                            ? 'bg-[var(--er-button-primary)]/10 ring-1 ring-inset ring-[var(--er-button-primary)]/30'
                                            : 'hover:bg-[var(--er-button-neutral)]/20'
                                    }`}
                                >
                                    {renameId === r.ranking_id ? (
                                        <input
                                            className={inputClass}
                                            value={renameValue}
                                            autoFocus
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameSubmit(r);
                                                if (e.key === 'Escape') setRenameId(null);
                                            }}
                                            onBlur={() => handleRenameSubmit(r)}
                                        />
                                    ) : (
                                        <>
                                            {/* Title gets the full row width so it isn't squeezed
                                                by the action buttons (which now live below). */}
                                            <div className="min-w-0">
                                                <div className="font-medium text-[var(--er-text-primary)] flex items-center gap-2">
                                                    <span className="truncate">{r.name || <i className="text-[var(--er-text-subtle)]">Untitled</i>}</span>
                                                    {r.public && (
                                                        <span
                                                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-[var(--er-text-tertiary)] bg-[var(--er-button-neutral)]/40 px-1.5 py-0.5 rounded shrink-0"
                                                        >
                                                            <FontAwesomeIcon icon={faGlobe} className="text-[9px]" />
                                                            Public
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-[var(--er-text-subtle)] mt-0.5">
                                                    {r.year ? `${r.year} · ` : ''}
                                                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                                                </div>
                                            </div>
                                            {/* Labeled actions wrap onto as many lines as needed. */}
                                            <div className="flex flex-wrap items-center gap-1 -ml-1.5">
                                                <button
                                                    type="button"
                                                    className={actionBtn}
                                                    onClick={() => handleLoad(r)}
                                                >
                                                    <FontAwesomeIcon icon={faUpload} className="text-xs" />
                                                    Load
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${actionBtn} ${r.public ? '!text-[var(--er-text-primary)]' : ''}`}
                                                    onClick={() => handleTogglePublic(r)}
                                                >
                                                    <FontAwesomeIcon icon={r.public ? faLock : faGlobe} className="text-xs" />
                                                    {r.public ? 'Make private' : 'Make public'}
                                                </button>
                                                {r.public && (
                                                    <button
                                                        type="button"
                                                        className={actionBtn}
                                                        onClick={() => handleCopyShareLink(r)}
                                                    >
                                                        <FontAwesomeIcon icon={faLink} className="text-xs" />
                                                        Copy link
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className={`${actionBtn} ${r.group_ids && r.group_ids.length > 0 ? '!text-[var(--er-text-primary)]' : ''}`}
                                                    onClick={() => openShare(r)}
                                                >
                                                    <FontAwesomeIcon icon={faShareNodes} className="text-xs" />
                                                    {r.group_ids && r.group_ids.length > 0
                                                        ? `Shared · ${r.group_ids.length}`
                                                        : 'Share'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={actionBtn}
                                                    onClick={() => {
                                                        setRenameId(r.ranking_id);
                                                        setRenameValue(r.name || '');
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                                                    Rename
                                                </button>
                                                <button
                                                    type="button"
                                                    className={dangerActionBtn}
                                                    onClick={() => setConfirmDelete(r)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <GlobalConfirmationModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete) handleDelete(confirmDelete);
                }}
                message={`Delete "${confirmDelete?.name || 'Untitled'}"? This can't be undone.`}
            />

            <GlobalConfirmationModal
                isOpen={!!confirmLoad}
                onClose={() => setConfirmLoad(null)}
                onConfirm={() => {
                    if (confirmLoad) doLoad(confirmLoad);
                }}
                message={`You have unsaved changes. Discard them and load "${confirmLoad?.name || 'Untitled'}"?`}
            />

            {shareTarget && (
                <div
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShareTarget(null)}
                >
                    <div
                        className="w-full sm:max-w-md bg-[var(--er-surface-secondary)] rounded-t-xl sm:rounded-xl ring-1 ring-white/10 shadow-2xl shadow-black/40 p-5 sm:m-4 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-[var(--er-text-primary)] truncate">
                                    Share with groups
                                </h3>
                                <p className="text-xs text-[var(--er-text-subtle)] truncate">
                                    {shareTarget.name || 'Untitled'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShareTarget(null)}
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
                                    const current = rankings?.find(x => x.ranking_id === shareTarget.ranking_id) ?? shareTarget;
                                    const shared = !!current.group_ids?.includes(g.id);
                                    const pending = pendingShareToggle === g.id;
                                    return (
                                        <li key={g.id}>
                                            <button
                                                type="button"
                                                disabled={pending}
                                                onClick={() => toggleShare(current, g.id, shared)}
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
            )}
        </div>
    );
};

export default SavedRankingsTab;
