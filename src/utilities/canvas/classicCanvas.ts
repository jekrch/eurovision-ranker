import { logger } from '../logger';
import { CountryContestant } from '../../data/CountryContestant';
import { RankingCanvasConfig, RankingColors } from './canvasTypes';
import { getCSSVariable, getThemeColors } from './canvasTheme';
import { loadFlagImage, loadFont } from './canvasAssets';
import { roundRect, wrapText, drawFallbackFlag, drawFlagWithCover } from './canvasPrimitives';

/*
  Classic canvas style: a centered title, gradient background, and two columns of
  cards (rank box / flag / artist + song). Layout measurement (`calculateItemHeight`)
  is kept separate from drawing (`drawRankedItem`).
*/

export const DEFAULT_CONFIG: RankingCanvasConfig = {
  baseItemHeight: 70,
  itemMargin: 12,
  canvasWidth: 800,
  padding: 20,
  columnPadding: 20,
  headerHeight: 60,
  footerMargin: 10,

  itemPadding: 8,
  rankBoxWidth: 55,
  rankBoxColor: getCSSVariable('--er-surface-accent', '#334678'),
  flagBoxWidth: 60,
  flagBoxHeight: 45,
  flagBoxColor: getCSSVariable('--er-surface-tertiary', '#1c214c'),
  textBoxColor: 'transparent',
  boxGap: 15,
  textPaddingLeft: 20,

  cardCornerRadius: 8,
  boxCornerRadius: 4,
  fontFamily: 'Arial, sans-serif',
  pixelRatio: 2,
  fontSizes: {
    title: 26,
    rankNumber: 25,
    artist: 15,
    song: 13,
  },
};

/*
  Component Drawing Functions
*/
const drawHeader = (
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  colors: RankingColors,
  config: RankingCanvasConfig
): void => {
  const headerGradient = ctx.createLinearGradient(0, 0, width, height);
  colors.headerGradient.forEach((color, index) => {
    headerGradient.addColorStop(index / (colors.headerGradient.length - 1 || 1), color);
  });

  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = colors.titleText;
  ctx.font = `bold ${config.fontSizes.title}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 1.8);
};

const drawFooter = (
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  y: number,
  colors: RankingColors,
  config: RankingCanvasConfig
): void => {
  // Create horizontal gradient that fades out at edges
  const footerGradient = ctx.createLinearGradient(0, y, width, y);
  const bgColor = colors.background;

  // Parse the color to add alpha
  const addAlpha = (color: string, alpha: number) => {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  };

  footerGradient.addColorStop(0, addAlpha(bgColor, 0));      // transparent at left edge
  footerGradient.addColorStop(0.2, addAlpha(bgColor, 0.6));  // fade in
  footerGradient.addColorStop(0.5, addAlpha(bgColor, 0.8));  // solid in center
  footerGradient.addColorStop(0.8, addAlpha(bgColor, 0.6));  // fade out
  footerGradient.addColorStop(1, addAlpha(bgColor, 0));      // transparent at right edge

  ctx.fillStyle = footerGradient;
  ctx.fillRect(0, y, width, height);

  ctx.fillStyle = colors.footerText;
  ctx.font = `italic ${config.fontSizes.song * 0.9}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, y + height / 2);
};

const calculateItemHeight = (
  ctx: CanvasRenderingContext2D,
  item: CountryContestant,
  columnItemWidth: number,
  config: RankingCanvasConfig
): number => {
  const artistName = item.contestant?.artist || "Unknown Artist";
  const songName = item.contestant?.song ? `"${item.contestant.song}"` : "";

  const textBlockX = config.itemPadding + config.rankBoxWidth + config.boxGap + config.flagBoxWidth + config.textPaddingLeft;
  const textBlockWidth = columnItemWidth - textBlockX - config.itemPadding;

  let textContentHeight = 0;
  const lineHeightMultiplier = 1.25;
  const spaceBetweenArtistSong = 5;

  const artistFont = `bold ${config.fontSizes.artist}px ${config.fontFamily}`;
  const artistLines = wrapText(ctx, artistName, textBlockWidth, artistFont);
  textContentHeight += artistLines.length * config.fontSizes.artist * lineHeightMultiplier;

  if (songName) {
    textContentHeight += spaceBetweenArtistSong;
    const songFont = `${config.fontSizes.song}px ${config.fontFamily}`;
    const songLines = wrapText(ctx, songName, textBlockWidth, songFont);
    textContentHeight += songLines.length * config.fontSizes.song * lineHeightMultiplier;
  }

  const contentMinHeight = Math.max(config.flagBoxHeight, textContentHeight);
  return Math.max(config.baseItemHeight, contentMinHeight + config.itemPadding * 2);
};

