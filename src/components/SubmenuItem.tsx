import { IconDefinition, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SubmenuContainerProps {
  buttonIcon: IconDefinition;
  text: string;
  children: React.ReactNode;
}

const SubmenuItem: React.FC<SubmenuContainerProps> = ({ buttonIcon, text, children }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [submenuStyle, setSubmenuStyle] = useState<React.CSSProperties>({
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 150ms ease-out, visibility 150ms ease-out',
  });
  const buttonRef = useRef<HTMLLIElement>(null);
  const submenuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!buttonRef.current) {
      return;
    }

    const triggerRect = buttonRef.current.getBoundingClientRect();
    // the parent menu <ul> — used to flank the whole menu, not just the item
    const menuRect = buttonRef.current.parentElement?.getBoundingClientRect() ?? triggerRect;
    // measured even while hidden (visibility: hidden keeps layout)
    const submenuHeight = submenuRef.current?.offsetHeight ?? 0;
    const submenuWidth = submenuRef.current?.offsetWidth ?? 0;
    const gap = 4;
    const margin = 8;

    // horizontal: flank the parent menu on whichever side has room,
    // preferring the left (the menu is right-aligned in the viewport)
    const spaceRight = window.innerWidth - menuRect.right;
    const spaceLeft = menuRect.left;
    let left: number;
    if (spaceLeft >= submenuWidth + gap + margin) {
      left = menuRect.left - submenuWidth - gap;
    } else if (spaceRight >= submenuWidth + gap + margin) {
      left = menuRect.right + gap;
    } else if (spaceLeft >= spaceRight) {
      // tight on both sides: hug the left edge to minimize overlap
      left = Math.max(margin, menuRect.left - submenuWidth - gap);
    } else {
      left = Math.min(menuRect.right + gap, window.innerWidth - submenuWidth - margin);
    }

    // vertical: align with the trigger, clamp so nothing is clipped
    let top = triggerRect.top;
    if (submenuHeight && top + submenuHeight + margin > window.innerHeight) {
      top = Math.max(margin, window.innerHeight - submenuHeight - margin);
    }

    setSubmenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxHeight: `${window.innerHeight - margin * 2}px`,
      overflowY: 'auto',
      opacity: isSubmenuOpen ? 1 : 0,
      visibility: isSubmenuOpen ? 'visible' : 'hidden',
      transition: 'opacity 150ms ease-out, visibility 150ms ease-out',
    });
  }, [isSubmenuOpen]);

  const toggleSubmenu = () => {
    setIsSubmenuOpen(!isSubmenuOpen);
  };

  return (
    <li
      ref={buttonRef}
      className={classNames(
        'relative text-[var(--er-text-secondary)] hover:bg-[var(--er-surface-tertiary)] hover:text-[var(--er-text-primary)] flex w-full cursor-pointer select-none items-center justify-between gap-2 px-3 py-2.5 text-start transition-colors duration-100',
        { 'bg-[var(--er-surface-tertiary)] text-[var(--er-text-primary)]': isSubmenuOpen },
      )}
      onClick={toggleSubmenu}
    >
      <div className="flex items-center">
        <div className="w-[1.2em] text-center">
          {buttonIcon && <FontAwesomeIcon icon={buttonIcon} />}
        </div>
        <p className={classNames('text-sm font-medium mx-2')}>{text}</p>
      </div>
      <FontAwesomeIcon
        icon={faChevronRight}
        className={`transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`}
      />
      {createPortal(
        <ul
          ref={submenuRef}
          style={submenuStyle}
          className="rounded-xl border border-[var(--er-border-subtle)] bg-[var(--er-surface-secondary)] shadow-2xl shadow-black/50 overflow-hidden flex flex-col min-w-[190px] z-50 py-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </ul>,
        document.body,
      )}
    </li>
  );
};

export default SubmenuItem;
