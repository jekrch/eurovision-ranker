import { toast } from 'react-hot-toast';

import { RankingCanvasConfig, RankingColors, RankingImageStyle } from './canvasTypes';
import { DEFAULT_CONFIG, createRankingCanvas } from './classicCanvas';
import { createModernRankingCanvas } from './modernCanvas';
import { CountryContestant } from '../../data/CountryContestant';
import { logger } from '../logger';

export const downloadRankingImage = async (
  rankedItems: CountryContestant[],
  rankingName: string = '',
  customConfig: Partial<RankingCanvasConfig> = {},
  customColors: Partial<RankingColors> = {},
  style: RankingImageStyle = 'modern',
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
    const canvas =
      style === 'modern'
        ? await createModernRankingCanvas(rankedItems, rankingName)
        : await createRankingCanvas(rankedItems, rankingName, effectiveConfig, customColors);

    const sanitizedName =
      rankingName && rankingName.trim() !== ''
        ? rankingName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
        : 'eurovision-ranking';

    const filename = `${sanitizedName || 'ranking'}.png`;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blobContent) => {
          resolve(blobContent);
        },
        'image/png',
        1.0,
      );
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
    logger.error('Error creating ranking image:', error);
    toast.dismiss(toastId);
    toast.error(
      `Failed to create image: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
