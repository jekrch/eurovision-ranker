import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPen, faRightFromBracket, faRotate, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Group } from '../../../../utilities/api/types';
import GlobalConfirmationModal from '../../GlobalConfirmationModal';
import { sectionLabel, ghostBtn, iconBtn } from '../cloud/styles';
import { useGroupDetail } from './useGroupDetail';
import GroupAvatar from './GroupAvatar';
import GroupMembersSection from './GroupMembersSection';
import GroupInvitesSection from './GroupInvitesSection';
import GroupSharedRankingsSection from './GroupSharedRankingsSection';
import EditGroupModal from './EditGroupModal';

const GroupDetailView: React.FC<{
    groupId: string;
    cached?: Group;
    onBack: () => void;
    onLeftOrDeleted: () => void;
}> = ({ groupId, cached, onBack, onLeftOrDeleted }) => {
    const d = useGroupDetail(groupId, cached, onLeftOrDeleted);
    const { detail, isOwner, loading } = d;

    // Render the faded group-image backdrop into the modal shell (outside the
    // scrolling tab area) so it can bleed to the modal edges. `top` is the
    // scroll container's offset, which lines the backdrop up just under the nav.
    const rootRef = useRef<HTMLDivElement>(null);
    const [bg, setBg] = useState<{ host: HTMLElement; top: number } | null>(null);
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || !detail?.image_url) { setBg(null); return; }
        const host = root.closest('[data-modal-content]') as HTMLElement | null;
        const scroller = root.closest('.overflow-y-auto') as HTMLElement | null;
        if (!host || !scroller) { setBg(null); return; }
        setBg({ host, top: scroller.offsetTop });
    }, [detail?.image_url]);

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
        <div ref={rootRef} className="text-sm space-y-5">
            {/* Faded group image bled into the modal background for flavour.
                Portaled into the modal shell so it reaches the modal edges while
                stopping at the nav line; sits behind content via -z-10. */}
            {detail.image_url && bg && createPortal(
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 overflow-hidden rounded-b-xl"
                    style={{ top: bg.top }}
                >
                    <img
                        src={detail.image_url}
                        alt=""
                        className="w-full h-full object-cover opacity-[0.06] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
                    />
                </div>,
                bg.host
            )}

            {/* Header */}
            <div className="flex items-center gap-2">
                <button type="button" onClick={onBack} className={ghostBtn}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back
                </button>
                <button
                    type="button"
                    onClick={() => { d.fetchDetail(); d.fetchShared(); if (isOwner) d.fetchInvites(); }}
                    disabled={loading}
                    className={`${iconBtn} ml-auto`}
                    title="Refresh"
                >
                    <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex items-start gap-3">
                <GroupAvatar group={detail} size="lg" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--er-text-primary)] truncate">
                            {detail.name}
                        </h3>
                        {isOwner && (
                            <button
                                type="button"
                                onClick={() => d.setEditing(true)}
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
            <GroupMembersSection detail={detail} user={d.user} />

            {/* Invites (owner only) */}
            {isOwner && (
                <GroupInvitesSection
                    detail={detail}
                    invites={d.invites}
                    loadingInvites={d.loadingInvites}
                    onNewInvite={d.handleNewInvite}
                    onCopyInvite={d.handleCopyInvite}
                    onRevokeInvite={d.handleRevokeInvite}
                />
            )}

            {/* Shared rankings */}
            <GroupSharedRankingsSection
                sharedRankings={d.sharedRankings}
                loadingShares={d.loadingShares}
                user={d.user}
                onRefresh={d.fetchShared}
                onOpen={d.handleOpen}
                onConfirmUnshare={d.setConfirmUnshare}
            />

            {/* Danger zone */}
            <section className="pt-2 border-t border-white/5">
                {isOwner ? (
                    <button
                        type="button"
                        onClick={() => d.setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete group
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => d.setConfirmLeave(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                    >
                        <FontAwesomeIcon icon={faRightFromBracket} />
                        Leave group
                    </button>
                )}
            </section>

            {d.editing && (
                <EditGroupModal
                    group={detail}
                    onClose={() => d.setEditing(false)}
                />
            )}

            <GlobalConfirmationModal
                isOpen={d.confirmDelete}
                onClose={() => d.setConfirmDelete(false)}
                onConfirm={d.handleDelete}
                message={`Delete "${detail.name}"? Members, invites, and shared rankings will be removed. This can't be undone.`}
            />
            <GlobalConfirmationModal
                isOpen={d.confirmLeave}
                onClose={() => d.setConfirmLeave(false)}
                onConfirm={d.handleLeave}
                message={`Leave "${detail.name}"? You'll lose access to anything shared with this group.`}
            />
            <GlobalConfirmationModal
                isOpen={!!d.confirmUnshare}
                onClose={() => d.setConfirmUnshare(null)}
                onConfirm={() => { if (d.confirmUnshare) d.handleUnshare(d.confirmUnshare); }}
                message={`Stop sharing "${d.confirmUnshare?.name || 'this ranking'}" with the group?`}
            />
            <GlobalConfirmationModal
                isOpen={!!d.confirmLoad}
                onClose={() => d.setConfirmLoad(null)}
                onConfirm={() => { if (d.confirmLoad) d.openById(d.confirmLoad.ranking_id); }}
                message={`You have unsaved changes. Discard them and load "${d.confirmLoad?.name || 'Untitled'}"?`}
            />
        </div>
    );
};

export default GroupDetailView;