const drawRankedItem = (
  ctx: CanvasRenderingContext2D,
  item: CountryContestant,
  flagImage: HTMLImageElement | null,
  rank: number,
  itemCardX: number,
  itemCardY: number,
  itemCardWidth: number,
  itemCardHeight: number,
  colors: RankingColors,
  config: RankingCanvasConfig
): void => {
  const { country, contestant } = item;

  // Medal Colors - using theme variables
  const GOLD_COLOR = getCSSVariable('--er-interactive-primary', '#9e33ea');
  const SILVER_COLOR = getCSSVariable('--er-gradient-text-2', '#6a91d1');
  const BRONZE_COLOR = getCSSVariable('--er-gradient-text-3', '#3b82f6');

  ctx.save();
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = colors.cardBackground;
  roundRect(ctx, itemCardX, itemCardY, itemCardWidth, itemCardHeight, config.cardCornerRadius, true, false);
  ctx.restore();

  const rankBoxActualX = itemCardX + config.itemPadding;
  const rankBoxActualY = itemCardY + config.itemPadding;
  const rankBoxActualHeight = itemCardHeight - 2 * config.itemPadding;

  let currentRankBoxColor = colors.rankBoxColor;

  if (rank === 1) {
    currentRankBoxColor = GOLD_COLOR;
  } else if (rank === 2) {
    currentRankBoxColor = SILVER_COLOR;
  } else if (rank === 3) {
    currentRankBoxColor = BRONZE_COLOR;
  }
  ctx.fillStyle = currentRankBoxColor;
  roundRect(ctx, rankBoxActualX, rankBoxActualY, config.rankBoxWidth, rankBoxActualHeight, config.boxCornerRadius);

  ctx.fillStyle = colors.rankText;
  ctx.font = `bold ${config.fontSizes.rankNumber}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rank.toString(), rankBoxActualX + config.rankBoxWidth / 2, rankBoxActualY + rankBoxActualHeight / 2);

  const flagBoxActualX = rankBoxActualX + config.rankBoxWidth + config.boxGap;
  const flagBoxActualY = itemCardY + (itemCardHeight - config.flagBoxHeight) / 2;

  if (flagImage) {
    drawFlagWithCover(ctx, flagImage, country.key, flagBoxActualX, flagBoxActualY, config.flagBoxWidth, config.flagBoxHeight, config, colors.flagBoxColor);
  } else {
    drawFallbackFlag(ctx, country.key, flagBoxActualX, flagBoxActualY, config.flagBoxWidth, config.flagBoxHeight, config, colors.flagBoxColor);
  }

  const textBoxActualX = flagBoxActualX + config.flagBoxWidth + config.textPaddingLeft;
  const textBoxActualY = itemCardY + config.itemPadding;
  const textBoxActualWidth = itemCardWidth - (textBoxActualX - itemCardX) - config.itemPadding;
  const textBoxActualHeight = itemCardHeight - 2 * config.itemPadding;

  if (config.textBoxColor !== 'transparent') {
      ctx.fillStyle = config.textBoxColor;
      roundRect(ctx, textBoxActualX, textBoxActualY, textBoxActualWidth, textBoxActualHeight, config.boxCornerRadius);
  }

  const artistName = contestant?.artist || "Unknown Artist";
  const songName = contestant?.song ? `"${contestant.song}"` : "";

  const artistFont = `bold ${config.fontSizes.artist}px ${config.fontFamily}`;
  const songFont = `${config.fontSizes.song}px ${config.fontFamily}`;
  const lineHeightMultiplier = 1.25;
  const spaceBetweenArtistSong = 5;

  const artistLines = wrapText(ctx, artistName, textBoxActualWidth, artistFont);
  let textContentRenderHeight = artistLines.length * config.fontSizes.artist * lineHeightMultiplier;

  let songLines: string[] = [];
  if (songName) {
    songLines = wrapText(ctx, songName, textBoxActualWidth, songFont);
    textContentRenderHeight += spaceBetweenArtistSong + (songLines.length * config.fontSizes.song * lineHeightMultiplier);
  }

  let textStartY = textBoxActualY + (textBoxActualHeight - textContentRenderHeight) / 2;
  textStartY = Math.max(textStartY, textBoxActualY);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillStyle = colors.artistText;
  ctx.font = artistFont;
  artistLines.forEach(line => {
    ctx.fillText(line, textBoxActualX, textStartY);
    textStartY += config.fontSizes.artist * lineHeightMultiplier;
  });

  if (songName) {
    textStartY += spaceBetweenArtistSong;
    ctx.fillStyle = colors.songText;
    ctx.font = songFont;
    songLines.forEach(line => {
      ctx.fillText(line, textBoxActualX, textStartY);
      textStartY += config.fontSizes.song * lineHeightMultiplier;
    });
  }
};

/*
  Main Canvas Creation
*/
export const createRankingCanvas = async (
  rankedItems: CountryContestant[],
  rankingName: string = 'My Eurovision Ranking',
  customConfig: Partial<RankingCanvasConfig> = {},
  customColors: Partial<RankingColors> = {}
): Promise<HTMLCanvasElement> => {
  const currentThemeColors = getThemeColors();

  // Create default config with current theme values
  const defaultConfigWithTheme: RankingCanvasConfig = {
    ...DEFAULT_CONFIG,
    rankBoxColor: getCSSVariable('--er-surface-accent', '#334678'),
    flagBoxColor: getCSSVariable('--er-surface-tertiary', '#1c214c'),
  };


  const config: RankingCanvasConfig = { ...defaultConfigWithTheme, ...customConfig };
  config.fontSizes = { ...DEFAULT_CONFIG.fontSizes, ...customConfig.fontSizes };
  const colors: RankingColors = { ...currentThemeColors, ...customColors };

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  await loadFont(config.fontFamily, 'normal');
  await loadFont(config.fontFamily, 'bold');

  const numColumns = 2;
  const columnItemWidth = (config.canvasWidth - config.padding * 2 - config.columnPadding * (numColumns - 1)) / numColumns;

  const itemRealHeights = rankedItems.map(item =>
    calculateItemHeight(ctx, item, columnItemWidth, config)
  );

  const itemsPerColumnTarget = Math.ceil(rankedItems.length / numColumns);
  let columnActualContentHeights = Array(numColumns).fill(0);

  for (let i = 0; i < rankedItems.length; i++) {
    const columnIndex = Math.floor(i / itemsPerColumnTarget);
    if (columnIndex < numColumns) {
        columnActualContentHeights[columnIndex] += itemRealHeights[i] + config.itemMargin;
    } else {
        columnActualContentHeights[numColumns-1] += itemRealHeights[i] + config.itemMargin;
    }
  }

  columnActualContentHeights = columnActualContentHeights.map(h => h > 0 ? h - config.itemMargin : 0);
  const maxColumnContentHeight = Math.max(0, ...columnActualContentHeights);

  const showHeader = rankingName && rankingName.trim() !== '';
  const effectiveHeaderHeight = showHeader ? config.headerHeight : 0;
  const actualFooterHeight = 30;

  const totalHeight = effectiveHeaderHeight +
                    config.padding +
                    maxColumnContentHeight +
                    config.padding +
                    config.footerMargin +
                    actualFooterHeight;

  const physicalWidth = config.canvasWidth * config.pixelRatio;
  const physicalHeight = totalHeight * config.pixelRatio;

  canvas.width = physicalWidth;
  canvas.height = physicalHeight;
  canvas.style.width = `${config.canvasWidth}px`;
  canvas.style.height = `${totalHeight}px`;

  ctx.scale(config.pixelRatio, config.pixelRatio);

  // Draw gradient background with subtle glow in bottom right
  const bgGradient = ctx.createRadialGradient(
    config.canvasWidth * 0.85,  // x0 - start x position (bottom right area)
    totalHeight * 0.85,          // y0 - start y position (bottom right area)
    0,                           // r0 - inner radius
    config.canvasWidth * 0.85,   // x1 - end x position (same as start for concentric circles)
    totalHeight * 0.85,          // y1 - end y position (same as start for concentric circles)
    config.canvasWidth * 1.2     // r1 - outer radius (extends beyond canvas)
  );
  bgGradient.addColorStop(0, colors.backgroundGradient[1]); // lighter color at center
  bgGradient.addColorStop(0.4, colors.backgroundGradient[0]); // fade to dark
  bgGradient.addColorStop(1, colors.backgroundGradient[0]); // dark at edges

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, config.canvasWidth, totalHeight);

  if (showHeader) {
    drawHeader(ctx, rankingName, config.canvasWidth, config.headerHeight, colors, config);
  }

  const countryCodes = rankedItems.map(item => item.country.key);
  const flagImages: Record<string, HTMLImageElement | null> = {};

  await Promise.all(
    countryCodes.map(async code => {
      try {
        flagImages[code] = await loadFlagImage(code);
      } catch (error) {
        logger.warn(`Failed to load flag for ${code} in preload:`, error);
        flagImages[code] = null;
      }
    })
  );

  const itemsStartY = effectiveHeaderHeight + config.padding;
  let currentYPerColumn = Array(numColumns).fill(itemsStartY);
  const columnXStartPositions = Array(numColumns).fill(0).map((_, colIndex) =>
    config.padding + colIndex * (columnItemWidth + config.columnPadding)
  );

  for (let i = 0; i < rankedItems.length; i++) {
    const item = rankedItems[i];
    const rank = i + 1;
    const itemH = itemRealHeights[i];
    const flagImage = flagImages[item.country.key];

    const columnIndex = Math.floor(i / itemsPerColumnTarget);

    drawRankedItem(
      ctx, item, flagImage, rank,
      columnXStartPositions[columnIndex],
      currentYPerColumn[columnIndex],
      columnItemWidth, itemH,
      colors, config
    );
    currentYPerColumn[columnIndex] += itemH + config.itemMargin;
  }

  const footerYPosition = totalHeight - actualFooterHeight - config.footerMargin;
  drawFooter(ctx, 'created with eurovision-ranker.com', config.canvasWidth, actualFooterHeight, footerYPosition, colors, config);

  return canvas;
};
