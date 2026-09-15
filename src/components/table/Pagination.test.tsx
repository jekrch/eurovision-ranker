// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Pagination from './Pagination';
import { ContestantRow } from './tableTypes';

const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `${i}` }) as ContestantRow);

function paginate(props: Partial<React.ComponentProps<typeof Pagination>> = {}) {
  const handlePageChange = vi.fn();
  const handlePageSizeChange = vi.fn();
  render(
    <Pagination
      pageSize={10}
      currentPage={2}
      totalPages={5}
      displayedContestants={rows(42)}
      handlePageChange={handlePageChange}
      handlePageSizeChange={handlePageSizeChange}
      {...props}
    />,
  );
  return { handlePageChange, handlePageSizeChange };
}

const click = (label: string) => fireEvent.click(screen.getByLabelText(label));

describe('paging through the table', () => {
  it('shows which page of how many is being read', () => {
    paginate();

    expect(screen.getByText('2 / 5')).toBeTruthy();
  });

  it('reports how many entries the table holds', () => {
    paginate();

    expect(screen.getByText('of 42')).toBeTruthy();
  });

  it('moves forward a page', () => {
    const { handlePageChange } = paginate();

    click('Next page');

    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('moves back a page', () => {
    const { handlePageChange } = paginate();

    click('Previous page');

    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('jumps to the first page', () => {
    const { handlePageChange } = paginate();

    click('First page');

    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('jumps to the last page', () => {
    const { handlePageChange } = paginate();

    click('Last page');

    expect(handlePageChange).toHaveBeenCalledWith(5);
  });
});

describe('at the edges of the table', () => {
  it('offers no way back from the first page', () => {
    paginate({ currentPage: 1 });

    expect(screen.getByLabelText('First page')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Previous page')).toHaveProperty('disabled', true);
  });

  it('still offers a way forward from the first page', () => {
    paginate({ currentPage: 1 });

    expect(screen.getByLabelText('Next page')).toHaveProperty('disabled', false);
  });

  it('offers no way forward from the last page', () => {
    paginate({ currentPage: 5 });

    expect(screen.getByLabelText('Next page')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Last page')).toHaveProperty('disabled', true);
  });

  it('offers no paging at all when everything fits on one page', () => {
    paginate({ currentPage: 1, totalPages: 1 });

    expect(screen.getByLabelText('Previous page')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Next page')).toHaveProperty('disabled', true);
  });
});

describe('choosing how many entries to show', () => {
  it('offers the page sizes the table supports', () => {
    paginate();

    fireEvent.click(screen.getByRole('button', { name: '10' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent?.trim())).toEqual([
      '10',
      '25',
      '50',
    ]);
  });

  it('reports the page size that was chosen', () => {
    const { handlePageSizeChange } = paginate();
    fireEvent.click(screen.getByRole('button', { name: '10' }));

    fireEvent.click(screen.getByRole('menuitem', { name: '25' }));

    expect(handlePageSizeChange).toHaveBeenCalledWith('25');
  });
});
