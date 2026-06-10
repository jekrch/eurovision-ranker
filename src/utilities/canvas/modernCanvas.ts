import { loadFlagImage, loadFont } from './canvasAssets';
import {
  roundRect,
  truncateText,
  drawTracked,
  drawModernGloss,
  drawFlagWithCover,
  drawFallbackFlag,
} from './canvasPrimitives';
import { DEFAULT_CONFIG } from './classicCanvas';
import { CountryContestant } from '../../data/CountryContestant';

/*
  Modern Canvas Style

  Modeled on the official Eurovision grand-final scoreboard: a purple textured
  backdrop, a centered gold-to-pink gradient title, and two columns of glossy
  dark rows. Each row shows the flag, a pink rank badge, the country name, and
  the artist / song beneath it.
*/
const MODERN = {
  canvasWidth: 1040,
  outerPadding: 40,
  topPadding: 28,
  pixelRatio: 2,
  fontFamily: 'Arial, sans-serif',
  titleSize: 30,
  titleGap: 30,
  columnGap: 36,
  rowHeight: 52,
  rowGap: 8,
  rowRadius: 7,
  rowPaddingX: 9,
  flagWidth: 56,
  flagHeight: 40,
  flagRadius: 5,
  badgeWidth: 30,
  badgeHeight: 28,
  badgeRadius: 5,
  badgeOverlap: 13,
  textGap: 13,
  countrySize: 14,
  metaSize: 11,
  footerSize: 12,
  footerGap: 22,
};

type ModernPalette = {
  bgTop: string;
  bgBottom: string;
  glow: string;
  rowBg: string;
  badgeFrom: string;
  badgeTo: string;
  titleFrom: string;
  titleTo: string;
  country: string;
  meta: string;
  footer: string;
};

const getModernPalette = (): ModernPalette => ({
  bgTop: '#3a2c66',
  bgBottom: '#211737',
  glow: '#6a48a8',
  rowBg: 'rgba(13, 9, 28, 0.42)',
  badgeFrom: '#E84BA8',
  badgeTo: '#B5249A',
  titleFrom: '#F9C84B',
  titleTo: '#E85DAB',
  country: '#ffffff',
  meta: '#c9b6ec',
  footer: '#b7a7da',
});

const drawModernRow = (
  ctx: CanvasRenderingContext2D,
  item: CountryContestant,
  flagImage: HTMLImageElement | null,
  rank: number,
  x: number,
  y: number,
  width: number,
  palette: ModernPalette,
): void => {
  const h = MODERN.rowHeight;

  // row panel + horizontal sheen
  ctx.fillStyle = palette.rowBg;
  roundRect(ctx, x, y, width, h, MODERN.rowRadius);
  const sheen = ctx.createLinearGradient(x, y, x + width, y);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.00)');
  sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0.00)');
  ctx.fillStyle = sheen;
  roundRect(ctx, x, y, width, h, MODERN.rowRadius);

  // flag
  const flagX = x + MODERN.rowPaddingX;
  const flagY = y + (h - MODERN.flagHeight) / 2;
  const flagConfig = { ...DEFAULT_CONFIG, boxCornerRadius: MODERN.flagRadius };
  if (flagImage) {
    drawFlagWithCover(
      ctx,
      flagImage,
      item.country.key,
      flagX,
      flagY,
      MODERN.flagWidth,
      MODERN.flagHeight,
      flagConfig,
      palette.rowBg,
    );
  } else {
    drawFallbackFlag(
      ctx,
      item.country.key,
      flagX,
      flagY,
      MODERN.flagWidth,
      MODERN.flagHeight,
      flagConfig,
      palette.rowBg,
    );
  }
  drawModernGloss(ctx, flagX, flagY, MODERN.flagWidth, MODERN.flagHeight, MODERN.flagRadius);

  // pink rank badge, overlapping the flag's right edge
  const badgeX = flagX + MODERN.flagWidth - MODERN.badgeOverlap;
  const badgeY = y + (h - MODERN.badgeHeight) / 2;
  const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + MODERN.badgeHeight);
  badgeGrad.addColorStop(0, palette.badgeFrom);
  badgeGrad.addColorStop(1, palette.badgeTo);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = badgeGrad;
  roundRect(ctx, badgeX, badgeY, MODERN.badgeWidth, MODERN.badgeHeight, MODERN.badgeRadius);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 14px ${MODERN.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    rank.toString().padStart(2, '0'),
    badgeX + MODERN.badgeWidth / 2,
    badgeY + MODERN.badgeHeight / 2 + 1,
  );

  // text block: country (top) + artist / song (bottom)
  const textX = badgeX + MODERN.badgeWidth + MODERN.textGap;
  const textWidth = x + width - MODERN.rowPaddingX - textX;

  const country = (item.country.name || '').toUpperCase();
  const artist = item.contestant?.artist || '';
  const song = item.contestant?.song ? `"${item.contestant.song}"` : '';
  const meta = [artist, song].filter(Boolean).join('  ');

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = palette.country;
  const countryFont = `bold ${MODERN.countrySize}px ${MODERN.fontFamily}`;
  ctx.font = countryFont;
  const countryY = meta ? y + h / 2 - 3 : y + h / 2 + MODERN.countrySize / 2 - 2;
  // letter-spacing eats width, so budget for it when truncating
  const trackedCountry = truncateText(ctx, country, textWidth - country.length * 0.6, countryFont);
  drawTracked(ctx, trackedCountry, textX, countryY, 0.6);

  if (meta) {
    ctx.fillStyle = palette.meta;
    const metaFont = `${MODERN.metaSize}px ${MODERN.fontFamily}`;
    ctx.font = metaFont;
    ctx.fillText(
      truncateText(ctx, meta, textWidth, metaFont),
      textX,
      y + h / 2 + MODERN.metaSize + 2,
    );
  }
};

