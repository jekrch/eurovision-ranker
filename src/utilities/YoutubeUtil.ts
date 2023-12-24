import { CountryContestant } from "../data/CountryContestant";

/**
 * For each provided country contestant, if it has a youtube link, extract the id. Then 
 * take all of the ids and append them to the playlist generating url
 * @param rankedItems 
 * @returns 
 */
export const generateYoutubePlaylistUrl = (rankedItems: CountryContestant[]): string => {
    const baseYouTubeURL = "https://www.youtube.com/watch_videos?video_ids=";
    const videoIds = rankedItems.map(item => {
        if (!item?.contestant?.youtube?.length) {
            return;
        }
        let youtubeURL: URL = new URL(item?.contestant?.youtube);
        const urlParams = new URLSearchParams(youtubeURL.search);

        return urlParams.get('v');

    }).filter(id => id?.length).join(',');

    return baseYouTubeURL + videoIds;
};

/**
 * Determines whether any of the provided rankedItems have a youtube link
 * @param rankedItems 
 * @returns 
 */
export const rankedHasAnyYoutubeLinks = (rankedItems: CountryContestant[]): boolean => { 
    return rankedItems.some(
        item => item?.contestant?.youtube?.length
    );
};
