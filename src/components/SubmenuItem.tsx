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
  const [submenuStyle, setSubmenuStyle] = useState({
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 200ms ease, visibility 200ms ease'
  });
  const buttonRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newStyle = {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX - 180}px`,
        opacity: isSubmenuOpen ? 1 : 0,
        visibility: isSubmenuOpen ? 'visible' : 'hidden',
        transition: 'opacity 200ms ease, visibility 200ms ease',
      };

      setSubmenuStyle(newStyle);
    }
  }, [isSubmenuOpen]);

  const toggleSubmenu = () => {
    setIsSubmenuOpen(!isSubmenuOpen);
  };

  return (
    <li
      ref={buttonRef}
      className={
        classNames("relative bg-slate-600 hover:bg-slate-700 flex w-full cursor-pointer select-none items-center justify-between gap-2 px-3 pt-[9px] pb-2 text-start transition-all",
        {"!bg-slate-700": isSubmenuOpen}
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
          className="absolute bg-slate-600 shadow-lg shadow-blue-gray-500/10 rounded-sm border border-slate-400 overflow-auto flex flex-col min-w-[180px] z-50"
        >
          {children}
        </ul>,
        document.body
      )}
    </li>
  );
};

export default SubmenuItem;
