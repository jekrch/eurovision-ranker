import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  icon: IconDefinition;
  label: string;
  /** Render the label next to the icon instead of only as its accessible name. */
  showLabel?: boolean;
};

/**
 * One tab in a TabBar. The active tab is marked rather than underlined here —
 * the underline is a single element owned by the bar, so it can slide between
 * tabs. The transparent bottom border is kept so a tab reserves the same height
 * whether or not the underline is currently sitting on it.
 *
 * The inner span is what the underline measures itself against, so the line
 * tracks the icon (and label) rather than the button's much wider click target.
 */
const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, icon, label, showLabel }) => {
  return (
    <li className="mr-0 sm:mr-2">
      <button
        onClick={onClick}
        aria-label={label}
        title={label}
        data-tab-active={isActive}
        className={`inline-flex items-center justify-center px-[14px] sm:px-4 py-3 border-b-2 border-transparent transition-colors duration-200 ${isActive ? 'text-[var(--er-interactive-primary)]' : 'hover:text-[var(--er-text-muted)]'}`}
      >
        <span data-tab-indicator-target className="inline-flex items-center gap-2">
          <FontAwesomeIcon className="text-md" icon={icon} fixedWidth />
          {showLabel && <span className="text-sm">{label}</span>}
        </span>
      </button>
    </li>
  );
};

export default TabButton;
