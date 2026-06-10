import { faCog, faHouseUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { setShowUnranked } from '../../redux/rootSlice';
import { AppDispatch, AppState } from '../../redux/store';
import { HeartIcon } from '../HeartIcon';
import IconButton from '../IconButton';

type NavbarProps = {
  openModal: (tabName: string) => void;
  openConfigModal: (tabName: string) => void;
};

/**
 * This is the main navbar that is displayed at the top of the screen in all views.
 *
 * @param
 * @returns
 */
const Navbar: React.FC<NavbarProps> = ({ openModal, openConfigModal }) => {
  const dispatch: AppDispatch = useAppDispatch();
  const showUnranked = useAppSelector((state: AppState) => state.root.showUnranked);

  return (
    <nav className="nav-diagonal-split-bg py-1 px-4 sticky z-50">
      <div className="container mx-auto flex justify-between items-center z-50">
        <div className="flex items-center flex-wrap">
          <div className="items-center -my-1">
            <span className="inline gradient-text product-name">Eurovision Ranker</span>
            <HeartIcon
              alt="Heart"
              className="inline align-middle ml-[0.5em] mb-1 w-5 h-5 pulse-on-load"
            />
          </div>
        </div>

        <ul className="flex space-x-2">
          <li>
            <div className="flex items-center">
              <IconButton
                className={classNames(
                  'tour-step-11 py-1 pl-[0.7em] pr-[0.9em] rounded-full text-xs mr-0 w-[5em]',
                )}
                onClick={() => dispatch(setShowUnranked(!showUnranked))}
                title={showUnranked ? 'Details' : 'Select'}
              />
              <FontAwesomeIcon
                className="tour-step-12 houseUser mr-1 mb-1 ml-3 text-xl"
                icon={faHouseUser}
                onClick={() => openModal('about')}
              />

              <div className="tour-step-13">
                <FontAwesomeIcon
                  className="configCog ml-2 mr-1 mb-0 text-xl float-right"
                  icon={faCog}
                  onClick={() => openConfigModal('rankings')}
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
