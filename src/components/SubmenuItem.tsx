import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

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
    transition: 'opacity 150ms ease-out, visibility 150ms ease-out'
  });
  const buttonRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setSubmenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        right: `${window.innerWidth - rect.right}px`,
        opacity: isSubmenuOpen ? 1 : 0,
        visibility: isSubmenuOpen ? 'visible' : 'hidden',
        transition: 'opacity 150ms ease-out, visibility 150ms ease-out',
      });
    }
  }, [isSubmenuOpen]);

  const toggleSubmenu = () => {
    setIsSubmenuOpen(!isSubmenuOpen);
  };

  return (
    <li
      ref={buttonRef}
      className={
        classNames("relative text-[var(--er-text-secondary)] hover:bg-[var(--er-surface-tertiary)] hover:text-[var(--er-text-primary)] flex w-full cursor-pointer select-none items-center justify-between gap-2 px-3 py-2.5 text-start transition-colors duration-100",
        {"bg-[var(--er-surface-tertiary)] text-[var(--er-text-primary)]": isSubmenuOpen}
      )}
      onClick={toggleSubmenu}
    >
      <div className="flex items-center">
        <div className="w-[1.2em] text-center">
          { buttonIcon && <FontAwesomeIcon icon={buttonIcon} />}
        </div>
        <p className={classNames("text-sm font-medium mx-2")}>{text}</p>
      </div>
      <FontAwesomeIcon 
        icon={faChevronRight} 
        className={`transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`}
      />
      {createPortal(
        <ul
          style={submenuStyle as unknown as any}
          className="rounded-xl border border-[var(--er-border-subtle)] bg-[var(--er-surface-secondary)] shadow-2xl shadow-black/50 overflow-hidden flex flex-col min-w-[120px] z-50 py-1"
          onMouseDown={e => e.stopPropagation()}
        >
          {children}
        </ul>,
        document.body
      )}
    </li>
  );
};

export default SubmenuItem;
