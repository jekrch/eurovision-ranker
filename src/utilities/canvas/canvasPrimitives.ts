import { logger } from '../logger';
import { RankingCanvasConfig } from './canvasTypes';
import { getColorForCountryCode } from './canvasTheme';

/*
  Pure drawing/measurement primitives shared by both canvas styles. These take an
  already-constructed 2D context plus already-loaded images; asset loading lives in
  `canvasAssets.ts`.
*/

export const roundRect = (
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

export const drawFallbackFlag = (
  ctx: CanvasRenderingContext2D,
  countryCode: string,
  x: number,
  y: number,
  width: number,
  height: number,
  config: RankingCanvasConfig,
  fillColor: string
): void => {
  ctx.fillStyle = fillColor;
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

export const wrapText = (
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

export const drawFlagWithCover = (
    ctx: CanvasRenderingContext2D,
    flagImage: HTMLImageElement,
    countryCode: string,
    x: number,
    y: number,
    boxWidth: number,
    boxHeight: number,
    config: RankingCanvasConfig,
    fillColor: string
) => {
    ctx.save();

    ctx.fillStyle = fillColor;
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
        logger.warn("Flag image has no dimensions, drawing fallback", countryCode);
        ctx.restore();
        drawFallbackFlag(ctx, countryCode, x, y, boxWidth, boxHeight, config, fillColor);
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
        logger.error("Error drawing flag image with cover:", e);
    }
    ctx.restore();
};

// shorten text with a trailing ellipsis so a row stays single-line
export const truncateText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string
): string => {
  ctx.font = font;
  if (maxWidth <= 0 || ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t.trimEnd() + '…';
};

// draw uppercase, lightly letter-spaced text; returns the x position after it
export const drawTracked = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
): number => {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx;
};

export const drawModernGloss = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  ctx.save();
  roundRect(ctx, x, y, width, height, radius, false, false);
  ctx.clip();
  const gloss = ctx.createLinearGradient(x, y, x, y + height);
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
  gloss.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
  ctx.fillStyle = gloss;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};
