import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';

interface MenuItemProps {
    icon?: IconDefinition;
    text: string;
    url?: string;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
    afterClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, className, url, onClick, afterClick, disabled }) => {

    const openUrlInNewTab = (url: string): void => {
        if (disabled) {
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <li
            role="menuitem"
            className={
                classNames(
                    "text-slate-300 bg-slate-600 hover:bg-slate-700 flex w-full cursor-pointer select-none items-center gap-2 px-3 pt-[9px] pb-2 text-start transition-all hover:bg-blue-gray-50 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900 bg-opacity-95 hover:bg-opacity-100",
                    className
            )}
            onClick={
                url !== undefined ? () => openUrlInNewTab(url) : 
                () => { 
                    if (disabled) {
                        return;
                    }
                    onClick?.(); 
                    afterClick?.();                    
                } 
            }
        >
            <div className="w-[1.2em] text-center">
              { icon && <FontAwesomeIcon icon={icon} color={disabled ? "gray" : ""} className={classNames(disabled ? "fill-slate-300" : "")} />}
            </div>
            <p className={classNames("text-sm font-medium", disabled ? "text-gray-400" : "")}>{text}</p>
        </li>
    );
};

export default MenuItem;
