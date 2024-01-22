import React, { useState, useRef, useEffect, Dispatch } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faGlobe, faTv, faFileExport, faClipboard, faCopy, faLink, faFile, faFileCode, faList, faEdit, faPen } from '@fortawesome/free-solid-svg-icons';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import MenuItem from './MenuItem';
import SubmenuItem from './SubmenuItem';
import { copyDataToClipboard, copyToClipboard, copyUrlToClipboard, getExportDataString } from '../utilities/export/ExportUtil';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { EXPORT_TYPE } from '../utilities/export/ExportType';
import { rankedHasAnyYoutubeLinks } from '../utilities/YoutubeUtil';
import { setHeaderMenuOpen } from '../redux/actions';

interface RankedHeaderMenuProps {
  onMapClick?: () => void;
  openNameModal: () => void;
  openConfig: (tab: string) => void;
  generateYoutubePlaylistUrl?: () => string;
}

const RankedHeaderMenu: React.FC<RankedHeaderMenuProps> = (props: RankedHeaderMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const rankedItems = useSelector((state: AppState) => state.rankedItems);
  const globalMenuOpenTrigger = useSelector((state: AppState) => state.headerMenuOpen);
  const dispatch: Dispatch<any> = useDispatch();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
  
    // don't close menu during joyride tour
    const hasParentWithJoyrideId = (element: Element | null): boolean => {
      while (element) {
        if (element.id && element.id.startsWith('react-joyride')) {
          return true;
        }
        element = element.parentElement;
      }
      return false;
    };
  
    const isJoyrideElement = hasParentWithJoyrideId(target);
  
    if (
      !menuRef.current?.contains(target) && 
      !isJoyrideElement
    ) {
      setIsMenuOpen(false);
    }
  };
  

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {

    if (globalMenuOpenTrigger) {
      setIsMenuOpen(true);
      // reset the trigger to false 
      dispatch(
        setHeaderMenuOpen(false)
      )
    }
  }, [globalMenuOpenTrigger]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        className={classNames("tour-step-6 w-6 h-6 bg-slate-500 hover:bg-slate-400 rounded-full flex justify-center items-center cursor-pointer", { "!bg-slate-400": isMenuOpen })}
        onClick={toggleMenu}
      >
        <FontAwesomeIcon icon={faEllipsisH} />
      </button>
      <CSSTransition in={isMenuOpen} timeout={200} classNames="menu" unmountOnExit>
        <ul
          role="menu"
          className="absolute z-20 min-w-[180px] right-0 mt-1 bg-slate-600 shadow-lg shadow-blue-gray-500/10 rounded-sm border border-slate-400 overflow-auto flex flex-col"
        >
          <MenuItem
            icon={faGlobe}
            text="View Heat Map"
            className="tour-step-8"
            onClick={props.onMapClick}
          />

          {
            rankedHasAnyYoutubeLinks(rankedItems) &&
            <MenuItem
              icon={faTv}
              text="YouTube Playlist"
              className="tour-step-7"
              onClick={() => window.open(props.generateYoutubePlaylistUrl?.(), '_blank')}
            />
          }
          <MenuItem
            icon={faPen}
            text="Edit Name"
            onClick={() => props.openNameModal()}
          />
          <MenuItem icon={faList} text="Rankings" onClick={() => props.openConfig("rankings")} />
          <MenuItem icon={faEdit} text="Display settings" onClick={() => props.openConfig("display")} />
          <SubmenuItem
            text="Copy"
            buttonIcon={faCopy}
          >
            <MenuItem
              text="URL"
              icon={faLink}
              onClick={copyUrlToClipboard}
            />

            <MenuItem
              text="Text"
              icon={faFile}
              onClick={
                () => copyToClipboard(
                  rankedItems,
                  EXPORT_TYPE.TEXT
                )}
            />

            <MenuItem
              text="CSV"
              icon={faFileCode}
              onClick={
                () => copyToClipboard(
                  rankedItems,
                  EXPORT_TYPE.CSV
                )}
            />

            <MenuItem
              text="JSON"
              icon={faFileCode}
              onClick={
                () => copyToClipboard(
                  rankedItems,
                  EXPORT_TYPE.JSON
                )}
            />

          </SubmenuItem>

        </ul>
      </CSSTransition>
    </div>
  );
};

export default RankedHeaderMenu;
