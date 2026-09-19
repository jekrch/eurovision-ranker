import React, { Suspense } from 'react';

import { IntroColumnProps } from './IntroColumn';

const loadIntroColumn = () => import('./IntroColumn');
const LazyIntroColumn = React.lazy(loadIntroColumn);

/**
 * Fetches the intro's chunk ahead of time. The ranked column animates its width
 * to the intro's when the last country leaves it (see useIntroSwap), so the
 * intro has to be able to render at its real size on the first try rather than
 * as the fallback.
 */
export const preloadIntroColumn = () => {
  void loadIntroColumn();
};

export const IntroColumnWrapper: React.FC<IntroColumnProps> = (props) => (
  <Suspense fallback={<div className="w-[10em]" />}>
    <LazyIntroColumn {...props} />
  </Suspense>
);
