import React, { useState, useRef, useEffect, Dispatch } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faGlobe, faTv, faCopy, faLink, faFile, faFileCode, faList, faEdit, faPen, faSlidersH, faSort } from '@fortawesome/free-solid-svg-icons';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import MenuItem from '../MenuItem';
import SubmenuItem from '../SubmenuItem';
import { copyToClipboard, copyUrlToClipboard } from '../../utilities/export/ExportUtil';
import { AppDispatch, AppState } from '../../redux/store';
import { EXPORT_TYPE } from '../../utilities/export/ExportType';
import { rankedHasAnyYoutubeLinks } from '../../utilities/YoutubeUtil';
import { setHeaderMenuOpen } from '../../redux/rootSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import ImageCaptureMenuItem from './ImageCaptureMenuItem';
import useSorterModal from '../../hooks/useSortModal';

interface RankedHeaderMenuProps {
  onMapClick?: () => void;
  openNameModal: () => void;
  openConfig: (tab: string) => void;
  openSorterModal: () => void;
  generateYoutubePlaylistUrl?: () => string;
}

const RankedHeaderMenu: React.FC<RankedHeaderMenuProps> = (props: RankedHeaderMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const globalMenuOpenTrigger = useAppSelector((state: AppState) => state.headerMenuOpen);
  const dispatch: AppDispatch = useAppDispatch();
  const CLOSING_DURATION = 300;
  const menuNodeRef = useRef(null);
  const toggleMenu = () => {
    const shouldClose = isMenuOpen;
    setIsMenuOpen(!isMenuOpen);


    if (shouldClose) {
      setTimeout(() => {
        document.body.classList.remove('no-scroll');
      }, CLOSING_DURATION);
    } else {
      document.body.classList.add('no-scroll');
    }
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
    let timeoutId: any;

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timeoutId);
      document.body.classList.remove('no-scroll');
    };
  }, []);

  useEffect(() => {
    if (globalMenuOpenTrigger) {
      setIsMenuOpen(true);
      document.body.classList.add('no-scroll');
      dispatch(setHeaderMenuOpen(false));
    } else {
      setTimeout(() => {
        document.body.classList.remove('no-scroll');
      }, CLOSING_DURATION);
    }
  }, [globalMenuOpenTrigger]);

  function close() {
    setIsMenuOpen(false);
  }

  return (
    <div className="relative inline-block" ref={menuRef}>

      <button
        className={classNames("tour-step-6 w-6 h-6 bg-[#6e6795] hover:bg-slate-400 rounded-full flex justify-center items-center cursor-pointer", { "!bg-slate-400": isMenuOpen })}
        onClick={toggleMenu}
      >
        <FontAwesomeIcon
          className="text-slate-300"
          icon={faEllipsisH}
        />
      </button>
      <CSSTransition
        in={isMenuOpen}
        timeout={200}
        classNames="menu"
        nodeRef={menuNodeRef}
        unmountOnExit
      >
        <ul
          role="menu"
          className="absolute z-20 min-w-[180px] right-0 mt-1 shadow-lg shadow-blue-gray-500/10 rounded-sm border border-slate-500 overflow-auto flex flex-col"
        >
          <MenuItem
            icon={faGlobe}
            text="View Heat Map"
            className="tour-step-8"
            onClick={props.onMapClick}
            afterClick={close}
          />

          {
            rankedHasAnyYoutubeLinks(rankedItems) &&
            <MenuItem
              icon={faTv}
              text="YouTube Playlist"
              className="tour-step-7"
              onClick={() => window.open(props.generateYoutubePlaylistUrl?.(), '_blank')}
              afterClick={close}
            />
          }

          <MenuItem
            icon={faPen}
            text="Edit Name"
            onClick={() => props.openNameModal()}
            afterClick={close}
          />

          <MenuItem
            icon={faSlidersH}
            text="Categories"
            className="tour-step-9"
            onClick={() => props.openConfig("categories")}
            afterClick={close}
          />

          <MenuItem
            icon={faList}
            text="Rankings"
            onClick={() => props.openConfig("rankings")}
            afterClick={close}
          />

          <MenuItem
            icon={faEdit}
            text="Display settings"
            onClick={() => props.openConfig("display")}
            afterClick={close}
          />

          <MenuItem
            icon={faSort}
            text="Use Sorter"
            onClick={props.openSorterModal}
            afterClick={close}
          />

          {rankedItems.length > 0 && (
            <ImageCaptureMenuItem
              className="text-blue-300 hover:text-white mr-2"
              iconClassName="text-lg"
              afterClick={close}
            />
          )}

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
