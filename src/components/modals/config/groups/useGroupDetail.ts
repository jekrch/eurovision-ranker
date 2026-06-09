import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppState } from '../../../../redux/store';
import { useAppDispatch, useAppSelector } from '../../../../hooks/stateHooks';
import { useRankingDirty } from '../../../../hooks/useRankingDirty';
import {
    addGroupInvite,
    removeGroup,
    removeGroupIdFromRanking,
    removeGroupInvite,
    setGroupDetail,
    setGroupInvites,
    setGroupSharedRankings,
} from '../../../../redux/rootSlice';
import {
    createInvite,
    deleteGroup,
    getGroup,
    leaveGroup,
    listGroupRankings,
    listInvites,
    revokeInvite,
    unshareRankingFromGroup,
} from '../../../../utilities/api/groups';
import { ApiError, Group, GroupInvite, SharedRanking } from '../../../../utilities/api/types';
import { apiErrToast } from '../cloud/helpers';

/**
 * Controller hook for the group-detail view: owns the per-group fetches
 * (members / shared rankings / invites), every mutation handler, and the
 * confirm-dialog state. The view shell stays presentational.
 */
export function useGroupDetail(
    groupId: string,
    cached: Group | undefined,
    onLeftOrDeleted: () => void,
) {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s: AppState) => s.auth.user);
    const sharedRankings = useAppSelector((s: AppState) => s.groups.groupSharedRankings[groupId]);
    const invites = useAppSelector((s: AppState) => s.groups.groupInvites[groupId]);
    const detail = useAppSelector((s: AppState) => s.groups.groupDetails[groupId]) ?? cached;

    const [loading, setLoading] = useState(false);
    const [loadingShares, setLoadingShares] = useState(false);
    const [loadingInvites, setLoadingInvites] = useState(false);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [confirmUnshare, setConfirmUnshare] = useState<SharedRanking | null>(null);
    const [confirmLoad, setConfirmLoad] = useState<SharedRanking | null>(null);

    const currentRankingId = useAppSelector((s: AppState) => s.auth.currentRankingId);
    const { isDirty, isEmpty } = useRankingDirty();

    const isOwner = detail?.role === 'owner';

    // Navigate the current window to the ?id= URL so the app boots into its
    // public-view-by-id flow (App.loadPublicRankingById). That path keeps the
    // id in the URL and sets the loaded-author metadata — which the profile
    // tab's in-place load deliberately strips, so we can't reuse it here.
    const openById = (rankingId: string) => {
        window.location.assign(
            `${window.location.pathname}?id=${encodeURIComponent(rankingId)}`
        );
    };

    // Same window instead of a new tab, but guard unsaved work first since the
    // navigation discards the current ranking (a new tab couldn't clobber it).
    const handleOpen = (r: SharedRanking) => {
        if (currentRankingId && currentRankingId !== r.ranking_id && isDirty && !isEmpty) {
            setConfirmLoad(r);
            return;
        }
        openById(r.ranking_id);
    };

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

    return {
        user,
        detail,
        sharedRankings,
        invites,
        isOwner,
        loading,
        loadingShares,
        loadingInvites,
        editing,
        setEditing,
        confirmDelete,
        setConfirmDelete,
        confirmLeave,
        setConfirmLeave,
        confirmUnshare,
        setConfirmUnshare,
        confirmLoad,
        setConfirmLoad,
        openById,
        handleOpen,
        fetchDetail,
        fetchShared,
        fetchInvites,
        handleDelete,
        handleLeave,
        handleNewInvite,
        handleCopyInvite,
        handleRevokeInvite,
        handleUnshare,
    };
}