export const createModernRankingCanvas = async (
  rankedItems: CountryContestant[],
  rankingName: string = 'My Eurovision Ranking',
): Promise<HTMLCanvasElement> => {
  const palette = getModernPalette();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  await loadFont(MODERN.fontFamily, 'normal');
  await loadFont(MODERN.fontFamily, 'bold');

  const width = MODERN.canvasWidth;
  const numColumns = 2;
  const columnWidth =
    (width - MODERN.outerPadding * 2 - MODERN.columnGap * (numColumns - 1)) / numColumns;
  const itemsPerColumn = Math.ceil(rankedItems.length / numColumns);
  const maxRows = Math.min(itemsPerColumn, rankedItems.length);

  const showHeader = !!(rankingName && rankingName.trim() !== '');
  const headerHeight = showHeader ? MODERN.titleSize + MODERN.titleGap : MODERN.topPadding;

  const rowsAreaHeight =
    maxRows > 0 ? maxRows * MODERN.rowHeight + (maxRows - 1) * MODERN.rowGap : 0;

  const rowsStartY = MODERN.topPadding + headerHeight;
  const totalHeight =
    rowsStartY + rowsAreaHeight + MODERN.footerGap + MODERN.footerSize + MODERN.topPadding;

  canvas.width = width * MODERN.pixelRatio;
  canvas.height = totalHeight * MODERN.pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${totalHeight}px`;
  ctx.scale(MODERN.pixelRatio, MODERN.pixelRatio);

  // background: vertical purple gradient + soft top glow + corner vignette
  const bg = ctx.createLinearGradient(0, 0, 0, totalHeight);
  bg.addColorStop(0, palette.bgTop);
  bg.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, totalHeight);

  const glow = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, width * 0.7);
  glow.addColorStop(0, `${palette.glow}55`);
  glow.addColorStop(1, `${palette.glow}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, totalHeight * 0.5);

  const vignette = ctx.createRadialGradient(
    width / 2,
    totalHeight / 2,
    width * 0.3,
    width / 2,
    totalHeight / 2,
    width * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, totalHeight);

  // title: centered gold→pink gradient, uppercase
  if (showHeader) {
    const title = rankingName.toUpperCase();
    const titleFont = `bold ${MODERN.titleSize}px ${MODERN.fontFamily}`;
    ctx.font = titleFont;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const spacing = 1.5;
    const titleWidth = [...title].reduce(
      (w, ch) => w + ctx.measureText(ch).width + spacing,
      -spacing,
    );
    const titleGrad = ctx.createLinearGradient(
      (width - titleWidth) / 2,
      0,
      (width + titleWidth) / 2,
      0,
    );
    titleGrad.addColorStop(0, palette.titleFrom);
    titleGrad.addColorStop(1, palette.titleTo);
    ctx.fillStyle = titleGrad;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    drawTracked(
      ctx,
      title,
      (width - titleWidth) / 2,
      MODERN.topPadding + MODERN.titleSize,
      spacing,
    );
    ctx.restore();
  }

  // preload flags
  const flagImages: Record<string, HTMLImageElement | null> = {};
  await Promise.all(
    rankedItems.map(async (item) => {
      try {
        flagImages[item.country.key] = await loadFlagImage(item.country.key);
      } catch {
        flagImages[item.country.key] = null;
      }
    }),
  );

  // rows, filling column 0 then column 1
  for (let i = 0; i < rankedItems.length; i++) {
    const columnIndex = Math.floor(i / itemsPerColumn);
    const rowInColumn = i - columnIndex * itemsPerColumn;
    const x = MODERN.outerPadding + columnIndex * (columnWidth + MODERN.columnGap);
    const y = rowsStartY + rowInColumn * (MODERN.rowHeight + MODERN.rowGap);
    drawModernRow(
      ctx,
      rankedItems[i],
      flagImages[rankedItems[i].country.key],
      i + 1,
      x,
      y,
      columnWidth,
      palette,
    );
  }

  // footer
  ctx.fillStyle = palette.footer;
  ctx.font = `italic ${MODERN.footerSize}px ${MODERN.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'created with eurovision-ranker.com',
    width / 2,
    totalHeight - MODERN.topPadding - MODERN.footerSize / 2,
  );

  return canvas;
};
