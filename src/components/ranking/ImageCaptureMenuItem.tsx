import React, { useState } from 'react';
import { FaDownload, FaSpinner } from 'react-icons/fa';
import classNames from 'classnames';
import { downloadRankingImage, RankingCanvasConfig } from '../../utilities/CanvasGeneratorUtil';
import { useAppSelector } from '../../hooks/stateHooks';
import { AppState } from '../../redux/store';
import { toast } from 'react-hot-toast';
import MenuItem from '../MenuItem';
import { faCamera } from '@fortawesome/free-solid-svg-icons';

interface CanvasDownloadButtonProps {
  className?: string;
  title?: string;
  iconClassName?: string;
  showText?: boolean;
  afterClick?: () => void;
}

/**
 * button that generates a ranking image directly on canvas
 * 
 * @param props component props
 * @returns download button component
 */
const ImageCaptureMenuItem: React.FC<CanvasDownloadButtonProps> = ({
  className = '',
  showText = true, 
  afterClick = () => {}
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const rankingName = useAppSelector((state: AppState) => state.name);
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const showPlace = useAppSelector((state: AppState) => state.showPlace);
  const vote = useAppSelector((state: AppState) => state.vote);

  let customConfig: Partial<RankingCanvasConfig>  = {};


  const handleDownload = async () => {
    // Check if there are ranked items
    if (rankedItems.length === 0) {
      toast.error('Please rank some countries first');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      await downloadRankingImage(rankedItems, rankingName, customConfig);
    } catch (error) {
      console.error('Error during download:', error);
      toast.error('Failed to create image');
    } finally {
      // Reset download state after a short delay
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    }
  };
  
  return (
    <MenuItem 
      icon={faCamera} 
      text="Download image" 
      onClick={handleDownload}
      afterClick={afterClick} 
    />
  );
};

export default ImageCaptureMenuItem;