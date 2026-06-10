/*
  Configuration and Types
*/

export type RankingCanvasConfig = {
  baseItemHeight: number;
  itemMargin: number;
  canvasWidth: number;
  padding: number;
  columnPadding: number;
  headerHeight: number;
  footerMargin: number;

  itemPadding: number;
  rankBoxWidth: number;
  rankBoxColor: string;
  flagBoxWidth: number;
  flagBoxHeight: number;
  flagBoxColor: string;
  textBoxColor: string;
  boxGap: number;
  textPaddingLeft: number;

  cardCornerRadius: number;
  boxCornerRadius: number;
  fontFamily: string;
  pixelRatio: number;
  fontSizes: {
    title: number;
    rankNumber: number;
    artist: number;
    song: number;
  };
};

export type RankingColors = {
  background: string;
  backgroundGradient: string[];
  headerGradient: string[];
  cardBackground: string;
  titleText: string;
  rankText: string;
  artistText: string;
  songText: string;
  footerText: string;
  shadow: string;
  rankBoxColor: string;
  flagBoxColor: string;
};

export type RankingImageStyle = 'modern' | 'classic';
