import { CountryContestant } from '../data/CountryContestant';
import { toast } from 'react-hot-toast';

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
  headerGradient: string[];
  cardBackground: string;
  titleText: string;
  rankText: string;
  artistText: string;
  songText: string;
  footerText: string;
  shadow: string;
};

// Helper function to get CSS variable value
const getCSSVariable = (variableName: string, fallback: string): string => {
  if (typeof window === 'undefined' || !document.documentElement) {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return value || fallback;
};

// Function to get theme colors from CSS variables
const getThemeColors = (): RankingColors => {
  return {
    background: getCSSVariable('--er-body-bg', '#0d0f1d'),
    headerGradient: [
      getCSSVariable('--er-nav-gradient-start', '#13172b'),
      getCSSVariable('--er-nav-gradient-end', '#334678')
    ],
    cardBackground: getCSSVariable('--er-surface-tertiary', '#03022d'),
    titleText: getCSSVariable('--er-text-primary', '#e2e8f0'),
    rankText: '#FFFFFF',
    artistText: getCSSVariable('--er-text-primary', '#e2e8f0'),
    songText: getCSSVariable('--er-text-secondary', '#cbd5e1'),
    footerText: getCSSVariable('--er-text-tertiary', '#a7b9d2'),
    shadow: 'rgba(0, 0, 0, 0.3)',
  };
};

const DEFAULT_CONFIG: RankingCanvasConfig = {
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

const DEFAULT_COLORS: RankingColors = getThemeColors();

/*
  Helper Functions
*/
const loadSvgAsImage = (url: string, width: number, height: number): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    fetch(url, {
      mode: 'cors',
      headers: {
        'Origin': window.location.origin
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status} ${response.statusText} from ${url}`);
        }
        return response.text();
      })
      .then(svgText => {
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const dataUrl = URL.createObjectURL(svgBlob);

        const img = new Image(width, height);
        img.onload = () => {
          URL.revokeObjectURL(dataUrl);
          resolve(img);
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(dataUrl);
          reject(new Error(`Failed to load SVG image from data URL (original: ${url}): ${err}`));
        };
        img.src = dataUrl;
      })
      .catch(error => reject(error));
  });
};

const loadFlagImage = async (countryCode: string): Promise<HTMLImageElement | null> => {
  try {
    const sources = [
      `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`,
      `https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`
    ];

    for (const source of sources) {
      try {
        if (source.endsWith('.svg')) {
          return await loadSvgAsImage(source, 100, 75);
        } else {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (err) => reject(new Error(`Image load error from ${source}: ${err}`));
            img.crossOrigin = 'anonymous';
            img.src = source;
          });
          return img;
        }
      } catch (error) {
        console.warn(`Failed to load flag from ${source}:`, error);
      }
    }
    throw new Error(`Could not load flag for ${countryCode} from any source`);
  } catch (error) {
    console.warn(`Could not load flag image for ${countryCode}:`, error);
    return null;
  }
};

const getColorForCountryCode = (countryKey: string): string => {
  const colorMap: Record<string, string> = {
    'al': '#dc3545', 'am': '#dc3545', 'au': '#28a745', 'at': '#dc3545',
    'az': '#17a2b8', 'be': '#000000', 'hr': '#dc3545', 'cy': '#ffc107',
    'cz': '#fd7e14', 'dk': '#343a40', 'ee': '#6f42c1', 'fi': '#28a745',
    'fr': '#0d6efd', 'ge': '#dc3545', 'de': '#6c757d', 'gr': '#28a745',
    'is': '#fd7e14', 'ie': '#28a745', 'il': '#28a745', 'it': '#28a745',
    'lv': '#6f42c1', 'lt': '#ffc107', 'lu': '#dc3545', 'mt': '#28a745',
    'me': '#6c757d', 'nl': '#fd7e14', 'no': '#dc3545', 'pl': '#6c757d',
    'pt': '#28a745', 'sm': '#28a745', 'rs': '#dc3545', 'si': '#28a745',
    'es': '#6f42c1', 'se': '#28a745', 'ch': '#6f42c1', 'ua': '#28a745',
    'gb': '#28a745', 'uk': '#28a745'
  };

  if (colorMap[countryKey.toLowerCase()]) {
    return colorMap[countryKey.toLowerCase()];
  }

  let hash = 0;
  for (let i = 0; i < countryKey.length; i++) {
    hash = countryKey.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + Math.min(Math.max(value, 60), 200).toString(16)).slice(-2);
  }
  return color;
};

const loadFont = (fontFamily: string, fontWeight: string = 'normal'): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const fontCheck = `${fontWeight} 16px ${fontFamily}`;
    if (document.fonts && typeof document.fonts.check === 'function') {
        document.fonts.ready.then(() => {
            if (document.fonts.check(fontCheck)) {
                resolve(true);
                return;
            }
            const font = new FontFace(fontFamily, `local('${fontFamily}')`, { weight: fontWeight });
            font.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                resolve(true);
            }).catch(() => {
                console.warn(`Failed to load font: ${fontFamily} ${fontWeight}`);
                resolve(false);
            });
        }).catch(() => {
             console.warn(`document.fonts.ready promise rejected for ${fontFamily}`);
             resolve(false);
        });
    } else {
        console.warn('document.fonts API not fully available. Font loading might be unreliable.');
        resolve(true);
    }
  });
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 4,
  fill: boolean = true,
  stroke: boolean = false
): void => {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
};

const drawFallbackFlag = (
  ctx: CanvasRenderingContext2D,
  countryCode: string,
  x: number,
  y: number,
  width: number,
  height: number,
  config: RankingCanvasConfig
): void => {
  ctx.fillStyle = config.flagBoxColor;
  roundRect(ctx, x, y, width, height, config.boxCornerRadius);

  ctx.fillStyle = getColorForCountryCode(countryCode);
  const padding = 2;
  ctx.fillRect(x + padding, y + padding, width - 2 * padding, height - 2 * padding);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.min(16, height - 8)}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(countryCode.toUpperCase(), x + width / 2, y + height / 2);
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string
): string[] => {
  if (maxWidth <= 0) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || "";
  ctx.font = font;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    const { width: testWidth } = ctx.measureText(testLine);
    if (testWidth < maxWidth && currentLine) {
      currentLine = testLine;
    } else {
      if(currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.filter(line => line.trim() !== "");
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
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, y, width, height);

  ctx.fillStyle = colors.footerText;
  ctx.font = `italic ${config.fontSizes.song * 0.9}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, y + height / 2);
};

const drawFlagWithCover = (
    ctx: CanvasRenderingContext2D,
    flagImage: HTMLImageElement,
    countryCode: string,
    x: number,
    y: number,
    boxWidth: number,
    boxHeight: number,
    config: RankingCanvasConfig
) => {
    ctx.save();

    ctx.fillStyle = config.flagBoxColor;
    roundRect(ctx, x, y, boxWidth, boxHeight, config.boxCornerRadius, true, false);

    ctx.beginPath();
    ctx.moveTo(x + config.boxCornerRadius -2, y);
    ctx.arcTo(x + boxWidth, y, x + boxWidth, y + boxHeight, config.boxCornerRadius);
    ctx.arcTo(x + boxWidth, y + boxHeight, x, y + boxHeight, config.boxCornerRadius);
    ctx.arcTo(x, y + boxHeight, x, y, config.boxCornerRadius);
    ctx.arcTo(x, y, x + boxWidth, y, config.boxCornerRadius);
    ctx.closePath();
    ctx.clip();

    const imgWidth = flagImage.naturalWidth || flagImage.width;
    const imgHeight = flagImage.naturalHeight || flagImage.height;

    if (!imgWidth || !imgHeight) {
        console.warn("Flag image has no dimensions, drawing fallback", countryCode);
        ctx.restore();
        drawFallbackFlag(ctx, countryCode, x, y, boxWidth, boxHeight, config);
        return;
    }

    const imgAspectRatio = imgWidth / imgHeight;
    const boxAspectRatio = boxWidth / boxHeight;

    let sx = 0, sy = 0, sWidth = imgWidth, sHeight = imgHeight;

    if (imgAspectRatio > boxAspectRatio) {
        sWidth = imgHeight * boxAspectRatio;
        sx = (imgWidth - sWidth) / 2;
    } else if (imgAspectRatio < boxAspectRatio) {
        sHeight = imgWidth / boxAspectRatio;
        sy = (imgHeight - sHeight) / 2;
    }

    try {
        ctx.drawImage(flagImage, sx, sy, sWidth, sHeight, x, y, boxWidth, boxHeight);
    } catch (e) {
        console.error("Error drawing flag image with cover:", e);
    }
    ctx.restore();
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

  let currentRankBoxColor = config.rankBoxColor;
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
    drawFlagWithCover(ctx, flagImage, country.key, flagBoxActualX, flagBoxActualY, config.flagBoxWidth, config.flagBoxHeight, config);
  } else {
    drawFallbackFlag(ctx, country.key, flagBoxActualX, flagBoxActualY, config.flagBoxWidth, config.flagBoxHeight, config);
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

  ctx.fillStyle = colors.background;
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
        console.warn(`Failed to load flag for ${code} in preload:`, error);
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
  drawFooter(ctx, 'Generated with eurovision-ranker.com', config.canvasWidth, actualFooterHeight, footerYPosition, colors, config);

  return canvas;
};

export const downloadRankingImage = async (
  rankedItems: CountryContestant[],
  rankingName: string = '',
  customConfig: Partial<RankingCanvasConfig> = {},
  customColors: Partial<RankingColors> = {}
): Promise<void> => {
  if (rankedItems.length === 0) {
    toast.error('Please rank some countries first');
    return;
  }

  const effectiveConfig = { ...DEFAULT_CONFIG, ...customConfig };
  if (!effectiveConfig.pixelRatio || effectiveConfig.pixelRatio < 2) {
    effectiveConfig.pixelRatio = 2;
  }

  const toastId = toast.loading('Creating your ranking image...');

  try {
    const canvas = await createRankingCanvas(rankedItems, rankingName, effectiveConfig, customColors);

    const sanitizedName = rankingName && rankingName.trim() !== ''
      ? rankingName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : 'eurovision-ranking';

    const filename = `${sanitizedName || 'ranking'}.png`;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blobContent) => {
        resolve(blobContent);
      }, 'image/png', 1.0);
    });

    if (!blob) {
        throw new Error('Failed to create image blob.');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.dismiss(toastId);
    toast.success('Ranking image downloaded!');
  } catch (error) {
    console.error('Error creating ranking image:', error);
    toast.dismiss(toastId);
    toast.error(`Failed to create image: ${error instanceof Error ? error.message : String(error)}`);
  }
};