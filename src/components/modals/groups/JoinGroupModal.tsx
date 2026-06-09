import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faShieldHalved, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import Modal from '../Modal';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import { AppState } from '../../../redux/store';
import { acceptInvite, previewInvite } from '../../../utilities/api/groups';
import { ApiError, GroupInvitePreview } from '../../../utilities/api/types';
import { setGroups } from '../../../redux/rootSlice';

interface JoinGroupModalProps {
    isOpen: boolean;
    token: string | null;
    onClose: () => void;
    onSignInRequired: () => void;
    onJoined: (groupId: string) => void;
}

const primaryBtn =
    'w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] shadow-sm shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const secondaryBtn =
    'w-full font-medium py-2.5 px-4 rounded-lg text-sm text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-white/[0.04] transition-colors';

const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, token, onClose, onSignInRequired, onJoined }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s: AppState) => s.auth.user);

    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<GroupInvitePreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);

    const fetchPreview = useCallback(async () => {
        if (!token || !user) return;
        setLoading(true);
        setError(null);
        try {
            const p = await previewInvite(token);
            setPreview(p);
        } catch (e) {
            if (e instanceof ApiError && e.kind === 'gone') {
                setError("This invite link is no longer valid. Ask the group owner for a new one.");
            } else if (e instanceof ApiError) {
                setError(e.body?.trim() || 'Failed to load invite.');
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        if (isOpen && token && user) fetchPreview();
        if (!isOpen) {
            setPreview(null);
            setError(null);
            setAccepting(false);
        }
    }, [isOpen, token, user, fetchPreview]);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        try {
            const res = await acceptInvite(token);
            // Invalidate the cached groups list so the next open of the
            // Groups tab refetches and shows the new membership.
            dispatch(setGroups(null));
            toast.success(res.group_name ? `Joined "${res.group_name}".` : 'Joined group.');
            if (res.group_id) onJoined(res.group_id);
            onClose();
        } catch (e) {
            if (e instanceof ApiError && e.kind === 'gone') {
                setError("This invite link is no longer valid.");
            } else if (e instanceof ApiError) {
                setError(e.body?.trim() || 'Failed to join.');
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setAccepting(false);
        }
    };

    // Not signed in: prompt sign-in. We keep the modal open so the token
    // is still in URL state when they come back.
    if (isOpen && !user) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} className="max-w-md !p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-black/30 via-black/10 to-transparent border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white shadow-sm shrink-0">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-[var(--er-text-primary)] leading-tight truncate">
                                Join a group
                            </h2>
                            <p className="text-xs text-[var(--er-text-subtle)] mt-0.5">
                                Sign in to accept this invite.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm text-[var(--er-text-tertiary)]">
                        You need an account to join. Sign in or create one, then reopen the link.
                    </p>
                    <button type="button" onClick={onSignInRequired} className={primaryBtn}>
                        Sign In
                    </button>
                    <button type="button" onClick={onClose} className={secondaryBtn}>
                        Not now
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md !p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-black/30 via-black/10 to-transparent border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white shadow-sm shrink-0">
                        <FontAwesomeIcon icon={faUserGroup} className="text-sm" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-[var(--er-text-primary)] leading-tight truncate">
                            Join a group
                        </h2>
                        <p className="text-xs text-[var(--er-text-subtle)] mt-0.5">
                            You've been invited to a Eurovision Ranker group.
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 space-y-4">
                {loading && (
                    <div className="text-xs text-[var(--er-text-subtle)]">Loading invite…</div>
                )}

                {error && (
                    <div className="flex gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 mt-0.5 shrink-0" />
                        <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">{error}</div>
                    </div>
                )}

                {!loading && !error && preview && (
                    <>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--er-button-neutral)]/15">
                            {preview.image_url ? (
                                <img src={preview.image_url} alt="" className="w-12 h-12 rounded-md object-cover ring-1 ring-white/10 shrink-0" />
                            ) : (
                                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white font-semibold shrink-0">
                                    {(preview.group_name || '?').trim().charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold text-[var(--er-text-primary)] truncate">
                                    {preview.group_name}
                                </div>
                                {preview.description && (
                                    <p className="text-xs text-[var(--er-text-subtle)] mt-0.5 line-clamp-3 whitespace-pre-line break-words">
                                        {preview.description}
                                    </p>
                                )}
                                <div className="text-[11px] text-[var(--er-text-subtle)] mt-1">
                                    {preview.member_count} {preview.member_count === 1 ? 'member' : 'members'}
                                </div>
                            </div>
                        </div>

                        {preview.already_member ? (
                            <>
                                <p className="text-sm text-[var(--er-text-tertiary)]">
                                    You're already a member of this group.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { onJoined(preview.group_id); onClose(); }}
                                    className={primaryBtn}
                                >
                                    Open group
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAccept}
                                disabled={accepting}
                                className={primaryBtn}
                            >
                                {accepting ? 'Joining…' : `Join ${preview.group_name}`}
                            </button>
                        )}
                        <button type="button" onClick={onClose} className={secondaryBtn}>
                            Not now
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default JoinGroupModal;
