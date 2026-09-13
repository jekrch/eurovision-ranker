import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

interface MenuItemProps {
  icon?: IconDefinition;
  text: string;
  url?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  afterClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  text,
  className,
  url,
  onClick,
  afterClick,
  disabled,
}) => {
  const openUrlInNewTab = (url: string): void => {
    if (disabled) {
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const activate = () => {
    if (url !== undefined) {
      openUrlInNewTab(url);
      return;
    }
    if (disabled) {
      return;
    }
    onClick?.();
    afterClick?.();
  };

  return (
    <li
      role="menuitem"
      // a menu item has to be reachable and activatable from the keyboard; as a
      // bare <li onClick> it was neither
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={classNames(
        'text-content-secondary hover:bg-[var(--er-surface-tertiary)] hover:text-content-primary flex w-full cursor-pointer select-none items-center gap-2 px-3 py-2.5 text-start transition-colors duration-fast ease-out',
        className,
      )}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
    >
      <div className="w-[1.2em] text-center">
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            color={disabled ? 'gray' : ''}
            className={classNames(disabled ? 'fill-slate-300' : '')}
          />
        )}
      </div>
      <p className={classNames('text-sm font-medium', disabled ? 'text-content-subtle' : '')}>
        {text}
      </p>
    </li>
  );
};

export default MenuItem;
