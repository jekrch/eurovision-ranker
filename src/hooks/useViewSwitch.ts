import { useState } from 'react';

/**
 * Which way the user last moved between the select view and the details view.
 *
 * `toDetails` means the ranked column is moving from the right edge of the
 * select view into the center, and `toSelect` means it's moving back out to the
 * right. `null` means the view on screen came from the page load rather than a
 * switch, which keeps its plain entrance: there's no previous view for a
 * sideways motion to be relative to.
 */
export type ViewSwitch = 'toDetails' | 'toSelect' | null;

export function useViewSwitch(showUnranked: boolean): ViewSwitch {
  const [previous, setPrevious] = useState(showUnranked);
  const [viewSwitch, setViewSwitch] = useState<ViewSwitch>(null);

  // Updated during render, not in an effect: React reruns the render before
  // committing it, so the remounted view has its direction in the same paint it
  // first appears (see useViewOpening).
  if (previous !== showUnranked) {
    setPrevious(showUnranked);
    setViewSwitch(showUnranked ? 'toSelect' : 'toDetails');
  }

  return viewSwitch;
}
