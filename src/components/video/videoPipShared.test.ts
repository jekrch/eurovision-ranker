// @vitest-environment jsdom
import {
  buildSrc,
  computePipGeom,
  itemKey,
  PIP_MARGIN,
  PIP_MAX_WIDTH,
  videoInfoFor,
} from './videoPipShared';
import { Contestant } from '../../data/Contestant';
import { CountryContestant } from '../../data/CountryContestant';

function countryContestant(
  overrides: { youtube?: string; artist?: string; song?: string; uid?: string; id?: string } = {},
): CountryContestant {
  const { uid, id = 'a', ...contestant } = overrides;
  return {
    id,
    uid,
    country: { id, name: 'Sweden', key: 'se', icon: '' },
    contestant: {
      countryKey: 'se',
      artist: 'Loreen',
      song: 'Tattoo',
      ...contestant,
    } as Contestant,
  } as CountryContestant;
}

const viewport = (width: number, height: number) => {
  window.innerWidth = width;
  window.innerHeight = height;
};

beforeEach(() => viewport(1280, 800));

describe('buildSrc', () => {
  it('embeds the requested video', () => {
    expect(buildSrc('dQw4w9WgXcQ', false)).toContain('/embed/dQw4w9WgXcQ');
  });

  it('starts playing when playback is already under way', () => {
    expect(buildSrc('dQw4w9WgXcQ', true)).toContain('autoplay=1');
  });

  it('waits for the viewer to press play on a freshly opened video', () => {
    expect(buildSrc('dQw4w9WgXcQ', false)).not.toContain('autoplay');
  });

  it('lets the app drive the player', () => {
    expect(buildSrc('dQw4w9WgXcQ', false)).toContain('enablejsapi=1');
  });

  it('identifies the page the player is embedded in', () => {
    expect(buildSrc('dQw4w9WgXcQ', false)).toContain(
      `origin=${encodeURIComponent(window.location.origin)}`,
    );
  });
});

describe('videoInfoFor', () => {
  it('describes the video of a contestant that has one', () => {
    const cc = countryContestant({ youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });

    expect(videoInfoFor(cc)).toMatchObject({
      videoId: 'dQw4w9WgXcQ',
      title: 'Loreen - Tattoo',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('keeps the contestant so the song can be reopened', () => {
    const cc = countryContestant({ youtube: 'https://youtu.be/dQw4w9WgXcQ' });

    expect(videoInfoFor(cc)!.contestant).toBe(cc);
  });

  it('has nothing to play for a contestant with no video', () => {
    expect(videoInfoFor(countryContestant())).toBeNull();
  });

  it('has nothing to play when the link holds no video', () => {
    expect(videoInfoFor(countryContestant({ youtube: 'https://example.com/song' }))).toBeNull();
  });
});

describe('itemKey', () => {
  it('identifies an entry by the id that is unique across contests', () => {
    expect(itemKey(countryContestant({ uid: '2023-se', id: 'a' }))).toBe('2023-se');
  });

  it('falls back to the country when a ranking covers a single contest', () => {
    expect(itemKey(countryContestant({ id: 'a' }))).toBe('a');
  });
});

describe('computePipGeom', () => {
  it('rests in the bottom corner until it is moved', () => {
    const geom = computePipGeom();

    expect(geom.left).toBe(1280 - PIP_MAX_WIDTH - PIP_MARGIN);
    expect(geom.top).toBeLessThan(800);
  });

  it('keeps the video in widescreen shape', () => {
    const geom = computePipGeom();

    expect(geom.height).toBe(Math.round((geom.width * 9) / 16));
  });

  it('stays within the width of a narrow screen', () => {
    viewport(320, 640);

    const geom = computePipGeom();

    expect(geom.width).toBe(320 - PIP_MARGIN * 2);
  });

  it('sits where the viewer dragged it', () => {
    const geom = computePipGeom({ left: 200, top: 150 });

    expect(geom).toMatchObject({ left: 200, top: 150 });
  });

  it('stays on screen when dragged past the right edge', () => {
    const geom = computePipGeom({ left: 5000, top: 100 });

    expect(geom.left).toBe(1280 - geom.width - PIP_MARGIN);
  });

  it('stays on screen when dragged past the top left corner', () => {
    const geom = computePipGeom({ left: -500, top: -500 });

    expect(geom).toMatchObject({ left: PIP_MARGIN, top: PIP_MARGIN });
  });

  it('leaves room for its controls when dragged to the bottom', () => {
    const geom = computePipGeom({ left: 100, top: 5000 });

    expect(geom.top + geom.height).toBeLessThan(800 - PIP_MARGIN);
  });
});
