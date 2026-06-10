import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';
import { Tooltip, PlacesType } from 'react-tooltip';

interface TooltipHelpProps {
  icon?: IconDefinition;
  content: string;
  place?: PlacesType;
  className?: string;
}

const TooltipHelp: React.FC<TooltipHelpProps> = ({
  icon = faQuestionCircle,
  content: tooltipContent,
  place = 'bottom-end',
  className,
}) => {
  const tooltipId = React.useMemo(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`, []);
  return (
    <>
      <a data-tooltip-id={tooltipId} data-tooltip-content={tooltipContent}>
        <FontAwesomeIcon
          icon={icon}
          className={classNames(
            'ml-2 text-[var(--er-text-tertiary)] cursor-pointer !text-base',
            className,
          )}
        />
      </a>
      <Tooltip
        className="z-50 max-w-[15em] !bg-[var(--er-button-primary)] !text-[var(--er-text-secondary)] !font-normal shadow-xl shadow-black"
        id={tooltipId}
        place={place}
        variant="info"
        opacity={1}
      />
    </>
  );
};

export default TooltipHelp;
