import {
  generateYoutubePlaylistUrl,
  getYoutubeThumbnail,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
  rankedHasAnyYoutubeLinks,
} from './YoutubeUtil';
import { Contestant } from '../data/Contestant';
import { Country } from '../data/Country';
import { CountryContestant } from '../data/CountryContestant';

const mockRankedItems = [
  {
    contestant: {
      youtube: 'https://www.youtube.com/watch?v=video1',
    },
  },
  {
    contestant: {
      youtube: 'https://www.youtube.com/watch?v=video2',
    },
  },
  {
    contestant: {}, // no YouTube link
  },
] as CountryContestant[];

describe('generateYoutubePlaylistUrl', () => {
  it('generates a YouTube playlist URL with video IDs', () => {
    const playlistUrl = generateYoutubePlaylistUrl(mockRankedItems);

    // expect URL to contain video IDs of mockRankedItems with YouTube links
    expect(playlistUrl).toBe('https://www.youtube.com/watch_videos?video_ids=video1,video2');
  });

  it('returns single YouTube link in playlist', () => {
    const emptyPlaylistUrl = generateYoutubePlaylistUrl([
      {
        id: 'test1',
        country: {} as Country,
        contestant: {
          countryKey: 'country1',
          artist: 'artist1',
          song: 'song1',
          finalsRank: 3,
          semiFinalsRank: 4,
          youtube: 'https://www.youtube.com/watch?v=video1', // has youtube link
        } as Contestant,
      },
      {
        id: 'test1',
        country: {} as Country,
        contestant: {
          countryKey: 'country1',
          artist: 'artist1',
          song: 'song1',
          finalsRank: 3,
          semiFinalsRank: 4,
          youtube: undefined, // no youtube
        } as Contestant,
      },
    ]);

    // expect URL to be just the base URL without any video IDs
    expect(emptyPlaylistUrl).toBe('https://www.youtube.com/watch_videos?video_ids=video1');
  });
});

describe('rankedHasAnyYoutubeLinks', () => {
  it('reports a link when at least one entry has one', () => {
    expect(rankedHasAnyYoutubeLinks(mockRankedItems)).toBe(true);
  });

  it('reports no link when no entry has one', () => {
    expect(rankedHasAnyYoutubeLinks([{ contestant: {} } as CountryContestant])).toBe(false);
  });

  it('reports no link for an empty ranking', () => {
    expect(rankedHasAnyYoutubeLinks([])).toBe(false);
  });
});

describe('getYouTubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
  ])('reads the video out of %s', (url, expected) => {
    expect(getYouTubeVideoId(url)).toBe(expected);
  });

  it('finds no video in an unrelated link', () => {
    expect(getYouTubeVideoId('https://example.com/song')).toBeNull();
  });

  it('rejects an identifier that is the wrong length to be a video', () => {
    expect(getYouTubeVideoId('https://www.youtube.com/watch?v=tooshort')).toBeNull();
  });
});

describe('getYoutubeThumbnail', () => {
  it('points at the thumbnail for the linked video', () => {
    expect(getYoutubeThumbnail('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
  });

  it('has no thumbnail when there is no link', () => {
    expect(getYoutubeThumbnail(undefined)).toBeNull();
  });

  it('has no thumbnail when the link holds no video', () => {
    expect(getYoutubeThumbnail('https://example.com/song')).toBeNull();
  });
});

describe('getYouTubeThumbnailUrl', () => {
  it('has no thumbnail without a video', () => {
    expect(getYouTubeThumbnailUrl(null)).toBeNull();
  });
});
