import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';

type IconButtonProps = {
    icon: IconDefinition;
    onClick: () => void;
    className?: string;
    iconClassName?: string;
    disabled?: boolean;
    title?: string;
};

export const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, className, disabled = false, title, iconClassName }) => {
    return (
        <button
            className={classNames(
                "text-white font-normal py-1 px-3 pr-4 rounded-full text-xs",
                disabled ? "bg-slate-500" : "bg-blue-500 hover:bg-blue-700", 
                className
            )}
            onClick={onClick}
            disabled={disabled}
        >
            <FontAwesomeIcon 
                icon={icon} 
                className={classNames("mr-2 text-xs", iconClassName)} 
            />{title}
        </button>
    );
};

export default IconButton;
