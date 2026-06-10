import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAppDispatch, useAppSelector } from '../../../../hooks/stateHooks';
import { useRankingDirty } from '../../../../hooks/useRankingDirty';
import {
  setCurrentRankingId,
  setLastSavedSignature,
  setName,
  clearCurrentRanking,
  logout,
  setSavedRankings,
  upsertSavedRanking,
  removeSavedRanking,
  setGroups,
  addGroupIdToRanking,
  removeGroupIdFromRanking,
} from '../../../../redux/rootSlice';
import { AppState } from '../../../../redux/store';
import {
  listGroups,
  shareRankingWithGroup,
  unshareRankingFromGroup,
} from '../../../../utilities/api/groups';
import { MAX_RANKING_LENGTH } from '../../../../utilities/api/rankingParams';
import {
  listRankings,
  createRanking,
  updateRanking,
  deleteRanking,
} from '../../../../utilities/api/rankings';
import { signatureFromRanking } from '../../../../utilities/api/rankingSignature';
import { ApiError, UserRanking } from '../../../../utilities/api/types';
import { logger } from '../../../../utilities/logger';
import { apiErrToast, yearToNumber } from '../cloud/helpers';

/**
 * Controller hook for the Saved Rankings tab: owns the network state, the cache
 * sync to Redux, and every save/load/share/rename/delete action. The tab shell
 * is purely presentational and reads everything from here.
 */
export function useSavedRankings() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s: AppState) => s.auth.user);
  const name = useAppSelector((s: AppState) => s.root.name);
  const year = useAppSelector((s: AppState) => s.root.year);
  const rankedItems = useAppSelector((s: AppState) => s.root.rankedItems);
  const currentRankingId = useAppSelector((s: AppState) => s.auth.currentRankingId);

  const rankings = useAppSelector((s: AppState) => s.auth.savedRankings);
  const groups = useAppSelector((s: AppState) => s.groups.groups);
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

  const { rankingParams, isDirty, isEmpty } = useRankingDirty();

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
      toast.error(
        `Ranking too large (${rankingParams.length}/${MAX_RANKING_LENGTH} chars). Try removing a category.`,
      );
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
            : "You've reached your saved-ranking limit.",
        );
      } else if (e instanceof ApiError) {
        toast.error(e.body?.trim() || `Failed to save (status ${e.status} ${e.kind}).`);
      } else {
        logger.error('handleSaveNew: unexpected error', e);
        toast.error(`Failed to save: ${(e instanceof Error ? e.message : undefined) ?? String(e)}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUpdate = async () => {
    if (!currentRankingId) return;
    if (rankingParams.length > MAX_RANKING_LENGTH) {
      toast.error(
        `Ranking too large (${rankingParams.length}/${MAX_RANKING_LENGTH} chars). Try removing a category.`,
      );
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
      apiErrToast(e, 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Navigate the current window to the ?id= URL so the app boots into its
  // public-view-by-id flow (App.loadPublicRankingById). That path keeps the
  // id in the URL and sets the loaded-author metadata, matching how shared
  // rankings open from the Groups tab.
  const doLoad = (r: UserRanking) => {
    window.location.assign(`${window.location.pathname}?id=${encodeURIComponent(r.ranking_id)}`);
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
      apiErrToast(e, 'Failed to delete.');
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
      apiErrToast(e, 'Failed to update.');
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
        apiErrToast(e, 'Failed to load groups.');
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
      apiErrToast(e, 'Failed to update sharing.');
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
      apiErrToast(e, 'Failed to rename.');
    }
  };

  return {
    // store-derived state
    user,
    name,
    year,
    rankedItems,
    currentRankingId,
    rankings,
    groups,
    isDirty,
    isEmpty,
    // network / local state
    loading,
    error,
    saving,
    shareTarget,
    shareLoading,
    pendingShareToggle,
    // inline-edit + confirm state
    renameId,
    setRenameId,
    renameValue,
    setRenameValue,
    confirmDelete,
    setConfirmDelete,
    confirmLoad,
    setConfirmLoad,
    setShareTarget,
    // actions
    refresh,
    handleSaveNew,
    handleSaveUpdate,
    doLoad,
    handleLoad,
    handleDelete,
    handleTogglePublic,
    handleCopyShareLink,
    openShare,
    toggleShare,
    handleRenameSubmit,
    logout: () => dispatch(logout()),
  };
}
