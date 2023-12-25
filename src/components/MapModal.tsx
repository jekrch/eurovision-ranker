import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Dialog } from '@headlessui/react';
import geoJson from '../data/geoJson.json';
import { countries } from '../data/Countries';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { AppState } from '../redux/types';
import { ZoomableGroup } from 'react-simple-maps';
import { Tooltip as ReactTooltip } from "react-tooltip";

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
    const {
        rankedItems
    } = useSelector((state: AppState) => state);

    let countryCodes = rankedItems.map(i => i.country.key.toUpperCase());
    const isHighlighted = (countryCode: string) => countryCodes.includes(countryCode);
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

    const getColorByIndex = (countryCode: string) => {
        const index = countryCodes.indexOf(countryCode);
        const totalCountries = countryCodes.length;
        const intensity = 1 - (index / totalCountries); // Reversed normalized value between 0 and 1

        const lightness = 100 - (intensity * 50); // Lightest at the beginning, darkest at the end
        return `hsl(210, 100%, ${lightness}%)`;
    };

    function getToolTipContent(tooltipData: TooltipData | null) {
        if (!tooltipData) {
            return;
        }
        
        if (tooltipData.rank !== '0') {
            return `${tooltipData?.rank}. ${tooltipData?.name}`
        } else {
            return tooltipData.name;
        }
    }

    return (
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" open={isOpen} onClose={onClose}>
            <div className="min-h-screen px-4 text-center">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <span className="inline-block h-screen align-middle" aria-hidden="true">
                    &#8203;
                </span>

                <div className="inline-block w-[80vw] max-h-[80vh] p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-800 shadow-xl rounded-2xl">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                        Map of Selected Countries
                    </Dialog.Title>

                    <div className="mt-2">

                        <ComposableMap
                            projectionConfig={{
                                scale: 500,
                                center: [15, 50]
                            }}
                            style={{ width: "auto", height: "auto" }}>
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
                                                        console.log(geo)
                                                        const name = geo.properties.name; // Adjust if the property name is different
                                                        const x = evt.clientX;
                                                        const y = evt.clientY;
                                                        console.log(name)
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
                         place="bottom"
                         variant="info"
                         content={getToolTipContent(tooltipData)}
                        />

                    </div>
                    <div className="mt-4">
                        <button
                            type="button"
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default MapModal;
