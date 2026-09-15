// @vitest-environment jsdom
import { DragDropContext } from '@hello-pangea/dnd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// YouTube side effects aren't relevant to a render smoke test.
vi.mock('../../utilities/YoutubeUtil', () => ({ generateYoutubePlaylistUrl: vi.fn(() => '') }));

// Stub the child subtrees so this test stays focused on RankedCountriesList's
// own behaviour (empty state + one row per ranked item) rather than the
// header's VideoPip context or the cards' thumbnail/detail rendering.
vi.mock('./RankedItemsHeader', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('./Card', () => ({ Card: () => <div data-testid="card" /> }));
vi.mock('./DetailsCard', () => ({ DetailsCard: () => <div data-testid="details-card" /> }));
vi.mock('./IntroColumnWrapper', () => ({
  IntroColumnWrapper: () => <div data-testid="intro-column" />,
}));

import RankedCountriesList from './RankedCountriesList';
import { CountryContestant } from '../../data/CountryContestant';
import { makeTestStore, storeWrapper } from '../../test/storeHarness';

const cc = (id: string): CountryContestant =>
  ({
    id,
    uid: id,
    country: { id, key: id, name: `Country ${id}` },
    contestant: { id, countryKey: id, artist: 'A', song: 'S' },
  }) as CountryContestant;

// The component takes a bag of modal-opening callbacks; none fire on a plain render.
const noopProps = {
  openSongModal: vi.fn(),
  openModal: vi.fn(),
  openConfigModal: vi.fn(),
  setRunTour: vi.fn(),
  setRunSortTour: vi.fn(),
  openNameModal: vi.fn(),
  openMapModal: vi.fn(),
  openSorterModal: vi.fn(),
  openAuthModal: vi.fn(),
  openQuizModal: vi.fn(),
};

const renderList = (preloaded: Parameters<typeof makeTestStore>[0]) => {
  const store = makeTestStore(preloaded);
  return {
    store,
    ...render(
      <DragDropContext onDragEnd={() => {}}>
        <RankedCountriesList {...noopProps} />
      </DragDropContext>,
      { wrapper: storeWrapper(store) },
    ),
  };
};

// StrictModeDroppable renders null until a requestAnimationFrame enables it,
// so the droppable content appears asynchronously — wait for it.
describe('RankedCountriesList (smoke)', () => {
  it('shows the empty-state prompt when there are no ranked items', async () => {
    renderList({ root: { categoryRankings: [[]], showUnranked: false } });

    expect(await screen.findByText(/countries to rank/i)).toBeTruthy();
  });

  it('renders a draggable row per ranked item', async () => {
    const { container } = renderList({
      root: { categoryRankings: [[cc('a'), cc('b'), cc('c')]], showUnranked: false },
    });

    await waitFor(() => expect(container.querySelectorAll('li')).toHaveLength(3));
  });
});

describe('the ranking while countries are being selected', () => {
  it('shows each ranked country as a compact card beside the selection list', async () => {
    renderList({ root: { categoryRankings: [[cc('a'), cc('b')]], showUnranked: true } });

    await waitFor(() => expect(screen.getAllByTestId('card')).toHaveLength(2));
    expect(screen.queryByTestId('details-card')).toBeNull();
  });

  it('invites a first time visitor to get started when nothing is ranked', async () => {
    renderList({ root: { categoryRankings: [[]], showUnranked: true } });

    expect(await screen.findByTestId('intro-column')).toBeTruthy();
  });

  it('offers a way through to the full ranking once something is ranked', async () => {
    const { store } = renderList({
      root: { categoryRankings: [[cc('a')]], showUnranked: true },
    });

    const viewList = await screen.findByText('View List');
    fireEvent.click(viewList);

    expect(store.getState().root.showUnranked).toBe(false);
  });

  it('offers no way through while nothing is ranked', async () => {
    renderList({ root: { categoryRankings: [[]], showUnranked: true } });

    await screen.findByTestId('intro-column');
    expect(screen.queryByText('View List')).toBeNull();
  });
});

describe('the ranking on its own', () => {
  it('shows each ranked country in full', async () => {
    renderList({ root: { categoryRankings: [[cc('a'), cc('b')]], showUnranked: false } });

    await waitFor(() => expect(screen.getAllByTestId('details-card')).toHaveLength(2));
    expect(screen.queryByTestId('card')).toBeNull();
  });

  it('leaves the selection prompt out of the way', async () => {
    renderList({ root: { categoryRankings: [[cc('a')]], showUnranked: false } });

    await waitFor(() => expect(screen.getAllByTestId('details-card')).toHaveLength(1));
    expect(screen.queryByText('View List')).toBeNull();
  });
});
