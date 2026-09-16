// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { describe, it, expect } from 'vitest';

import { useAppSelector } from './stateHooks';
import { useDetailsViewToggle } from './useDetailsViewToggle';
import {
  ModalControllerProvider,
  useModalController,
} from '../components/modals/ModalControllerContext';
import { CountryContestant } from '../data/CountryContestant';
import { AppState } from '../redux/store';
import { makeTestStore, TestStore } from '../test/storeHarness';

function cc(uid: string): CountryContestant {
  return {
    id: uid,
    uid,
    country: { id: uid, name: `Country ${uid}`, key: uid } as never,
    contestant: null,
  };
}

/**
 * A stand-in for the navbar's view toggle, plus readouts of the two pieces of
 * state the toggle decides between: which view is showing, and whether the
 * empty-ranking prompt is up.
 */
function Harness() {
  const toggleDetailsView = useDetailsViewToggle();
  const showUnranked = useAppSelector((state: AppState) => state.root.showUnranked);
  const { modalState } = useModalController();

  return (
    <>
      <button onClick={toggleDetailsView}>toggle</button>
      <div data-testid="view">{showUnranked ? 'select' : 'details'}</div>
      <div data-testid="prompt">{modalState.emptyRanking.isOpen ? 'open' : 'closed'}</div>
    </>
  );
}

function renderHarness(store: TestStore) {
  return render(
    <Provider store={store}>
      <ModalControllerProvider>
        <Harness />
      </ModalControllerProvider>
    </Provider>,
  );
}

const view = () => screen.getByTestId('view').textContent;
const prompt = () => screen.getByTestId('prompt').textContent;

describe('useDetailsViewToggle', () => {
  it('opens the details view when countries have been ranked', () => {
    renderHarness(makeTestStore({ root: { showUnranked: true, categoryRankings: [[cc('a')]] } }));

    fireEvent.click(screen.getByText('toggle'));

    expect(view()).toBe('details');
    expect(prompt()).toBe('closed');
  });

  it('asks the user to rank something rather than opening an empty details view', () => {
    renderHarness(makeTestStore({ root: { showUnranked: true, categoryRankings: [[]] } }));

    fireEvent.click(screen.getByText('toggle'));

    expect(view()).toBe('select');
    expect(prompt()).toBe('open');
  });

  it('returns to the select view without prompting', () => {
    renderHarness(makeTestStore({ root: { showUnranked: false, categoryRankings: [[]] } }));

    fireEvent.click(screen.getByText('toggle'));

    expect(view()).toBe('select');
    expect(prompt()).toBe('closed');
  });
});
