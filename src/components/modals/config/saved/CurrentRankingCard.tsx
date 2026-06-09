import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSave, faCheck } from '@fortawesome/free-solid-svg-icons';
import { CountryContestant } from '../../../../data/CountryContestant';
import { sectionLabel } from '../cloud/styles';

// The "Current ranking" card: shows the working ranking's name/year/size plus
// the Save / Save-changes / New-copy actions, branching on whether the current
// ranking is already associated with a saved id.
const CurrentRankingCard: React.FC<{
    name: string;
    year: string;
    rankedItems: CountryContestant[];
    currentRankingId: string | null;
    isDirty: boolean;
    isEmpty: boolean;
    saving: boolean;
    onSaveUpdate: () => void;
    onSaveNew: () => void;
}> = ({ name, year, rankedItems, currentRankingId, isDirty, isEmpty, saving, onSaveUpdate, onSaveNew }) => (
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
                            onClick={onSaveUpdate}
                            disabled={saving || !isDirty || isEmpty}
                            title={isDirty ? 'Save changes' : 'No unsaved changes'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:bg-[var(--er-button-neutral)]/40 disabled:text-[var(--er-text-subtle)] disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faSave} />
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={onSaveNew}
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
                        onClick={onSaveNew}
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
);

export default CurrentRankingCard;
