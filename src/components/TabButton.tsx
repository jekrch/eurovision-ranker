import React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type TabButtonProps = {
    isActive: boolean;
    onClick: () => void;
    icon: IconDefinition;
    label: string;
};

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, icon, label }) => {
    return (
        <li className="mr-0 sm:mr-2">
            <button
                onClick={onClick}
                aria-label={label}
                title={label}
                className={`inline-flex items-center justify-center px-[14px] sm:px-4 py-3 border-b-2 border-transparent ${isActive ? 'text-[var(--er-interactive-primary)] !border-[var(--er-interactive-primary)]' : 'hover:text-[var(--er-text-muted)]'}`}
            >
                <FontAwesomeIcon className="text-md" icon={icon} fixedWidth />
            </button>
        </li>
    );
};

export default TabButton;