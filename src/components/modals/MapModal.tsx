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
        if (index === -1 || totalCountries === 0) {
            return 'var(--er-surface-tertiary)';
        }
        // Ramp top-ranked countries toward the bright theme accent and
        // lower-ranked ones toward the deep interactive blue, so the heat
        // gradient tracks whichever theme is active.
        const intensity = 1 - (index / totalCountries);
        const pct = Math.round(intensity * 100);
        return `color-mix(in srgb, var(--er-accent-blue) ${pct}%, var(--er-interactive-dark))`;
    };

    function getToolTipContent(tooltipData: TooltipData | null) {
        if (!tooltipData || tooltipData.rank === '0') return;
        return `${tooltipData.rank}. ${tooltipData.name}`;
    }

    return (
        <Modal
            className="fixed inset-0 z-10 overflow-y-auto pb-2 pt-5 px-2 min-w-[80vw] max-h-[80vh]"
            closeBtnClassName='!top-1 !right-2'
            isOpen={isOpen}
            onClose={onClose}
        >
            <div
                className="-mt-3 mb-3 w-full text-md font-strong text-center tracking-wide"
                style={{ color: 'var(--er-text-primary)' }}
            >
                Ranking heat map
            </div>
            <div className="mb-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--er-text-muted)' }}
            >
                <span>Lower</span>
                <span
                    className="h-2 w-28 rounded-full"
                    style={{
                        background: 'linear-gradient(to right, var(--er-interactive-dark), var(--er-accent-blue))',
                    }}
                />
                <span>Higher</span>
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
                    className="!z-50 !rounded-md !px-2.5 !py-1.5 !text-xs !font-medium !shadow-lg !opacity-100"
                    style={{
                        backgroundColor: 'var(--er-surface-accent)',
                        color: 'var(--er-text-primary)',
                        border: '1px solid var(--er-border-subtle)',
                    }}
                    content={getToolTipContent(tooltipData)}
                />
            </div>
        </Modal>
    );
};

export default MapModal;