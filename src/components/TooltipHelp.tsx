import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tooltip } from 'react-tooltip';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

interface TooltipHelpProps {
    icon?: IconDefinition;
    content: string;
    place?: string;
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
            <a 
                data-tooltip-id={tooltipId} 
                data-tooltip-content={tooltipContent}
            >
                <FontAwesomeIcon 
                    icon={icon} 
                    className={classNames('ml-2 text-slate-400 cursor-pointer !text-base', className)} 
                />
            </a>
            <Tooltip
                className="z-50 max-w-[15em] !bg-[#3068ba] !text-slate-300 !font-normal shadow-xl shadow-black"
                id={tooltipId}
                place={place as any}
                variant="info"
                opacity={1}
            />
        </>
    );
};

export default TooltipHelp;