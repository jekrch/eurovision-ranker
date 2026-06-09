import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCircleInfo, faRotate } from '@fortawesome/free-solid-svg-icons';
import GlobalConfirmationModal from '../GlobalConfirmationModal';
import UsernameField from './UsernameField';
import { sectionLabel } from './cloud/styles';
import SignInPrompt from './cloud/SignInPrompt';
import { useSavedRankings } from './saved/useSavedRankings';
import AccountHeader from './saved/AccountHeader';
import CurrentRankingCard from './saved/CurrentRankingCard';
import SavedRankingRow from './saved/SavedRankingRow';
import ShareWithGroupsSheet from './saved/ShareWithGroupsSheet';

interface SavedRankingsTabProps {
    openAuthModal: () => void;
}

const SavedRankingsTab: React.FC<SavedRankingsTabProps> = ({ openAuthModal }) => {
    const c = useSavedRankings();

    if (!c.user) {
        return (
            <SignInPrompt
                icon={faUpload}
                title="Save your rankings"
                description="Sign in to save and sync your rankings across devices."
                onSignIn={openAuthModal}
            >
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
            </SignInPrompt>
        );
    }

    return (
        <div className="text-sm space-y-5">
            {/* Account header */}
            <AccountHeader email={c.user.email} onSignOut={c.logout} />

            {/* Username (how others see you when they open your shared rankings) */}
            <UsernameField />

            {/* Current ranking card */}
            <CurrentRankingCard
                name={c.name}
                year={c.year}
                rankedItems={c.rankedItems}
                currentRankingId={c.currentRankingId}
                isDirty={c.isDirty}
                isEmpty={c.isEmpty}
                saving={c.saving}
                onSaveUpdate={c.handleSaveUpdate}
                onSaveNew={c.handleSaveNew}
            />

            {/* Saved rankings list */}
            <div>
                <div className={`${sectionLabel} mb-2 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <span>Saved rankings</span>
                        {c.rankings && c.rankings.length > 0 && (
                            <span className="normal-case tracking-normal text-[var(--er-text-subtle)] font-normal">
                                {c.rankings.length}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={c.refresh}
                        disabled={c.loading}
                        className="w-6 h-6 inline-flex items-center justify-center rounded text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 disabled:opacity-40 transition-colors"
                        title="Refresh"
                    >
                        <FontAwesomeIcon icon={faRotate} className={`text-xs ${c.loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {c.loading && (
                    <div className="text-xs text-[var(--er-text-subtle)] py-2">Loading…</div>
                )}
                {c.error && (
                    <div className="text-xs text-red-400 py-2">{c.error}</div>
                )}
                {!c.loading && !c.error && c.rankings && c.rankings.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[var(--er-border-lightest)] dark:border-[var(--er-border-darker)] py-6 text-center text-xs text-[var(--er-text-subtle)]">
                        Nothing saved yet.
                    </div>
                )}
                {!c.loading && !c.error && c.rankings && c.rankings.length > 0 && (
                    <ul className="space-y-1">
                        {c.rankings.map((r) => (
                            <SavedRankingRow
                                key={r.ranking_id}
                                ranking={r}
                                isCurrent={c.currentRankingId === r.ranking_id}
                                isRenaming={c.renameId === r.ranking_id}
                                renameValue={c.renameValue}
                                setRenameValue={c.setRenameValue}
                                onRenameSubmit={() => c.handleRenameSubmit(r)}
                                onRenameCancel={() => c.setRenameId(null)}
                                onRenameStart={() => {
                                    c.setRenameId(r.ranking_id);
                                    c.setRenameValue(r.name || '');
                                }}
                                onLoad={() => c.handleLoad(r)}
                                onTogglePublic={() => c.handleTogglePublic(r)}
                                onCopyShareLink={() => c.handleCopyShareLink(r)}
                                onShare={() => c.openShare(r)}
                                onDelete={() => c.setConfirmDelete(r)}
                            />
                        ))}
                    </ul>
                )}
            </div>

            <GlobalConfirmationModal
                isOpen={!!c.confirmDelete}
                onClose={() => c.setConfirmDelete(null)}
                onConfirm={() => {
                    if (c.confirmDelete) c.handleDelete(c.confirmDelete);
                }}
                message={`Delete "${c.confirmDelete?.name || 'Untitled'}"? This can't be undone.`}
            />

            <GlobalConfirmationModal
                isOpen={!!c.confirmLoad}
                onClose={() => c.setConfirmLoad(null)}
                onConfirm={() => {
                    if (c.confirmLoad) c.doLoad(c.confirmLoad);
                }}
                message={`You have unsaved changes. Discard them and load "${c.confirmLoad?.name || 'Untitled'}"?`}
            />

            {c.shareTarget && (
                <ShareWithGroupsSheet
                    target={c.shareTarget}
                    groups={c.groups}
                    rankings={c.rankings}
                    shareLoading={c.shareLoading}
                    pendingShareToggle={c.pendingShareToggle}
                    onClose={() => c.setShareTarget(null)}
                    onToggleShare={c.toggleShare}
                />
            )}
        </div>
    );
};

export default SavedRankingsTab;
