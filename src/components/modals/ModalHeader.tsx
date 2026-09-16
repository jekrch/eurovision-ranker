import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

import { hairline, iconChip } from './modalStyles';

type ModalHeaderProps = {
  title: string;
  subtitle?: string;
  /** Rendered to the left of the title. */
  icon?: IconDefinition;
  /**
   * How that icon is dressed. 'tile' is the filled gradient square the account
   * and group surfaces lead with; 'chip' is the faint wash used in the welcome
   * overlay's feature list, for headings that shouldn't pull the eye first.
   */
  iconVariant?: 'tile' | 'chip';
  /**
   * Only for surfaces that draw their own dismiss control — the shared Modal
   * already renders one, so modals wrapped in it should leave this off.
   */
  onClose?: () => void;
  /** 'sm' suits the inline sheets, whose panels are padded more tightly. */
  size?: 'sm' | 'md';
};

/**
 * The standard modal heading: an optional icon, the title and its
 * one-line explanation, over a wash that fades into the panel and closes with
 * the shared hairline.
 */
const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconVariant = 'tile',
  onClose,
  size = 'md',
}) => (
  <div
    className={classNames(
      'relative bg-gradient-to-b from-black/30 via-black/10 to-transparent',
      size === 'sm' ? 'px-5 pt-5 pb-3' : 'px-6 pt-6 pb-4',
    )}
  >
    <div className={classNames('flex items-center', iconVariant === 'chip' ? 'gap-2.5' : 'gap-3')}>
      {icon &&
        (iconVariant === 'chip' ? (
          <div className={classNames(iconChip, 'text-[var(--er-text-subtle)]')}>
            <FontAwesomeIcon icon={icon} className="text-[0.7rem]" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white shadow-sm shadow-black/20 shrink-0">
            <FontAwesomeIcon icon={icon} className="text-sm" />
          </div>
        ))}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-[var(--er-text-primary)] leading-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[var(--er-text-subtle)] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/10 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
    <div className={classNames(hairline, 'absolute inset-x-0 bottom-0')}></div>
  </div>
);

export default ModalHeader;
