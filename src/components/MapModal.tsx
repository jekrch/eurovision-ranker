import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Dialog } from '@headlessui/react';
import geoJson from '../data/geoJson.json';
import { countries } from '../data/Countries';

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TooltipData {
    name: string;
    x: number;
    y: number;
}


const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
    let countryCodes = countries.map(i => i.key.toUpperCase());
    const isHighlighted = (countryCode: string) => countryCodes.includes(countryCode);
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

    return (
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" open={isOpen} onClose={onClose}>
            <div className="min-h-screen px-4 text-center">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <span className="inline-block h-screen align-middle" aria-hidden="true">
                    &#8203;
                </span>

                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-800 shadow-xl rounded-2xl">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                        Map of Selected Countries
                    </Dialog.Title>

                    <div className="mt-2">
                        <ComposableMap
                            projectionConfig={{
                                scale: 800,
                                center: [15, 50] 
                            }}
                            style={{ width: "100%", height: "auto" }}>
                            <Geographies geography={geoJson}>
                            {({ geographies }: { geographies: any[] }) =>
                                    geographies.map(geo => {
                                        const countryCode = geo.properties.iso_a2_eh;
                                        const highlight = isHighlighted(countryCode);

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onMouseEnter={(evt: any) => {
                                                    console.log(geo)
                                                    const name = geo.properties.name; // Adjust if the property name is different
                                                    const x = evt.clientX;
                                                    const y = evt.clientY;
                                                    setTooltipData({ name: name, x, y });
                                                }}
                                                onMouseLeave={() => {
                                                    setTooltipData(null);
                                                }}
                                                style={{
                                                    default: {
                                                        fill: highlight ? '#FF5722' : '#333', // Dark fill for non-highlighted countries
                                                        stroke: '#FFF', // Bright outline
                                                        strokeWidth: 0.5, // Adjust stroke width for visibility
                                                        outline: 'none',
                                                    },
                                                    hover: {
                                                        fill: highlight ? '#E64A19' : '#444',
                                                        stroke: '#FFF',
                                                        strokeWidth: 0.5,
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
                        </ComposableMap>
                        {tooltipData && (
                    <div
                        style={{ left: tooltipData.x, top: tooltipData.y }}
                        className="absolute text-sm bg-white p-2 border border-gray-400 rounded shadow-lg"
                    >
                        {tooltipData.name}
                    </div>
                )}
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
