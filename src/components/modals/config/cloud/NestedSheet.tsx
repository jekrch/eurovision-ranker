import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

// Lightweight inline sheet for in-tab forms. Avoids stacking real Modal
// components (which interferes with focus and outside-click handling).
const NestedSheet: React.FC<{
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ onClose, title, children }) => (
  <div
    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="w-full sm:max-w-md bg-[var(--er-surface-secondary)] rounded-t-xl sm:rounded-xl ring-1 ring-white/10 shadow-2xl shadow-black/40 p-5 m-0 sm:m-4 max-h-[85vh] overflow-y-auto [scrollbar-gutter:stable]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--er-text-primary)]">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/5"
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default NestedSheet;
