import React, { useEffect, useState } from 'react';
import { faChartLine, faEdit, faFileExport, faList, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import Modal from '../Modal';
import ExportTab from './ExportTab';
import CategoriesTab from './CategoriesTab';
import RankingsTab from './RankingsTab';
import DisplayTab from './DisplayTab';
import AnalyzeTab from './AnalyzeTab';
import TabButton from '../../TabButton';
import { AppState } from '../../../redux/store';
import { useAppSelector } from '../../../hooks/stateHooks';

type ConfigModalProps = {
    isOpen: boolean;
    tab: string;
    onClose: () => void;
    startTour: () => void;
};

/**
 * This modal provides various advanced setting options to the user. It is opened 
 * either from the main nav or individual tabs can be directly opened from other 
 * locations: e.g. the ranked items header or the intro column in the ranked items list. 
 * 
 * @param props 
 * @returns 
 */
const ConfigModal: React.FC<ConfigModalProps> = (props: ConfigModalProps) => {
    const [activeTab, setActiveTab] = useState(props.tab);
    const globalSearch = useAppSelector((state: AppState) => state.globalSearch);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const uniqueRankedYears = new Set(
        rankedItems.map(r => r.contestant?.year).filter(Boolean)
    );
    const hasMultipleYears = uniqueRankedYears.size > 1;

    useEffect(() => {
        if (props.isOpen)
            setActiveTab(props.tab);
        //setActiveTab('analyze');
    }, [props.tab, props.isOpen]);

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} className="">
            <div className="border-b border-gray-200 dark:border-gray-700 -mt-4">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">

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
                        isActive={activeTab === 'export'}
                        onClick={() => setActiveTab('export')}
                        icon={faFileExport}
                        label="Export"
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
                </ul>
            </div>

            <div className="overflow-y-auto pt-4 select-text pb-3 flex-grow">

                {activeTab === 'display' &&
                    <DisplayTab/>
                }

                {activeTab === 'rankings' &&
                    <RankingsTab/>
                }

                {activeTab === 'export' &&
                    <ExportTab/>
                }

                {activeTab === 'categories' &&
                   <CategoriesTab/>
                }

                {activeTab === 'analyze' &&
                    <AnalyzeTab/>
                }
            </div>

        </Modal>
    );
};

export default ConfigModal;


