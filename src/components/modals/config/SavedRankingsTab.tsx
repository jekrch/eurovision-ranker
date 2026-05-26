import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUpload, faPen, faPlus, faSave, faRightFromBracket, faGlobe, faLock, faLink } from '@fortawesome/free-solid-svg-icons';
import { AppState } from '../../../redux/store';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import IconButton from '../../IconButton';
import GlobalConfirmationModal from '../GlobalConfirmationModal';
import {
    listRankings,
    createRanking,
    updateRanking,
    deleteRanking,
    getRanking,
} from '../../../utilities/api/rankings';
import { ApiError, UserRanking } from '../../../utilities/api/types';
import {
    setCurrentRankingId,
    setLastSavedSignature,
    setName,
    clearCurrentRanking,
    logout,
} from '../../../redux/rootSlice';
import { buildSignature, signatureFromRanking } from '../../../utilities/api/rankingSignature';
import { encodeRankingsToURL, getUrlParam, updateQueryParams, urlParamHasValue } from '../../../utilities/UrlUtil';

interface SavedRankingsTabProps {
    openAuthModal: () => void;
}

const sectionTitle = 'font-bold ml-0 whitespace-nowrap text-sm';
const inputClass =
    'border text-sm rounded-md block w-full p-2 bg-[var(--er-border-subtle)] border-[var(--er-border-medium)] placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent';

function currentEncodedRanking(rankedItems: any[]): string {
    const isGlobal = urlParamHasValue('g', 't');
    return encodeRankingsToURL(rankedItems, isGlobal);
}

function currentVoteCode(): string {
    return getUrlParam('v') ?? '';
}

function yearToNumber(year: string | undefined): number | undefined {
    if (!year) return undefined;
    return /^\d+$/.test(year) ? Number(year) : undefined;
}

