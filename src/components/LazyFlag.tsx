import { lazy, Suspense, useState, useEffect } from 'react';

const LazyFlag = lazy(() => import('react-world-flags').then(module => ({ default: module.default })));

interface FlagProps {
  code: string;
  className?: string;
  style?: any;
}

export const LazyLoadedFlag: React.FC<FlagProps> = ({ code, className, style }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client-side to avoid SSR issues
  if (!isClient) {
    return <div className={`${className} bg-[var(--er-button-neutral-hover)]`}></div>; // Placeholder during SSR
  }

  return (
    <Suspense fallback={<div className={`${className} bg-[var(--er-button-neutral-hover)]`}></div>}>
      <LazyFlag code={code} className={className} style={style}/>
    </Suspense>
  );
};