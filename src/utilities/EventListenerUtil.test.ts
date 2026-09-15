// @vitest-environment jsdom
import {
  addWindowEventListeners,
  handlePopState,
  removeWindowEventListeners,
  setVh,
} from './EventListenerUtil';
import { setShowUnranked } from '../redux/rootSlice';

const urlUtil = vi.hoisted(() => ({
  loadAllCategoryRankingsFromURL: vi.fn(),
}));

vi.mock('./UrlUtil', () => urlUtil);

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  urlUtil.loadAllCategoryRankingsFromURL.mockReset().mockResolvedValue(true);
});

describe('setVh', () => {
  it('publishes a hundredth of the viewport height for the layout to use', () => {
    window.innerHeight = 800;

    setVh();

    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('8px');
  });
});

describe('window event listeners', () => {
  it('watches for the window changing size or orientation and for navigation', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const onResize = vi.fn();
    const onPopState = vi.fn();

    addWindowEventListeners(onResize, onPopState);

    expect(add.mock.calls.map(([event]) => event)).toEqual([
      'resize',
      'orientationchange',
      'popstate',
    ]);
    add.mockRestore();
    removeWindowEventListeners(onResize, onPopState);
  });

  it('stops responding to the window once the listeners are removed', () => {
    const onResize = vi.fn();
    const onPopState = vi.fn();
    addWindowEventListeners(onResize, onPopState);

    removeWindowEventListeners(onResize, onPopState);
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('popstate'));

    expect(onResize).not.toHaveBeenCalled();
    expect(onPopState).not.toHaveBeenCalled();
  });
});

describe('going back to a previous ranking', () => {
  it('loads the ranking the address now describes', async () => {
    const dispatch = vi.fn();

    handlePopState(new PopStateEvent('popstate'), () => false, 1, dispatch);
    await flush();

    expect(urlUtil.loadAllCategoryRankingsFromURL).toHaveBeenCalledWith(1, dispatch);
  });

  it('reads the first category when returning to a categorised ranking', async () => {
    const dispatch = vi.fn();

    handlePopState(new PopStateEvent('popstate'), () => true, undefined, dispatch);
    await flush();

    expect(urlUtil.loadAllCategoryRankingsFromURL).toHaveBeenCalledWith(0, dispatch);
  });

  it('hides the unranked list when the address holds a ranking', async () => {
    const dispatch = vi.fn();

    handlePopState(new PopStateEvent('popstate'), () => false, undefined, dispatch);
    await flush();

    expect(dispatch).toHaveBeenCalledWith(setShowUnranked(false));
  });

  it('shows the unranked list when the address holds no ranking', async () => {
    const dispatch = vi.fn();
    urlUtil.loadAllCategoryRankingsFromURL.mockResolvedValue(false);

    handlePopState(new PopStateEvent('popstate'), () => false, undefined, dispatch);
    await flush();

    expect(dispatch).toHaveBeenCalledWith(setShowUnranked(true));
  });
});
