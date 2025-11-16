import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouseUser, faHeart, faList, faGlasses, faSort } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { AppState } from '../../redux/store';
import { setTheme } from '../../redux/rootSlice';
import { updateQueryParams } from '../../utilities/UrlUtil';
import ThemeSwitcher from '../ThemeSwitcher';

export type IntroColumnProps = {
    openModal: (tabName: string) => void;
    openConfigModal: (tabName: string) => void;
    setRunTour: (runTour: boolean) => void;
    setRunSortTour: (runSortTour: boolean) => void;
};

type MenuItemProps = {
    icon: IconDefinition;
    text: string;
    onClick: () => void;
    isCustomIcon?: boolean;
    className?: string;
};

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onClick, isCustomIcon = false, className = "mb-7" }) => {
    return (
        <div
            className={`houseUser flex items-center ${className} cursor-pointer`}
            onClick={onClick}
        >
            <div className="w-8 flex">
                {isCustomIcon ? (
                    <div className="flex items-center justify-center w-6 h-6 rounded-md border-[var(--er-border-tertiary)] border-[0.1em] flex-shrink-0">
                        <FontAwesomeIcon
                            className="text-[1.3em]"
                            icon={icon}
                        />
                    </div>
                ) : (
                    <FontAwesomeIcon
                        className="text-xl flex-shrink-0"
                        icon={icon}
                    />
                )}
            </div>
            <span className="font-bold">{text}</span>
        </div>
    );
};

const IntroColumn: React.FC<IntroColumnProps> = ({ openModal, openConfigModal, setRunTour, setRunSortTour }) => {
    const dispatch = useAppDispatch();
    const theme = useAppSelector((state: AppState) => state.theme);

    const handleThemeChange = (themeCode: string) => {
        dispatch(setTheme(themeCode));
        updateQueryParams({ t: themeCode });
    };

    return (
        <div className="flex justify-left items-center">
            <div className="text-[var(--er-text-subtle)] font-normal tracking-tight font-sans text-italic text-left ml-7 m-4 text-xs whitespace-normal max-w-[10em] mt-3">
                <ol className="list-disc mb-7">
                    <li className="mb-3">Drag countries into this column to rank</li>
                    <li className="mb-3">Click 'Details' above to see more info on your ranked countries</li>
                    <li className="mb-2">Rankings are saved to the URL for you to save or share with friends</li>
                </ol>

                <div className="">
                    <MenuItem 
                        icon={faHouseUser}
                        text="About"
                        onClick={() => openModal('about')}
                    />

                    <MenuItem 
                        icon={faHeart}
                        text="Donate"
                        onClick={() => openModal('donate')}
                    />

                    <MenuItem 
                        icon={faList}
                        text="Rankings"
                        onClick={() => openConfigModal('rankings')}
                    />

                    <MenuItem 
                        icon={faGlasses}
                        text="Tour"
                        onClick={() => setRunTour(true)}
                    />
                    
                    <MenuItem 
                        icon={faSort}
                        text="Sorter"
                        onClick={() => setRunSortTour(true)}
                        isCustomIcon={true}
                        className="mb-7"
                    />

                    {/* Theme Switcher */}
                    <ThemeSwitcher 
                        currentTheme={theme}
                        onThemeChange={handleThemeChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default IntroColumn;