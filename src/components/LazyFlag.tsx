import { lazy, Suspense, useState, useEffect } from 'react';

const LazyFlag = lazy(() => import('react-world-flags').then(module => ({ default: module.default })));

interface FlagProps {
  code: string;
  className?: string;
}

export const LazyLoadedFlag: React.FC<FlagProps> = ({ code, className }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client-side to avoid SSR issues
  if (!isClient) {
    return <div className={`${className} bg-slate-700`}></div>; // Placeholder during SSR
  }

  return (
    <Suspense fallback={<div className={`${className} bg-slate-700`}></div>}>
      <LazyFlag code={code} className={className} />
    </Suspense>
  );
};