// @vitest-environment jsdom
import { DragDropContext } from '@hello-pangea/dnd';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// URL/YouTube side effects aren't relevant to a render smoke test.
vi.mock('../../utilities/UrlUtil', () => ({ updateUrlFromRankedItems: vi.fn() }));
vi.mock('../../utilities/YoutubeUtil', () => ({ generateYoutubePlaylistUrl: vi.fn(() => '') }));

// Stub the child subtrees so this test stays focused on RankedCountriesList's
// own behaviour (empty state + one row per ranked item) rather than the
// header's VideoPip context or the cards' thumbnail/detail rendering.
vi.mock('./RankedItemsHeader', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('./Card', () => ({ Card: () => <div data-testid="card" /> }));
vi.mock('./DetailsCard', () => ({ DetailsCard: () => <div data-testid="details-card" /> }));

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

const renderList = (preloaded: Parameters<typeof makeTestStore>[0]) =>
  render(
    <DragDropContext onDragEnd={() => {}}>
      <RankedCountriesList {...noopProps} />
    </DragDropContext>,
    { wrapper: storeWrapper(makeTestStore(preloaded)) },
  );

// StrictModeDroppable renders null until a requestAnimationFrame enables it,
// so the droppable content appears asynchronously — wait for it.
describe('RankedCountriesList (smoke)', () => {
  it('shows the empty-state prompt when there are no ranked items', async () => {
    renderList({ root: { rankedItems: [], showUnranked: false } });

    expect(await screen.findByText(/countries to rank/i)).toBeTruthy();
  });

  it('renders a draggable row per ranked item', async () => {
    const { container } = renderList({
      root: { rankedItems: [cc('a'), cc('b'), cc('c')], showUnranked: false },
    });

    await waitFor(() => expect(container.querySelectorAll('li')).toHaveLength(3));
  });
});
