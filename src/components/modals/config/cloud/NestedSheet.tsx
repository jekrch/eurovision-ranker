import React from 'react';

import ModalHeader from '../../ModalHeader';
import { modalBackdrop, modalPanel } from '../../modalStyles';

// Lightweight inline sheet for in-tab forms. Avoids stacking real Modal
// components (which interferes with focus and outside-click handling), so it
// wears the shared panel and header itself.
const NestedSheet: React.FC<{
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ onClose, title, subtitle, children }) => (
  <div
    className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center ${modalBackdrop}`}
    onClick={onClose}
  >
    <div
      className={`w-full sm:max-w-md bg-[var(--er-surface-secondary)] m-0 sm:m-4 rounded-b-none sm:rounded-b-2xl max-h-[85vh] overflow-y-auto [scrollbar-gutter:stable] ${modalPanel}`}
      onClick={(e) => e.stopPropagation()}
    >
      <ModalHeader title={title} subtitle={subtitle} onClose={onClose} size="sm" />
      <div className="px-5 py-4">{children}</div>
    </div>
  </div>
);

export default NestedSheet;