const SavedRankingsTab: React.FC<SavedRankingsTabProps> = ({ openAuthModal }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s: AppState) => s.user);
    const name = useAppSelector((s: AppState) => s.name);
    const year = useAppSelector((s: AppState) => s.year);
    const rankedItems = useAppSelector((s: AppState) => s.rankedItems);
    const currentRankingId = useAppSelector((s: AppState) => s.currentRankingId);
    const lastSavedSignature = useAppSelector((s: AppState) => s.lastSavedSignature);

    const [rankings, setRankings] = useState<UserRanking[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<UserRanking | null>(null);
    const [confirmLoad, setConfirmLoad] = useState<UserRanking | null>(null);
    const [saving, setSaving] = useState(false);

    const encodedRanking = useMemo(() => currentEncodedRanking(rankedItems), [rankedItems]);
    const voteCode = currentVoteCode();
    const currentSignature = useMemo(
        () =>
            buildSignature({
                name: name || '',
                description: '',
                year: year || '',
                ranking: encodedRanking,
                voteCode,
                isPublic: false,
            }),
        [name, year, encodedRanking, voteCode]
    );

    const isDirty = currentRankingId
        ? lastSavedSignature !== currentSignature
        : true;
    const isEmpty = !encodedRanking || encodedRanking === '>' || encodedRanking.length === 0;

    const refresh = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const list = await listRankings();
            setRankings(list ?? []);
        } catch (e) {
            if (e instanceof ApiError) setError(e.body?.trim() || e.message);
            else setError('Failed to load rankings.');
        } finally {
            setLoading(false);
        }
    }, [user]);

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
        setSaving(true);
        try {
            const created = await createRanking({
                name: name || 'Untitled',
                description: '',
                year: yearToNumber(year),
                ranking: encodedRanking,
                public: false,
                group_ids: [],
            });
            dispatch(setCurrentRankingId(created.ranking_id));
            dispatch(setLastSavedSignature(signatureFromRanking(created, voteCode)));
            toast.success('Saved.');
            await refresh();
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
                ranking: encodedRanking,
                public: existing?.public ?? false,
            });
            dispatch(setLastSavedSignature(signatureFromRanking(updated, voteCode)));
            toast.success('Changes saved.');
            await refresh();
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
            const params: Record<string, string | undefined> = {
                r: full.ranking,
                n: full.name,
                y: full.year != null ? String(full.year).slice(-2) : undefined,
            };
            updateQueryParams(params);
            dispatch(setName(full.name || ''));
            dispatch(setCurrentRankingId(full.ranking_id));
            dispatch(setLastSavedSignature(signatureFromRanking(full, voteCode)));
            // Trigger a reload via popstate-ish nudge. The existing App.tsx watches
            // `year` changes and reloads rankings from URL — set year to fire it.
            if (full.year) {
                // setting name above already triggers update; year change will
                // call loadRankingsFromURL via the existing year-effect.
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
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
            toast.success('Deleted.');
            await refresh();
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
                dispatch(setLastSavedSignature(signatureFromRanking(updated, voteCode)));
            }
            toast.success(updated.public ? 'Now public — share the link.' : 'Made private.');
            await refresh();
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
                dispatch(setLastSavedSignature(signatureFromRanking(updated, voteCode)));
            }
            setRenameId(null);
            toast.success('Renamed.');
            await refresh();
        } catch (e) {
            if (e instanceof ApiError) toast.error(e.body?.trim() || 'Failed to rename.');
            else toast.error('Failed to rename.');
        }
    };

    if (!user) {
        return (
            <div className="text-sm text-[var(--er-text-tertiary)]">
                <p className="mb-3">Sign in to save and sync your rankings across devices.</p>
                {/* <p className="text-xs text-[var(--er-text-subtle)] mb-4">
                    Saved rankings are tied to your account. They're saved manually; nothing is
                    auto-uploaded.
                </p> */}
                <button
                    type="button"
                    onClick={openAuthModal}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] rounded-md"
                >
                    Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="text-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-xs text-[var(--er-text-subtle)]">Signed in as</div>
                    <div className="truncate text-[var(--er-text-primary)]">{user.email}</div>
                </div>
                <button
                    type="button"
                    onClick={() => dispatch(logout())}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--er-text-primary)] bg-[var(--er-button-neutral)] hover:bg-[var(--er-button-neutral-hover)] flex items-center gap-2 rounded-md"
                    title="Sign Out"
                >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Sign Out
                </button>
            </div>

            <div className="mb-4">
                <div className={sectionTitle}>Current ranking</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="text-[var(--er-text-tertiary)] flex-1 min-w-[10em]">
                        <div className="truncate">{name || <i>Untitled</i>}</div>
                        <div className="text-xs text-[var(--er-text-subtle)]">
                            {year ? `${year} · ` : ''}
                            {rankedItems.length} countries
                        </div>
                    </div>
                    {currentRankingId ? (
                        <IconButton
                            onClick={handleSaveUpdate}
                            disabled={saving || !isDirty || isEmpty}
                            className="!px-3 py-1"
                            icon={faSave}
                            title={isDirty ? 'Save changes' : 'No unsaved changes'}
                        />
                    ) : (
                        <IconButton
                            onClick={handleSaveNew}
                            disabled={saving || isEmpty}
                            className="!px-3 py-1"
                            icon={faPlus}
                            title="Save"
                        />
                    )}
                </div>
            </div>

            <div className="border-t border-[var(--er-border-lightest)] pt-3">
                <div className={sectionTitle}>Saved rankings</div>
                {loading && (
                    <div className="mt-2 text-xs text-[var(--er-text-subtle)]">Loading…</div>
                )}
                {error && (
                    <div className="mt-2 text-xs text-red-400">{error}</div>
                )}
                {!loading && !error && rankings && rankings.length === 0 && (
                    <div className="mt-2 text-xs text-[var(--er-text-subtle)]">
                        Nothing saved yet.
                    </div>
                )}
                {!loading && !error && rankings && rankings.length > 0 && (
                    <ul className="mt-2 divide-y divide-[var(--er-border-lightest)]">
                        {rankings.map((r) => (
                            <li
                                key={r.ranking_id}
                                className={`py-2 flex items-center gap-2 ${currentRankingId === r.ranking_id ? 'bg-[var(--er-button-secondary-hover)] bg-opacity-30' : ''}`}
                            >
                                <div className="flex-1 min-w-0">
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
                                            <div className="truncate font-medium text-[var(--er-text-primary)]">
                                                {r.name || <i>Untitled</i>}
                                            </div>
                                            <div className="text-xs text-[var(--er-text-subtle)]">
                                                {r.year ? `${r.year} · ` : ''}
                                                {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] px-2"
                                    title="Load"
                                    onClick={() => handleLoad(r)}
                                >
                                    <FontAwesomeIcon icon={faUpload} />
                                </button>
                                <button
                                    type="button"
                                    className={`px-2 ${r.public ? 'text-[var(--er-text-primary)]' : 'text-[var(--er-text-tertiary)]'} hover:text-[var(--er-text-primary)]`}
                                    title={r.public ? 'Public — click to make private' : 'Private — click to make public'}
                                    onClick={() => handleTogglePublic(r)}
                                >
                                    <FontAwesomeIcon icon={r.public ? faGlobe : faLock} />
                                </button>
                                {r.public && (
                                    <button
                                        type="button"
                                        className="text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] px-2"
                                        title="Copy share link"
                                        onClick={() => handleCopyShareLink(r)}
                                    >
                                        <FontAwesomeIcon icon={faLink} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] px-2"
                                    title="Rename"
                                    onClick={() => {
                                        setRenameId(r.ranking_id);
                                        setRenameValue(r.name || '');
                                    }}
                                >
                                    <FontAwesomeIcon icon={faPen} />
                                </button>
                                <button
                                    type="button"
                                    className="text-red-400 hover:text-red-300 px-2"
                                    title="Delete"
                                    onClick={() => setConfirmDelete(r)}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </li>
                        ))}
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
        </div>
    );
};

export default SavedRankingsTab;
