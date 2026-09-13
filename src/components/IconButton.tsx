import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import React from 'react';

import Button from './Button';

type IconButtonProps = {
  icon?: IconDefinition;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
  title?: string;
  isGrayTheme?: boolean;
};

/**
 * A labelled icon button. Kept as its own component because the call sites pass
 * the label as a `title` prop rather than as children; the rendering itself is
 * delegated to the shared Button.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  className,
  disabled = false,
  title,
  iconClassName,
  isGrayTheme,
}) => (
  <Button
    variant={isGrayTheme ? 'secondary' : 'primary'}
    size="md"
    icon={icon}
    iconClassName={iconClassName}
    disabled={disabled}
    onClick={onClick}
    className={className}
  >
    {title}
  </Button>
);

export default IconButton;
