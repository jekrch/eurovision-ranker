// @vitest-environment jsdom
import { render } from '@testing-library/react';
import React from 'react';

import MapContent from './MapContent';

function renderMap(countryCodes: string[] = ['SE', 'FI']) {
  return render(
    <MapContent
      countryCodes={countryCodes}
      isHighlighted={(code) => countryCodes.includes(code)}
      getColorByIndex={() => '#123456'}
      onHover={vi.fn()}
      onLeave={vi.fn()}
    />,
  );
}

describe('the heat map', () => {
  it('draws the zoomable map of countries', () => {
    const { container } = renderMap();

    expect(container.querySelectorAll('.map-geography').length).toBeGreaterThan(0);
  });

  it('opens centred on Europe, not panned away from it', () => {
    const { container } = renderMap();

    // the projection already centres Europe; any starting pan moves it off
    // screen
    expect(container.querySelector('.rsm-zoomable-group')?.getAttribute('transform')).toBe(
      'translate(0 0) scale(1)',
    );
  });

  it('fills a ranked country with its rank colour', () => {
    const { container } = renderMap(['SE']);

    const ranked = container.querySelectorAll<SVGPathElement>('.map-geography--ranked');

    expect(ranked.length).toBeGreaterThan(0);
    ranked.forEach((path) =>
      expect(path.style.getPropertyValue('--map-geography-fill')).toBe('#123456'),
    );
  });
});
