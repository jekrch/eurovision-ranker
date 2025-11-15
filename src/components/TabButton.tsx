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
        <li className="mr-2">
            <button
                onClick={onClick}
                className={`inline-flex items-center justify-center p-4 ${isActive ? 'text-[var(--er-interactive-primary)] border-[var(--er-interactive-primary)] border-b-2' : 'hover:text-[var(--er-text-muted)] hover:border-[var(--er-border-lighter)]'}`}
            >
                <FontAwesomeIcon className="mr-2 text-md" icon={icon} />
                {label}
            </button>
        </li>
    );
};

export default TabButton;