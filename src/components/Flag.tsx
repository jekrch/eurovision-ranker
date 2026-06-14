import { CSSProperties } from 'react';

// Eagerly resolve only the flag SVGs we ship (as asset URLs), keyed by their
// lowercase alpha-2 code. This module is loaded lazily via LazyFlag, so the
// flag URL map stays out of the main bundle.
const flagModules = import.meta.glob('../assets/flags/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const flags: Record<string, string> = {};
for (const path in flagModules) {
  const code = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length);
  flags[code] = flagModules[path];
}

interface FlagProps {
  code: string;
  className?: string;
  style?: CSSProperties;
}

const Flag: React.FC<FlagProps> = ({ code, className, style }) => {
  const src = flags[String(code).toLowerCase()];
  if (!src) return null;
  return <img src={src} alt={code} className={className} style={style} />;
};

export default Flag;
