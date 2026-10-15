import classNames from 'classnames';
import React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

import geoJson from '../../data/geoJson.json';

type GeographiesProps = React.ComponentProps<typeof Geographies>;
type MapGeographySource = GeographiesProps['geography'];
// the package exports its feature type and its component under the same name,
// so the type is read off what Geographies hands its children
type MapGeography = Parameters<GeographiesProps['children']>[0]['geographies'][number];

/**
 * Where the main map is centred, as [longitude, latitude]. Both the projection
 * and the zoomable group need it: the group pans to its own centre when it
 * mounts, and would otherwise pan to [0, 0], off the west coast of Africa.
 */
const EUROPE_CENTER: [number, number] = [15, 50];

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
  <Geographies geography={preparedGeography as MapGeographySource}>
    {({ geographies }) =>
      geographies
        ?.filter((geo) => (filterFn ? filterFn(geo) : true))
        .map((geo) => {
          const properties = geo?.properties;
          if (!properties) return null;
          const countryCode: string | undefined = properties.iso_a2_eh;
          if (!countryCode) return null;

          const fillColor = getColorByIndex(countryCode);
          const rank = countryCodes.indexOf(countryCode) + 1;
          const highlight = isHighlighted(countryCode);

          return (
            <Geography
              key={properties.UNIQUE_KEY}
              geography={geo}
              data-tooltip-id="country-tooltip"
              onMouseEnter={() => onHover(properties.name || '', rank.toString())}
              onMouseLeave={onLeave}
              // the hover state lives in index.css under "MAP"; the country's
              // rank colour reaches it through this property
              className={classNames('map-geography', { 'map-geography--ranked': highlight })}
              style={{ '--map-geography-fill': fillColor } as React.CSSProperties}
              // react-simple-maps makes every country a tab stop, but there's
              // nothing to do with one once it's focused
              tabIndex={-1}
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
        projectionConfig={{ scale: 550, center: EUROPE_CENTER }}
      >
        <ZoomableGroup center={EUROPE_CENTER}>
          <GeographyRenderer
            {...sharedProps}
            filterFn={(geo) => geo.properties?.iso_a2_eh !== 'AU'}
          />
        </ZoomableGroup>
      </ComposableMap>

      {/* Australia inset */}
      <div className="absolute bottom-2 left-2 w-[100px] h-[80px] rounded-md border overflow-hidden backdrop-blur-xs bg-(--er-overlay-heavy) border-(--er-border-subtle)">
        <ComposableMap
          projectionConfig={{ scale: 400, center: [134, -26] }}
          width={300}
          height={260}
          style={{ width: '100%', height: '100%' }}
        >
          <GeographyRenderer
            {...sharedProps}
            filterFn={(geo) => geo.properties?.iso_a2_eh === 'AU'}
          />
        </ComposableMap>
        <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center leading-tight text-(--er-text-muted)">
          Australia
        </span>
      </div>
    </div>
  );
};

export default MapContent;
