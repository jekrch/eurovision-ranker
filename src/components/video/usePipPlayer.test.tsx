// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';

import { usePipPlayer } from './usePipPlayer';
import { AUTO_CONTINUE_KEY } from './videoPipShared';
import { Contestant } from '../../data/Contestant';
import { CountryContestant } from '../../data/CountryContestant';

let rankedItems: CountryContestant[] = [];

vi.mock('../../hooks/stateHooks', () => ({
  useAppSelector: () => rankedItems,
}));

const videoId = (n: number) => `trk${String(n).padStart(8, '0')}`;

function countryContestant(id: string, video?: string): CountryContestant {
  return {
    id,
    uid: `${id}-uid`,
    country: { id, name: id.toUpperCase(), key: id, icon: '' },
    contestant: {
      countryKey: id,
      artist: `${id} artist`,
      song: `${id} song`,
      youtube: video ? `https://youtu.be/${video}` : undefined,
    } as Contestant,
  } as CountryContestant;
}

function playerWith(items: CountryContestant[]) {
  rankedItems = items;
  const onExpand = vi.fn();
  const onMinimize = vi.fn();
  const view = renderHook(() => usePipPlayer(onExpand, onMinimize));
  return { ...view, onExpand, onMinimize };
}

const sendPlayerState = (state: number, origin = 'https://www.youtube-nocookie.com') =>
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ event: 'onStateChange', info: state }),
        origin,
      }),
    );
  });

const PLAYING = 1;
const ENDED = 0;

const three = () => [
  countryContestant('a', videoId(1)),
  countryContestant('b'),
  countryContestant('c', videoId(3)),
  countryContestant('d', videoId(4)),
];

beforeEach(() => {
  localStorage.clear();
  rankedItems = [];
});

describe('starting a ranking playing', () => {
  it('floats a player showing the top ranked video', () => {
    const { result } = playerWith(three());

    act(() => result.current.playList());

    expect(result.current.video?.videoId).toBe(videoId(1));
    expect(result.current.mode).toBe('pip');
  });

  it('plays straight away rather than waiting for the viewer', () => {
    const { result } = playerWith(three());

    act(() => result.current.playList());

    expect(result.current.autoplay).toBe(true);
  });

  it('plays on through the ranking without being asked again', () => {
    const { result } = playerWith(three());

    act(() => result.current.playList());

    expect(result.current.autoContinue).toBe(true);
    expect(localStorage.getItem(AUTO_CONTINUE_KEY)).toBe('true');
  });

  it('does nothing when nothing in the ranking has a video', () => {
    const { result } = playerWith([countryContestant('a'), countryContestant('b')]);

    act(() => result.current.playList());

    expect(result.current.video).toBeNull();
  });
});

describe('moving between videos', () => {
  it('moves to the next ranked video', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    act(() => result.current.navigate(1));

    expect(result.current.video?.videoId).toBe(videoId(3));
  });

  it('skips ranked entries that have no video', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    act(() => result.current.navigate(1));

    expect(result.current.video?.contestant.id).toBe('c');
  });

  it('wraps round to the start after the last video', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());
    act(() => result.current.navigate(1));
    act(() => result.current.navigate(1));

    act(() => result.current.navigate(1));

    expect(result.current.video?.videoId).toBe(videoId(1));
  });

  it('wraps round to the end when stepping back from the first video', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    act(() => result.current.navigate(-1));

    expect(result.current.video?.videoId).toBe(videoId(4));
  });

  it('stays put when the ranking holds a single video', () => {
    const { result } = playerWith([countryContestant('a', videoId(1)), countryContestant('b')]);
    act(() => result.current.playList());

    act(() => result.current.navigate(1));

    expect(result.current.video?.videoId).toBe(videoId(1));
  });

  it('has nothing to move between before a video is open', () => {
    const { result } = playerWith(three());

    act(() => result.current.navigate(1));

    expect(result.current.video).toBeNull();
  });
});

