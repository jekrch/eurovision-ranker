import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { THEME_OPTIONS } from './modals/config/DisplayTab';


type ThemeSwitcherProps = {
    currentTheme: string;
    onThemeChange: (themeCode: string) => void;
};

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
    return (
        <div className="mb-5">
            <div className="text-[var(--er-text-subtle)] font-bold text-xs mb-2 ml-1">
                Theme
            </div>
            <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map((theme) => {
                    const isActive = currentTheme === theme.code;
                    return (
                        <button
                            key={theme.code}
                            onClick={() => onThemeChange(theme.code)}
                            className={`
                                flex items-center justify-center
                                w-8 h-8
                                rounded-md
                                border-[0.1em]
                                transition-all
                                cursor-pointer
                                ${isActive 
                                    ? 'border-[var(--er-border-primary)] bg-[var(--er-bg-secondary)]' 
                                    : 'border-[var(--er-border-tertiary)] bg-[var(--er-bg-primary)] hover:border-[var(--er-border-secondary)]'
                                }
                            `}
                            title={theme.label}
                            aria-label={`Switch to ${theme.label} theme`}
                        >
                            <FontAwesomeIcon
                                icon={theme.icon}
                                className={`text-sm ${isActive ? 'text-[var(--er-text-primary)]' : 'text-[var(--er-text-subtle)]'}`}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ThemeSwitcher;