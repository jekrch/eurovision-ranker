// @vitest-environment jsdom
import { act, render } from '@testing-library/react';
import React from 'react';
import { ACTIONS, EVENTS, STATUS } from 'react-joyride';

import JoyrideTour from './JoyrideTour';
import { Contestant } from '../data/Contestant';
import { CountryContestant } from '../data/CountryContestant';
import { setName, setRankedItems } from '../redux/rootSlice';
import { SKIP_WELCOME_AFTER_TOUR_KEY } from '../utilities/JoyrideUtil';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

/** Stands in for the tour overlay so the tests can play joyride's events. */
const joyride = vi.hoisted(() => ({
  props: { current: null as Record<string, any> | null },
}));

vi.mock('react-joyride', async () => {
  const actual = await vi.importActual<typeof import('react-joyride')>('react-joyride');
  return {
    ...actual,
    default: (props: Record<string, unknown>) => {
      joyride.props.current = props;
      return null;
    },
  };
});

const repository = vi.hoisted(() => ({ fetchCountryContestantsByYear: vi.fn() }));
vi.mock('../utilities/ContestantRepository', () => repository);

const urlUtil = vi.hoisted(() => ({ goToUrl: vi.fn() }));
vi.mock('../utilities/UrlUtil', async () => {
  const actual =
    await vi.importActual<typeof import('../utilities/UrlUtil')>('../utilities/UrlUtil');
  return { ...actual, ...urlUtil };
});

const countryContestant = (key: string): CountryContestant =>
  ({
    id: key,
    uid: `2023-${key}`,
    country: { id: key, name: key.toUpperCase(), key, icon: '' },
    contestant: new Contestant({
      id: `2023-${key}`,
      countryKey: key,
      artist: `${key} artist`,
      song: `${key} song`,
      year: '2023',
    }),
  }) as CountryContestant;

const CONTEST = ['fi', 'hr', 'es', 'cz', 'no', 'is', 'se', 'gb'].map(countryContestant);

/** Plays a "Next" from `index`, which prepares and moves to the step after it. */
const next = (index: number) =>
  act(() => {
    (joyride.props.current?.callback as (data: unknown) => void)({
      status: STATUS.RUNNING,
      type: EVENTS.STEP_AFTER,
      action: ACTIONS.NEXT,
      index,
    });
  });

const settle = () => act(async () => void (await vi.advanceTimersByTimeAsync(500)));

async function startTour(preloadedState: Parameters<typeof makeTestStore>[0] = {}) {
  const store = makeTestStore(preloadedState);
  const props = {
    setRunTour: vi.fn(),
    setRefreshUrl: vi.fn(),
    openConfigModal: vi.fn(),
    setConfigModalShow: vi.fn(),
  };

  // the tour points at elements across the app; give every step a target
  const target = document.createElement('div');
  target.className = CLASSES;
  document.body.appendChild(target);

  const view = render(<JoyrideTour runTour={true} {...props} />, {
    wrapper: storeWrapper(store),
  });
  await settle();

  return { store, ...props, ...view };
}

// every selector the tour's steps point at, on one element
const CLASSES = Array.from({ length: 20 }, (_, i) => `tour-step-${i + 1}`).join(' ');

const rankedIds = (store: ReturnType<typeof makeTestStore>) =>
  store.getState().root.categoryRankings[0]!.map((cc) => cc.country.key);

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
  joyride.props.current = null;
  repository.fetchCountryContestantsByYear.mockReset().mockResolvedValue(CONTEST);
  sessionStorage.clear();
  window.history.replaceState(null, '', '/?r=abc');
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('starting the tour', () => {
  it('offers the contest to rank from a clean slate', async () => {
    const { store } = await startTour({
      root: { categoryRankings: [[countryContestant('se')]] },
    });

    expect(rankedIds(store)).toEqual([]);
    expect(store.getState().root.unrankedItems).toHaveLength(CONTEST.length);
  });

  it('leaves advanced mode so the tour follows a single contest', async () => {
    const { store } = await startTour({ root: { globalSearch: true } });

    expect(store.getState().root.globalSearch).toBe(false);
  });
});

describe('the step introducing the contest', () => {
  it('moves to the contest the tour is built around', async () => {
    const { store } = await startTour({ root: { year: '2018' } });

    next(0);
    await settle();

    expect(store.getState().root.year).toBe('2023');
  });

  it('opens the list of countries to rank', async () => {
    const { store } = await startTour();

    next(0);
    await settle();

    expect(store.getState().root.showUnranked).toBe(true);
    expect(store.getState().root.name).toBe('');
  });

  it('puts categories aside for the walkthrough', async () => {
    const { store } = await startTour({
      root: { categories: [{ name: 'vocals', weight: 1 }], showTotalRank: true },
    });

    next(0);
    await settle();

    expect(store.getState().root.categories).toEqual([]);
    expect(store.getState().root.showTotalRank).toBe(false);
  });
});

