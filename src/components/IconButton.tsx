import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';

type IconButtonProps = {
    icon?: IconDefinition;
    onClick: () => void;
    className?: string;
    iconClassName?: string;
    disabled?: boolean;
    title?: string;
};

function rippleEffect(event: any) {
    const button = event.currentTarget;

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.style.position = 'absolute';
    circle.style.borderRadius = '50%';
    circle.style.background = 'rgba(171, 186, 209, 0.7)';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'ripple 600ms linear';
    circle.style.pointerEvents = 'none';

    button.appendChild(circle);

    setTimeout(() => {
        circle.remove();
    }, 600);
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, className, disabled = false, title, iconClassName }) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (!disabled) {
            rippleEffect(event);
            onClick();
        }
    };

    return (
        <button
            className={classNames(
                "relative overflow-hidden text-white font-normal py-1 pl-2 pr-3 rounded-md text-xs",
                disabled ? "bg-slate-500" : "bg-[#3068ba] hover:bg-blue-700",
                className
            )}
            onClick={handleClick}
            disabled={disabled}
        >
            {icon &&
                <FontAwesomeIcon
                    icon={icon}
                    className={classNames("mr-2 text-xs", iconClassName)}
                />} {title}
        </button>
    );
};

export default IconButton;
