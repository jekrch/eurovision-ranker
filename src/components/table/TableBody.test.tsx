// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import TableBody from './TableBody';
import { ContestantRow } from './tableTypes';

const row = (id: string, overrides: Partial<ContestantRow> = {}): ContestantRow =>
  ({
    id,
    year: 2023,
    to_country_id: id,
    to_country: `Country ${id}`,
    performer: `Performer ${id}`,
    song: `Song ${id}`,
    place_contest: 1,
    ...overrides,
  }) as ContestantRow;

function body({
  rows = [row('1')],
  selected = [] as ContestantRow[],
  showSelected = false,
}: { rows?: ContestantRow[]; selected?: ContestantRow[]; showSelected?: boolean } = {}) {
  const handleToggleSelected = vi.fn();
  render(
    <table>
      <TableBody
        paginatedContestants={rows}
        handleToggleSelected={handleToggleSelected}
        showSelected={showSelected}
        selectedContestants={selected}
      />
    </table>,
  );
  return { handleToggleSelected };
}

describe('the contestants on screen', () => {
  it('shows each contestant contest, country, artist and song', () => {
    body();

    expect(screen.getByText('2023')).toBeTruthy();
    expect(screen.getByText('Country 1')).toBeTruthy();
    expect(screen.getByText('Performer 1')).toBeTruthy();
    expect(screen.getByText('Song 1')).toBeTruthy();
  });

  it('shows a row per contestant', () => {
    body({ rows: [row('1'), row('2'), row('3')] });

    expect(document.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('shows nothing when the page is empty', () => {
    body({ rows: [] });

    expect(document.querySelectorAll('tbody tr')).toHaveLength(0);
  });
});

describe('adding and removing contestants', () => {
  it('reports the contestant the viewer picked', () => {
    const { handleToggleSelected } = body({ rows: [row('1'), row('2')] });

    fireEvent.click(screen.getAllByRole('button')[1]!);

    expect(handleToggleSelected).toHaveBeenCalledWith('2');
  });

  it('marks a contestant that is already ranked', () => {
    body({ rows: [row('1')], selected: [row('1')] });

    expect(document.querySelector('[data-icon="check"]')).toBeTruthy();
  });

  it('offers to add a contestant that is not ranked yet', () => {
    body({ rows: [row('1')], selected: [row('2')] });

    expect(document.querySelector('[data-icon="plus"]')).toBeTruthy();
  });

  it('offers to remove a contestant while the ranking is being shown', () => {
    body({ rows: [row('1')], selected: [row('1')], showSelected: true });

    expect(document.querySelector('[data-icon="minus"]')).toBeTruthy();
  });
});
