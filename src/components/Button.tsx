import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconDefinition;
  iconClassName?: string;
  /** Renders to the right of the label instead of the left. */
  iconAfter?: boolean;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>;

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary:
    'bg-[var(--er-button-neutral)] text-content-primary hover:bg-[var(--er-button-neutral-hover)]',
  ghost:
    'bg-transparent text-content-tertiary hover:bg-[var(--er-button-neutral-40)] hover:text-content-primary',
  danger: 'bg-[var(--er-accent-error)] text-white hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'py-1 px-2 text-micro gap-1',
  md: 'py-1.5 px-3 text-xs gap-1.5',
};

/**
 * The shared button for the whole app. Everything it draws — radius, type
 * scale, easing, focus ring — comes from the theme tokens, so a button looks
 * the same wherever it appears and follows the active theme.
 *
 * Press feedback is a fast background transition rather than a ripple: a ripple
 * is a Material signature and reads as borrowed on a flat surface.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconClassName,
  iconAfter = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}) => {
  const label = children as React.ReactNode;

  return (
    <button
      type={type}
      disabled={disabled}
      className={classNames(
        'inline-flex items-center justify-center rounded font-medium',
        'transition-colors duration-fast ease-out',
        // a visible keyboard target on every control, from the themed token
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focusring focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[var(--er-surface-primary)]',
        SIZES[size],
        disabled
          ? 'bg-surface-medium text-content-muted cursor-not-allowed opacity-60'
          : VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon && !iconAfter && <FontAwesomeIcon icon={icon} className={iconClassName} />}
      {label}
      {icon && iconAfter && <FontAwesomeIcon icon={icon} className={iconClassName} />}
    </button>
  );
};

export default Button;
