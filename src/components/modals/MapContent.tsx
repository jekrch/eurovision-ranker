import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { ZoomableGroup } from 'react-simple-maps';
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
            // truly unique key combining multiple identifiers
            UNIQUE_KEY: `${feature.properties?.iso_a2_eh || ''}-${feature.properties?.name || ''}-${index}`
        }
    }))
};

const MapContent: React.FC<MapContentProps> = ({ 
    countryCodes, 
    isHighlighted, 
    getColorByIndex,
    onHover,
    onLeave 
}) => {
    const [ready, setReady] = React.useState(false);

    // ensure data is ready before rendering
    React.useEffect(() => {
        if (preparedGeography && preparedGeography.features) {
            setReady(true);
        }
    }, []);

    if (!ready) {
        return <div>Loading map data...</div>;
    }

    return (
        <ComposableMap
            className="bg-black rounded-md w-full max-h-[60vh] shadow-md"
            projectionConfig={{
                scale: 800,
                center: [15, 50],
            }}
        >
            <ZoomableGroup>
                <Geographies 
                    key="map-geographies"
                    geography={{...preparedGeography}}
                >
                    {({ geographies }: any) => {
                        return geographies?.map((geo: any) => {
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
                                    onMouseEnter={() => {
                                        onHover(geo.properties.name || '', rank.toString());
                                    }}
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
                        });
                    }}
                </Geographies>
            </ZoomableGroup>
        </ComposableMap>
    );
};

export default MapContent;