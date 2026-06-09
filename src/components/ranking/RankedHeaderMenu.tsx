import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faGlobe, faTv, faCopy, faLink, faFile, faFileCode, faList, faEdit, faPen, faSlidersH, faSort, faPlay, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
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
import ImageStyleModal from './ImageStyleModal';
import { useVideoPip } from '../video/VideoPipContext';

interface RankedHeaderMenuProps {
  onMapClick?: () => void;
  openNameModal: () => void;
  openConfig: (tab: string) => void;
  openSorterModal: () => void;
  openQuizModal: () => void;
  generateYoutubePlaylistUrl?: () => string;
}

const RankedHeaderMenu: React.FC<RankedHeaderMenuProps> = (props: RankedHeaderMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImageStyleModalOpen, setIsImageStyleModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const globalMenuOpenTrigger = useAppSelector((state: AppState) => state.headerMenuOpen);
  const dispatch: AppDispatch = useAppDispatch();
  const { playList, hasPlayableVideos } = useVideoPip();
  const CLOSING_DURATION = 300;
  const menuNodeRef = useRef(null);
  const showTotalRank = useAppSelector((state: AppState) => state.showTotalRank);
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

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
        className={classNames("tour-step-6 w-6 h-6 bg-[var(--er-surface-muted-accent)] hover:bg-[var(--er-surface-light)] rounded-full flex justify-center items-center cursor-pointer transition-all duration-150 active:scale-90", { "!bg-[var(--er-surface-light)]": isMenuOpen })}
        onClick={toggleMenu}
      >
        <FontAwesomeIcon
          className="text-[var(--er-text-secondary)]"
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
          className="absolute z-20 min-w-[190px] right-0 mt-2 rounded-xl border border-[var(--er-border-subtle)] bg-[var(--er-surface-secondary)] shadow-2xl shadow-black/50 overflow-hidden flex flex-col py-1"
        >

          {
            hasPlayableVideos &&
            <MenuItem
              icon={faPlay}
              text="Play Ranking"
              onClick={playList}
              afterClick={close}
            />
          }

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
            icon={faCircleQuestion}
            text="Quiz"
            onClick={props.openQuizModal}
            afterClick={close}
          />

          <MenuItem
            icon={faGlobe}
            text="View Heat Map"
            className="tour-step-8"
            onClick={props.onMapClick}
            afterClick={close}
          />

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
            disabled={rankedItems.length < 2 || showTotalRank}
            afterClick={close}
          />

          {rankedItems.length > 0 && (
            <ImageCaptureMenuItem
              className="text-[var(--r-accent-blue)] hover:text-white mr-2"
              iconClassName="text-lg"
              onClick={() => setIsImageStyleModalOpen(true)}
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

      <ImageStyleModal
        isOpen={isImageStyleModalOpen}
        onClose={() => setIsImageStyleModalOpen(false)}
      />
    </div>
  );
};

export default RankedHeaderMenu;
