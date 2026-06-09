import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import { AppState } from '../../../redux/store';
import { patchUser } from '../../../redux/rootSlice';
import { updateUsername } from '../../../utilities/api/me';
import { ApiError } from '../../../utilities/api/types';

const sectionLabel =
    'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--er-text-subtle)]';
const inputClass =
    'border text-sm rounded-md block w-full p-2 bg-[color:var(--er-surface-primary)] border-white/5 placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/40 focus:border-[var(--er-button-primary)]/40';

/**
 * Account-panel control for viewing and setting the unique site username.
 * The username is how a user is attributed when others open their shared
 * rankings, so this is the one place it can be claimed/changed.
 */
const UsernameField: React.FC = () => {
    const dispatch = useAppDispatch();
    const username = useAppSelector((s: AppState) => s.auth.user?.username);

    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const beginEdit = () => {
        setValue(username || '');
        setError(null);
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setError(null);
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const updated = await updateUsername(value.trim());
            dispatch(patchUser({ username: updated.username }));
            toast.success('Username updated.');
            setEditing(false);
        } catch (e) {
            if (e instanceof ApiError) {
                // The API returns clear messages for both invalid (400) and
                // taken (409) usernames; surface them inline.
                setError(e.body?.trim() || e.message || 'Could not set username.');
            } else {
                setError('Could not set username.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className={`${sectionLabel} mb-1`}>Username</div>
            {editing ? (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={value}
                            autoFocus
                            maxLength={20}
                            spellCheck={false}
                            placeholder="3-20 letters, numbers, _"
                            disabled={saving}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') save();
                                if (e.key === 'Escape') cancel();
                            }}
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving || !value.trim()}
                            title="Save username"
                            className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-md text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:bg-[var(--er-button-neutral)]/40 disabled:text-[var(--er-text-subtle)] disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            disabled={saving}
                            title="Cancel"
                            className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 transition-colors"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                    {error && <div className="text-xs text-[var(--er-error,#f87171)]">{error}</div>}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    {username ? (
                        <span className="text-sm text-[var(--er-text-primary)] truncate">@{username}</span>
                    ) : (
                        <span className="text-sm italic text-[var(--er-text-subtle)]">Not set</span>
                    )}
                    <button
                        type="button"
                        onClick={beginEdit}
                        title={username ? 'Change username' : 'Set username'}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 transition-colors"
                    >
                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                        {username ? 'Change' : 'Set username'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UsernameField;
