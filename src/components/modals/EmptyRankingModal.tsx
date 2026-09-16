import { faGlasses, faList } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import React from 'react';

import Modal from './Modal';
import ModalHeader from './ModalHeader';
import { modalActionBtnSm, modalFooter } from './modalStyles';
import IconButton from '../IconButton';

interface EmptyRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dismisses this modal and starts the app tour. */
  onStartTour: () => void;
}

/**
 * Shown when the details view is requested with nothing ranked yet, since that
 * view would otherwise open on an empty column with no hint as to why. Offers
 * the tour for anyone who landed here because they weren't sure how to rank.
 */
const EmptyRankingModal: React.FC<EmptyRankingModalProps> = ({ isOpen, onClose, onStartTour }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    className="max-w-[24em] !p-0 overflow-hidden"
    closeBtnClassName="hidden"
  >
    <ModalHeader
      title="Nothing ranked yet"
      subtitle="Pick a few countries and come back"
      icon={faList}
      iconVariant="chip"
      size="sm"
    />

    <div className="px-5 pt-4 pb-5">
      <p className="text-[0.82rem] leading-snug text-[var(--er-text-secondary)]">
        The details view shows songs, videos, and voting records for the countries you've ranked.
        Drag some into the ranked column, or use 'Add All' to take the whole year at once.
      </p>

      <div className={classNames(modalFooter, 'mt-5')}>
        <IconButton
          className={modalActionBtnSm}
          title="Okay"
          onClick={onClose}
          isGrayTheme={true}
        />
        <IconButton
          icon={faGlasses}
          className={modalActionBtnSm}
          iconClassName="mr-[3px]"
          title="Take Tour"
          onClick={onStartTour}
        />
      </div>
    </div>
  </Modal>
);

export default EmptyRankingModal;
