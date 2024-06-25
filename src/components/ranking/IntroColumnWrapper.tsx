import React, { Suspense, useEffect, useState } from 'react';
import { IntroColumnProps } from './IntroColumn';

const LazyIntroColumn = React.lazy(() => import('./IntroColumn'));

export const IntroColumnWrapper: React.FC<IntroColumnProps> = (props) => {
  const [introColumnLoaded, setIntroColumnLoaded] = useState(false);

  useEffect(() => {
    setIntroColumnLoaded(true);
  }, []);

  return (
    <Suspense fallback={<div className="w-[10em]"/>}>
      {introColumnLoaded ? (
        <LazyIntroColumn {...props} />
      ) : (
        <div>Loading...</div>
      )}
    </Suspense>
  );
};