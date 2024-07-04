import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tooltip } from 'react-tooltip';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

interface TooltipHelpProps {
    icon?: IconDefinition;
    tooltipContent: string;
    place?: string;
    className?: string;
}

const TooltipHelp: React.FC<TooltipHelpProps> = ({
    icon = faQuestionCircle,
    tooltipContent,
    place = 'bottom-end',
    className = 'ml-2 text-slate-400 cursor-pointer',
}) => {

    const tooltipId = React.useMemo(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`, []);
    return (
        <>
            <a data-tooltip-id={tooltipId} data-tooltip-content={tooltipContent}>
                <FontAwesomeIcon icon={icon} className={className} />
            </a>
            <Tooltip
                className="z-50 max-w-[40vw]"
                id={tooltipId}
                place={place as any}
                variant="info"
                opacity={1}
            />
        </>
    );
};

export default TooltipHelp;