import React from 'react';
import MenuItem from '../MenuItem';
import { faCamera } from '@fortawesome/free-solid-svg-icons';

interface ImageCaptureMenuItemProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  onClick: () => void;
  afterClick?: () => void;
}

/**
 * Menu item that opens the image style chooser so the user can pick a style
 * before downloading a picture of their ranking.
 *
 * @param props component props
 * @returns menu item component
 */
const ImageCaptureMenuItem: React.FC<ImageCaptureMenuItemProps> = ({
  onClick,
  afterClick = () => {},
}) => {
  return (
    <MenuItem
      icon={faCamera}
      text="Download image"
      onClick={onClick}
      afterClick={afterClick}
    />
  );
};

export default ImageCaptureMenuItem;
