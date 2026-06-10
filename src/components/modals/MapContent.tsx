import React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

import geoJson from '../../data/geoJson.json';

/** Shape of a geography feature exposed by react-simple-maps (which ships untyped). */
interface MapGeography {
  rsmKey?: string;
  properties: {
    iso_a2_eh?: string;
    name?: string;
    UNIQUE_KEY?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface MapContentProps {
  countryCodes: string[];
  isHighlighted: (code: string) => boolean;
  getColorByIndex: (code: string) => string;
  onHover: (name: string, rank: string) => void;
  onLeave: () => void;
}

const preparedGeography = {
  type: 'FeatureCollection',
  features: geoJson.features.map((feature, index) => ({
    ...feature,
    geometry: {
      type: feature.geometry.type,
      coordinates: feature.geometry.coordinates,
    },
    properties: {
      ...feature.properties,
      UNIQUE_KEY: `${feature.properties?.iso_a2_eh || ''}-${feature.properties?.name || ''}-${index}`,
    },
  })),
};

const GeographyRenderer: React.FC<{
  filterFn?: (geo: MapGeography) => boolean;
  countryCodes: string[];
  isHighlighted: (code: string) => boolean;
  getColorByIndex: (code: string) => string;
  onHover: (name: string, rank: string) => void;
  onLeave: () => void;
}> = ({ filterFn, countryCodes, isHighlighted, getColorByIndex, onHover, onLeave }) => (
  <Geographies geography={{ ...preparedGeography }}>
    {({ geographies }: { geographies: MapGeography[] }) =>
      geographies
        ?.filter((geo: MapGeography) => (filterFn ? filterFn(geo) : true))
        .map((geo: MapGeography) => {
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
                  fill: highlight ? fillColor : 'var(--er-surface-tertiary)',
                  stroke: 'var(--er-border-subtle)',
                  strokeWidth: 0.5,
                  outline: 'none',
                  transition: 'fill 0.2s ease, stroke 0.15s ease',
                },
                hover: {
                  fill: highlight ? fillColor : 'var(--er-surface-accent)',
                  stroke: highlight ? 'var(--er-focus-ring)' : 'var(--er-border-secondary)',
                  strokeWidth: 2,
                  outline: 'none',
                  transition: 'fill 0.2s ease, stroke 0.15s ease',
                },
                pressed: {
                  fill: highlight ? 'var(--er-accent-blue)' : 'var(--er-surface-accent)',
                  stroke: 'var(--er-focus-ring)',
                  strokeWidth: 1,
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
        className="rounded-lg w-full h-[65vh] sm:h-auto sm:max-h-[75vh] shadow-lg ring-1"
        preserveAspectRatio="xMidYMid slice"
        style={
          {
            backgroundColor: 'var(--er-surface-primary)',
            '--tw-ring-color': 'var(--er-border-subtle)',
          } as React.CSSProperties
        }
        projectionConfig={{ scale: 550, center: [15, 50] }}
      >
        <ZoomableGroup>
          <GeographyRenderer
            {...sharedProps}
            filterFn={(geo) => geo.properties.iso_a2_eh !== 'AU'}
          />
        </ZoomableGroup>
      </ComposableMap>

      {/* Australia inset */}
      <div className="absolute bottom-2 left-2 w-[100px] h-[80px] rounded-md border overflow-hidden backdrop-blur-sm bg-[var(--er-overlay-heavy)] border-[var(--er-border-subtle)]">
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
        <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center leading-tight text-[var(--er-text-muted)]">
          Australia
        </span>
      </div>
    </div>
  );
};

export default MapContent;