describe('the step that ranks countries for the user', () => {
  it('ranks a handful of countries in a set order', async () => {
    const { store } = await startTour({ root: { unrankedItems: CONTEST } });

    next(1);
    await settle();

    expect(rankedIds(store)).toEqual(['fi', 'hr', 'es', 'cz', 'no', 'is']);
  });

  it('takes those countries off the list still to rank', async () => {
    const { store } = await startTour({ root: { unrankedItems: CONTEST } });

    next(1);
    await settle();

    expect(store.getState().root.unrankedItems.map((cc) => cc.country.key)).toEqual(['se', 'gb']);
  });

  it('names the ranking so the user sees naming in action', async () => {
    const { store } = await startTour({ root: { unrankedItems: CONTEST } });

    next(1);
    await settle();

    expect(store.getState().root.name).toBe("Sigrit's Top Picks");
  });
});

describe('the steps that show off the ranking view', () => {
  it('hides the country list to show the ranking on its own', async () => {
    const { store } = await startTour({ root: { showUnranked: true } });

    next(3);
    await settle();

    expect(store.getState().root.showUnranked).toBe(false);
  });

  it('demonstrates reordering while the step describing it is on screen', async () => {
    const { store } = await startTour();
    // the tour clears the ranking as it opens, so rank inside the tour
    act(() => {
      store.dispatch(setRankedItems([countryContestant('fi'), countryContestant('hr')]));
    });

    next(3);
    await settle();

    expect(rankedIds(store)).toEqual(['hr', 'fi']);
  });

  it('opens the ranking menu it is about to point at', async () => {
    const { store } = await startTour();

    next(5);
    await settle();

    expect(store.getState().root.headerMenuOpen).toBe(true);
  });

  it('puts the ranking menu away once the steps move on from it', async () => {
    const { store } = await startTour();
    const before = store.getState().root.headerMenuCloseNonce;

    next(8);
    await settle();

    expect(store.getState().root.headerMenuCloseNonce).toBeGreaterThan(before);
  });

  it('brings the country list back for the later steps', async () => {
    const { store } = await startTour();

    next(10);
    await settle();

    expect(store.getState().root.showUnranked).toBe(true);
  });
});

describe('the steps that walk through settings', () => {
  it('opens settings on the rankings tab the step describes, not the remembered one', async () => {
    const { openConfigModal } = await startTour();

    next(12);
    await settle();

    expect(openConfigModal).toHaveBeenCalledWith('rankings', true);
  });

  it('closes the settings again afterwards', async () => {
    const { setConfigModalShow } = await startTour();

    next(13);
    await settle();

    expect(setConfigModalShow).toHaveBeenCalledWith(false);
  });
});

describe('the closing step', () => {
  it('hands the app back cleared, ready for the user own ranking', async () => {
    const { store, setConfigModalShow } = await startTour();
    act(() => {
      store.dispatch(setName("Sigrit's Top Picks"));
      store.dispatch(setRankedItems([countryContestant('fi')]));
    });

    next(16);
    await settle();

    expect(setConfigModalShow).toHaveBeenCalledWith(false);
    expect(store.getState().root.name).toBe('');
    expect(rankedIds(store)).toEqual([]);
    expect(store.getState().root.showUnranked).toBe(true);
  });

  it('keeps the example ranking until the step quoting its URL is done with it', async () => {
    const { store } = await startTour();
    act(() => {
      store.dispatch(setName("Sigrit's Top Picks"));
      store.dispatch(setRankedItems([countryContestant('fi')]));
    });

    next(15);
    await settle();

    expect(store.getState().root.name).toBe("Sigrit's Top Picks");
    expect(rankedIds(store)).toEqual(['fi']);
  });
});

describe('leaving the tour', () => {
  it('returns the user to the ranking they had before it started', async () => {
    const { rerender, setRunTour, ...props } = await startTour();
    void setRunTour;

    await act(async () => {
      rerender(
        <JoyrideTour
          runTour={false}
          setRunTour={setRunTour}
          setRefreshUrl={props.setRefreshUrl}
          openConfigModal={props.openConfigModal}
          setConfigModalShow={props.setConfigModalShow}
        />,
      );
    });

    expect(urlUtil.goToUrl).toHaveBeenCalledWith('?r=abc', undefined);
  });

  it('drops the user straight into the app rather than the welcome screen', async () => {
    const { rerender, setRunTour, ...props } = await startTour();

    await act(async () => {
      rerender(
        <JoyrideTour
          runTour={false}
          setRunTour={setRunTour}
          setRefreshUrl={props.setRefreshUrl}
          openConfigModal={props.openConfigModal}
          setConfigModalShow={props.setConfigModalShow}
        />,
      );
    });

    expect(sessionStorage.getItem(SKIP_WELCOME_AFTER_TOUR_KEY)).toBe('1');
  });
});
