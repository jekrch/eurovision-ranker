import React, { useState, Suspense } from 'react';
import { Tooltip as ReactTooltip } from "react-tooltip";
import Modal from './Modal';
import { useAppSelector } from '../../hooks/stateHooks';
import { AppState } from '../../redux/store';

const LazyMapContent = React.lazy(() => import('./MapContent'));

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TooltipData {
    name: string;
    rank: string;
}

/**
 * Modal displaying a heat map of the users ranking. 
 * Opened from the ranked items header menu
 */
const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

    const countryCodes = rankedItems.map(i => i.country.key.toUpperCase());
    
    const isHighlighted = (countryCode: string) => countryCodes.includes(countryCode);
    
    const getColorByIndex = (countryCode: string) => {
        const index = countryCodes.indexOf(countryCode);
        const totalCountries = countryCodes.length;
        const intensity = 1 - (index / totalCountries);
        const lightness = 100 - (intensity * 90);
        return `hsl(210, 100%, ${lightness}%)`;
    };

    function getToolTipContent(tooltipData: TooltipData | null) {
        if (!tooltipData || tooltipData.rank === '0') return;
        return `${tooltipData.rank}. ${tooltipData.name}`;
    }

    return (
        <Modal
            className="fixed inset-0 z-10 overflow-y-auto pb-2 pt-5 px-2 min-w-[80vw] max-h-[80vh]"
            closeBtnClassName='mt-[0.6em] mr-[0.5em]'
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="-mt-3 mb-2 w-full text-md font-strong text-center rounded-md">
                Ranking heat map
            </div>
            <div>
                <Suspense fallback={<div>Loading map...</div>}>
                    <LazyMapContent
                        countryCodes={countryCodes}
                        isHighlighted={isHighlighted}
                        getColorByIndex={getColorByIndex}
                        onHover={(name, rank) => setTooltipData({ name, rank })}
                        onLeave={() => setTooltipData(null)}
                    />
                </Suspense>
                <ReactTooltip
                    id="country-tooltip"
                    place="bottom-end"
                    variant="info"
                    content={getToolTipContent(tooltipData)}
                />
            </div>
        </Modal>
    );
};

export default MapModal;