import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import geoJson from '../data/geoJson.json';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { AppState } from '../redux/types';
import { ZoomableGroup } from 'react-simple-maps';
import { Tooltip as ReactTooltip } from "react-tooltip";
import Modal from './Modal';

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TooltipData {
    name: string;
    rank: string;
}


const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const rankedItems = useSelector((state: AppState) => state.rankedItems);
    
    let countryCodes = rankedItems.map(i => i.country.key.toUpperCase());
    const isHighlighted = (countryCode: string) => countryCodes.includes(countryCode);
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

    const getColorByIndex = (countryCode: string) => {
        const index = countryCodes.indexOf(countryCode);
        const totalCountries = countryCodes.length;
        const intensity = 1 - (index / totalCountries); 

        // Lightest at the beginning, darkest at the end
        const lightness = 100 - (intensity * 90); 
        return `hsl(210, 100%, ${lightness}%)`;
    };

    function getToolTipContent(tooltipData: TooltipData | null) {
        if (!tooltipData) {
            return;
        }

        if (tooltipData.rank !== '0') {
            return `${tooltipData?.rank}. ${tooltipData?.name}`
        } else {
            return;
        }
    }

    return (
        <Modal 
            className="fixed inset-0 z-10 overflow-y-auto pb-2 pt-5 px-2 min-w-[80vw] max-h-[80vh]" 
            isOpen={isOpen} onClose={onClose}
        >
            <div className="mb-1 -mt-2 mb-2 w-full font-strong text-center rounded-md ">Ranking heat map</div>
            <div className="">
                <ComposableMap
                    className="bg-black rounded-md w-full max-h-[60vh]"
                    projectionConfig={{
                        scale: 800,
                        center: [15, 50],        
                    }}
                     //</div>style={{ width: "auto", height: "auto" }}>
                    >
                    <ZoomableGroup>
                        <Geographies geography={geoJson}>
                            {({ geographies }: { geographies: any[] }) =>
                                geographies.map(geo => {
                                    const countryCode = geo.properties.iso_a2_eh;
                                    const fillColor = getColorByIndex(countryCode);
                                    const rank = countryCodes.indexOf(countryCode) + 1;
                                    const highlight = isHighlighted(countryCode);

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            data-tooltip-id="country-tooltip"
                                            onMouseEnter={(evt: any) => {
                                                const name = geo.properties.name; // Adjust if the property name is different
                                                const x = evt.clientX;
                                                const y = evt.clientY;
                                                setTooltipData({ name: name, rank: rank?.toString() });
                                            }}
                                            onMouseLeave={() => {
                                                setTooltipData(null);
                                            }}
                                            style={{
                                                default: {
                                                    fill: highlight ? fillColor : '#333', // Dark fill for non-highlighted countries
                                                    stroke: '#FFF', // Bright outline
                                                    strokeWidth: 0.5, // Adjust stroke width for visibility
                                                    outline: 'none',
                                                },
                                                hover: {
                                                    //fill: highlight ? 'blue' : '#444',
                                                    stroke: highlight ? 'yellow' : '#FFF',
                                                    fill: highlight ? fillColor : '#333', // Dark fill for non-highlighted countries
                                                    strokeWidth: 2.5,
                                                    outline: 'none',
                                                },
                                                pressed: {
                                                    fill: highlight ? '#FFCCBC' : '#555',
                                                    stroke: '#FFF',
                                                    strokeWidth: 0.5,
                                                    outline: 'none',
                                                },
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>

                </ComposableMap>
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
