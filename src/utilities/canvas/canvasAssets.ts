import { logger } from '../logger';

/*
  Asset loading helpers — flag images and fonts. These are async and side-effect
  heavy (network/font registration); the pure drawing helpers live in
  `canvasPrimitives.ts`.
*/

const loadSvgAsImage = (url: string, width: number, height: number): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    fetch(url, {
      mode: 'cors',
      headers: {
        Origin: window.location.origin,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load SVG: ${response.status} ${response.statusText} from ${url}`,
          );
        }
        return response.text();
      })
      .then((svgText) => {
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
      .catch((error) => reject(error));
  });
};

export const loadFlagImage = async (countryCode: string): Promise<HTMLImageElement | null> => {
  try {
    const sources = [
      `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`,
      `https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`,
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
        logger.warn(`Failed to load flag from ${source}:`, error);
      }
    }
    throw new Error(`Could not load flag for ${countryCode} from any source`);
  } catch (error) {
    logger.warn(`Could not load flag image for ${countryCode}:`, error);
    return null;
  }
};

export const loadFont = (fontFamily: string, fontWeight: string = 'normal'): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const fontCheck = `${fontWeight} 16px ${fontFamily}`;
    if (document.fonts && typeof document.fonts.check === 'function') {
      document.fonts.ready
        .then(() => {
          if (document.fonts.check(fontCheck)) {
            resolve(true);
            return;
          }
          const font = new FontFace(fontFamily, `local('${fontFamily}')`, { weight: fontWeight });
          font
            .load()
            .then((loadedFont) => {
              document.fonts.add(loadedFont);
              resolve(true);
            })
            .catch(() => {
              logger.warn(`Failed to load font: ${fontFamily} ${fontWeight}`);
              resolve(false);
            });
        })
        .catch(() => {
          logger.warn(`document.fonts.ready promise rejected for ${fontFamily}`);
          resolve(false);
        });
    } else {
      logger.warn('document.fonts API not fully available. Font loading might be unreliable.');
      resolve(true);
    }
  });
};