describe('when a floating video finishes', () => {
  it('goes on to the next one while playing through the ranking', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    sendPlayerState(ENDED);

    expect(result.current.video?.videoId).toBe(videoId(3));
  });

  it('advances only once however often the player says it ended', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    sendPlayerState(ENDED);
    sendPlayerState(ENDED);

    expect(result.current.video?.videoId).toBe(videoId(3));
  });

  it('is ready to advance again once the next video starts', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    sendPlayerState(ENDED);
    sendPlayerState(PLAYING);
    sendPlayerState(ENDED);

    expect(result.current.video?.videoId).toBe(videoId(4));
  });

  it('retires the player when not playing through the ranking', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());
    act(() => result.current.toggleAutoContinue());

    sendPlayerState(ENDED);

    expect(result.current.video).toBeNull();
  });

  it('ignores messages from anywhere but the player', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    sendPlayerState(ENDED, 'https://evil.example.com');

    expect(result.current.video?.videoId).toBe(videoId(1));
  });

  it('ignores a message it cannot read', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: 'not json', origin: 'https://youtube.com' }),
      );
    });

    expect(result.current.video?.videoId).toBe(videoId(1));
  });

  it('reads the play state the player reports alongside its other details', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'infoDelivery', info: { playerState: ENDED } }),
          origin: 'https://www.youtube-nocookie.com',
        }),
      );
    });

    expect(result.current.video?.videoId).toBe(videoId(3));
  });
});

describe('playing through the ranking as a setting', () => {
  it('is remembered once turned on', () => {
    const { result } = playerWith(three());

    act(() => result.current.toggleAutoContinue());

    expect(result.current.autoContinue).toBe(true);
    expect(localStorage.getItem(AUTO_CONTINUE_KEY)).toBe('true');
  });

  it('is remembered once turned off', () => {
    localStorage.setItem(AUTO_CONTINUE_KEY, 'true');
    const { result } = playerWith(three());

    act(() => result.current.toggleAutoContinue());

    expect(result.current.autoContinue).toBe(false);
    expect(localStorage.getItem(AUTO_CONTINUE_KEY)).toBe('false');
  });

  it('starts from what the viewer chose last time', () => {
    localStorage.setItem(AUTO_CONTINUE_KEY, 'true');

    const { result } = playerWith(three());

    expect(result.current.autoContinue).toBe(true);
  });

  it('starts off for a viewer who has never chosen', () => {
    const { result } = playerWith(three());

    expect(result.current.autoContinue).toBe(false);
  });
});

describe('the rest of the app', () => {
  it('knows whether the ranking has anything to play', () => {
    expect(playerWith(three()).result.current.hasPlayableVideos).toBe(true);
    expect(playerWith([countryContestant('a')]).result.current.hasPlayableVideos).toBe(false);
  });

  it('reports which video is floating so the ranked list can flag it', () => {
    const { result } = playerWith(three());

    act(() => result.current.playList());

    expect(result.current.pipVideoId).toBe(videoId(1));
    expect(result.current.activeVideoId).toBe(videoId(1));
  });

  it('reopens the song of the floating video when it is expanded', () => {
    const { result, onExpand } = playerWith(three());
    act(() => result.current.playList());

    act(() => result.current.expand());

    expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
    expect(result.current.expandNonce).toBe(1);
  });

  it('has nothing to expand when no video is open', () => {
    const { result, onExpand } = playerWith(three());

    act(() => result.current.expand());

    expect(onExpand).not.toHaveBeenCalled();
  });

  it('closes the song modal when a docked video is popped out', () => {
    const { result, onMinimize } = playerWith(three());
    const dock = document.createElement('div');
    act(() =>
      result.current.registerDock(dock, {
        videoId: videoId(1),
        title: 'a artist - a song',
        contestant: rankedItems[0]!,
      }),
    );

    act(() => result.current.popOut());

    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it('has nothing to pop out when a video is already floating', () => {
    const { result, onMinimize } = playerWith(three());
    act(() => result.current.playList());

    act(() => result.current.popOut());

    expect(onMinimize).not.toHaveBeenCalled();
  });
});

describe('closing the floating player', () => {
  it('takes the video off the screen', () => {
    const { result } = playerWith(three());
    act(() => result.current.playList());

    act(() => result.current.closePip());

    expect(result.current.video).toBeNull();
    expect(result.current.pipVideoId).toBeNull();
  });
});
