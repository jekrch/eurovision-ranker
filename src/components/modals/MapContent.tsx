import React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import geoJson from '../../data/geoJson.json';

interface MapContentProps {
    countryCodes: string[];
    isHighlighted: (code: string) => boolean;
    getColorByIndex: (code: string) => string;
    onHover: (name: string, rank: string) => void;
    onLeave: () => void;
}

const preparedGeography = {
    type: "FeatureCollection",
    features: geoJson.features.map((feature, index) => ({
        ...feature,
        geometry: {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates
        },
        properties: {
            ...feature.properties,
            UNIQUE_KEY: `${feature.properties?.iso_a2_eh || ''}-${feature.properties?.name || ''}-${index}`
        }
    }))
};

const GeographyRenderer: React.FC<{
    filterFn?: (geo: any) => boolean;
    countryCodes: string[];
    isHighlighted: (code: string) => boolean;
    getColorByIndex: (code: string) => string;
    onHover: (name: string, rank: string) => void;
    onLeave: () => void;
}> = ({ filterFn, countryCodes, isHighlighted, getColorByIndex, onHover, onLeave }) => (
    <Geographies geography={{ ...preparedGeography }}>
        {({ geographies }: any) =>
            geographies
                ?.filter((geo: any) => (filterFn ? filterFn(geo) : true))
                .map((geo: any) => {
                    if (!geo?.properties) return null;
                    const countryCode = geo.properties.iso_a2_eh;
                    if (!countryCode) return null;

                    const fillColor = getColorByIndex(countryCode);
                    const rank = countryCodes.indexOf(countryCode) + 1;
                    const highlight = isHighlighted(countryCode);

                    return (
                        <Geography
                            key={geo.properties.UNIQUE_KEY}
                            geography={geo}
                            data-tooltip-id="country-tooltip"
                            onMouseEnter={() => onHover(geo.properties.name || '', rank.toString())}
                            onMouseLeave={onLeave}
                            style={{
                                default: {
                                    fill: highlight ? fillColor : '#333',
                                    stroke: '#FFF',
                                    strokeWidth: 0.5,
                                    outline: 'none',
                                },
                                hover: {
                                    stroke: highlight ? 'yellow' : '#FFF',
                                    fill: highlight ? fillColor : '#333',
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
);

const MapContent: React.FC<MapContentProps> = ({
    countryCodes,
    isHighlighted,
    getColorByIndex,
    onHover,
    onLeave,
}) => {
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        if (preparedGeography?.features) setReady(true);
    }, []);

    if (!ready) return <div>Loading map data...</div>;

    const sharedProps = { countryCodes, isHighlighted, getColorByIndex, onHover, onLeave };

    return (
        <div className="relative w-full">
            {/* Main Europe-centered map */}
            <ComposableMap
                className="bg-black rounded-md w-full max-h-[60vh] shadow-md"
                projectionConfig={{ scale: 800, center: [15, 50] }}
            >
                <ZoomableGroup>
                    <GeographyRenderer
                        {...sharedProps}
                        filterFn={(geo) => geo.properties.iso_a2_eh !== 'AU'}
                    />
                </ZoomableGroup>
            </ComposableMap>

            {/* Australia inset */}
            <div className="absolute bottom-2 left-2 w-[100px] h-[80px] bg-black/80 rounded border border-white/30 overflow-hidden">
                <ComposableMap
                    projectionConfig={{ scale: 400, center: [134, -26] }}
                    width={300}
                    height={260}
                    style={{ width: '100%', height: '100%' }}
                >
                    <GeographyRenderer
                        {...sharedProps}
                        filterFn={(geo) => geo.properties.iso_a2_eh === 'AU'}
                    />
                </ComposableMap>
                <span className="absolute bottom-0 left-0 right-0 text-[8px] text-white/60 text-center leading-tight">
                    Australia
                </span>
            </div>
        </div>
    );
};

export default MapContent;