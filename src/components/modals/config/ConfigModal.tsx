import React, { useEffect, useRef, useState } from 'react';
import { faChartLine, faEdit, faList, faSlidersH, faUserCircle, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import Modal from '../Modal';
import CategoriesTab from './CategoriesTab';
import RankingsTab from './RankingsTab';
import DisplayTab from './DisplayTab';
import AnalyzeTab from './AnalyzeTab';
import SavedRankingsTab from './SavedRankingsTab';
import GroupsTab from './GroupsTab';
import TabButton from '../../TabButton';
import { AppState } from '../../../redux/store';
import { useAppSelector } from '../../../hooks/stateHooks';

type ConfigModalProps = {
    isOpen: boolean;
    tab: string;
    // Bumped on a forced (deep-link) open so we jump to `tab` even when it
    // matches the current selection — overriding the sticky-tab memory below.
    tabRequestNonce?: number;
    onClose: () => void;
    startTour: () => void;
    openAuthModal: () => void;
};

/**
 * This modal provides various advanced setting options to the user. It is opened 
 * either from the main nav or individual tabs can be directly opened from other 
 * locations: e.g. the ranked items header or the intro column in the ranked items list. 
 * 
 * @param props 
 * @returns 
 */
const ACTIVE_TAB_STORAGE_KEY = 'configModalActiveTab';

const ConfigModal: React.FC<ConfigModalProps> = (props: ConfigModalProps) => {
    const [activeTab, setActiveTab] = useState(() => {
        // A forced open (nonce already bumped at mount time) deep-links to the
        // requested tab, bypassing the sticky selection stored in localStorage.
        if (props.tabRequestNonce) {
            return props.tab === 'export' ? 'display' : props.tab;
        }
        try {
            const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
            if (stored === 'export') return 'display';
            return stored || props.tab;
        } catch {
            return props.tab;
        }
    });
    const globalSearch = useAppSelector((state: AppState) => state.globalSearch);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    // Reset to props.tab only when the requested tab actually changes (explicit deep-link),
    // not on mount and not every time the modal reopens — that keeps the selection sticky.
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        setActiveTab(props.tab);
    }, [props.tab]);

    // Honor forced (deep-link) opens once the modal is already mounted: jump to
    // the requested tab whenever the nonce changes, even if `props.tab` did not.
    const didMountNonceRef = useRef(false);
    useEffect(() => {
        if (!didMountNonceRef.current) {
            didMountNonceRef.current = true;
            return;
        }
        setActiveTab(props.tab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.tabRequestNonce]);

    useEffect(() => {
        try {
            localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
        } catch {
            // ignore storage failures
        }
    }, [activeTab]);

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} className="isolate h-[85vh] !max-h-[550px]">
            <div className="border-b border-[var(--er-border-lightest)] dark:border-[var(--er-border-darker)] -mt-4">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-[var(--er-text-muted)] dark:text-[var(--er-text-subtle)]">

                    <TabButton
                        isActive={activeTab === 'rankings'}
                        onClick={() => setActiveTab('rankings')}
                        icon={faList}
                        label="Rankings"
                    />

                    <TabButton
                        isActive={activeTab === 'display'}
                        onClick={() => setActiveTab('display')}
                        icon={faEdit}
                        label="Display"
                    />

                    <TabButton
                        isActive={activeTab === 'categories'}
                        onClick={() => setActiveTab('categories')}
                        icon={faSlidersH}
                        label="Categories"
                    />
                    
                    {!globalSearch &&
                        <TabButton
                            isActive={activeTab === 'analyze'}
                            onClick={() => setActiveTab('analyze')}
                            icon={faChartLine}
                            label="Analyze"
                        />
                    }

                    <TabButton
                        isActive={activeTab === 'account'}
                        onClick={() => setActiveTab('account')}
                        icon={faUserCircle}
                        label="Account"
                    />

                    <TabButton
                        isActive={activeTab === 'groups'}
                        onClick={() => setActiveTab('groups')}
                        icon={faUserGroup}
                        label="Groups"
                    />
                </ul>
            </div>

            <div className="overflow-y-auto pt-4 pr-4 -mr-4 select-text pb-3 flex-grow min-h-0 [scrollbar-gutter:stable]">

                {activeTab === 'display' &&
                    <DisplayTab/>
                }

                {activeTab === 'rankings' &&
                    <RankingsTab/>
                }

                {activeTab === 'categories' &&
                   <CategoriesTab/>
                }

                {activeTab === 'analyze' &&
                    <AnalyzeTab/>
                }

                {activeTab === 'account' &&
                    <SavedRankingsTab openAuthModal={props.openAuthModal} />
                }

                {activeTab === 'groups' &&
                    <GroupsTab openAuthModal={props.openAuthModal} />
                }
            </div>

        </Modal>
    );
};

export default ConfigModal;


