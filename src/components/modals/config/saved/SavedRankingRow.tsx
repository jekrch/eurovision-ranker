import {
  faTrash,
  faUpload,
  faPen,
  faGlobe,
  faLock,
  faLink,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { UserRanking } from '../../../../utilities/api/types';
import { actionBtn, dangerActionBtn, inputClass } from '../cloud/styles';

// A single saved-ranking list row: either the inline rename field or the
// title + metadata + labeled action chips (load / public toggle / share /
// rename / delete).
const SavedRankingRow: React.FC<{
  ranking: UserRanking;
  isCurrent: boolean;
  isRenaming: boolean;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onRenameStart: () => void;
  onLoad: () => void;
  onTogglePublic: () => void;
  onCopyShareLink: () => void;
  onShare: () => void;
  onDelete: () => void;
}> = ({
  ranking: r,
  isCurrent,
  isRenaming,
  renameValue,
  setRenameValue,
  onRenameSubmit,
  onRenameCancel,
  onRenameStart,
  onLoad,
  onTogglePublic,
  onCopyShareLink,
  onShare,
  onDelete,
}) => (
  <li
    className={`group relative rounded-md px-3 py-2.5 flex flex-col gap-2 transition-colors ${
      isCurrent
        ? 'bg-[var(--er-button-primary)]/10 ring-1 ring-inset ring-[var(--er-button-primary)]/30'
        : 'hover:bg-[var(--er-button-neutral)]/20'
    }`}
  >
    {isRenaming ? (
      <input
        className={inputClass}
        value={renameValue}
        autoFocus
        onChange={(e) => setRenameValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onRenameSubmit();
          if (e.key === 'Escape') onRenameCancel();
        }}
        onBlur={onRenameSubmit}
      />
    ) : (
      <>
        {/* Title gets the full row width so it isn't squeezed
                    by the action buttons (which now live below). */}
        <div className="min-w-0">
          <div className="font-medium text-[var(--er-text-primary)] flex items-center gap-2">
            <span className="truncate">
              {r.name || <i className="text-[var(--er-text-subtle)]">Untitled</i>}
            </span>
            {r.public && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-[var(--er-text-tertiary)] bg-[var(--er-button-neutral)]/40 px-1.5 py-0.5 rounded shrink-0">
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
          <button type="button" className={actionBtn} onClick={onLoad}>
            <FontAwesomeIcon icon={faUpload} className="text-xs" />
            Load
          </button>
          <button
            type="button"
            className={`${actionBtn} ${r.public ? '!text-[var(--er-text-primary)]' : ''}`}
            onClick={onTogglePublic}
          >
            <FontAwesomeIcon icon={r.public ? faLock : faGlobe} className="text-xs" />
            {r.public ? 'Make private' : 'Make public'}
          </button>
          {r.public && (
            <button type="button" className={actionBtn} onClick={onCopyShareLink}>
              <FontAwesomeIcon icon={faLink} className="text-xs" />
              Copy link
            </button>
          )}
          <button
            type="button"
            className={`${actionBtn} ${r.group_ids && r.group_ids.length > 0 ? '!text-[var(--er-text-primary)]' : ''}`}
            onClick={onShare}
          >
            <FontAwesomeIcon icon={faShareNodes} className="text-xs" />
            {r.group_ids && r.group_ids.length > 0 ? `Shared · ${r.group_ids.length}` : 'Share'}
          </button>
          <button type="button" className={actionBtn} onClick={onRenameStart}>
            <FontAwesomeIcon icon={faPen} className="text-xs" />
            Rename
          </button>
          <button type="button" className={dangerActionBtn} onClick={onDelete}>
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
            Delete
          </button>
        </div>
      </>
    )}
  </li>
);

export default SavedRankingRow;
