import { Contestant } from "../data/Contestant";
import { Country } from "../data/Country";
import { CountryContestant } from "../data/CountryContestant";
import { generateYoutubePlaylistUrl } from "./YoutubeUtil";

const mockRankedItems = [
    {
        contestant: {
            youtube: 'https://www.youtube.com/watch?v=video1'
        }
    },
    {
        contestant: {
            youtube: 'https://www.youtube.com/watch?v=video2'
        }
    },
    {
        contestant: {} // no YouTube link
    }
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
                id: "test1",
                country: {} as Country,
                contestant:
                    {
                        countryKey: 'country1',
                        artist: 'artist1',
                        song: 'song1',
                        finalsRank: 3,
                        semiFinalsRank: 4,
                        youtube: 'https://www.youtube.com/watch?v=video1' // has youtube link
                    } as Contestant
            }, 
            {
                id: "test1",
                country: {} as Country,
                contestant:
                    {
                        countryKey: 'country1',
                        artist: 'artist1',
                        song: 'song1',
                        finalsRank: 3,
                        semiFinalsRank: 4,
                        youtube: undefined // no youtube
                    } as Contestant
            },
        ]);

        // expect URL to be just the base URL without any video IDs
        expect(emptyPlaylistUrl).toBe('https://www.youtube.com/watch_videos?video_ids=video1');
    });
});