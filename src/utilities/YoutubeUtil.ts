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

/**
 * Get's the youtube thumbnail for a given url
 * @param url 
 * @returns 
 */
export const getYoutubeThumbnail = (url?: string): string | null => {
    if (!url) return null;

    const videoId = getYouTubeVideoId(url);
    return getYouTubeThumbnailUrl(videoId) || null;
}

/**
 * Extracts the youtube video id from a given url
 * @param url 
 * @returns 
 */
export const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };
  
  /**
   * Generates a youtube thumbnail url from a given video id
   * @param videoId 
   * @returns 
   */
  export const getYouTubeThumbnailUrl = (videoId: string | null): string | null => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };
