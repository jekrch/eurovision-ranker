import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import Modal from './Modal';
import { modalActionBtn, modalFooter } from './modalStyles';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { setName } from '../../redux/rootSlice';
import { AppDispatch, AppState } from '../../redux/store';
import IconButton from '../IconButton';

type NameModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * This is where users can provide a custom name for their ranked list which is
 * displayed in the ranked items header. This is opened from the either the
 * headers menu or the edit nav
 *
 * @param props
 * @returns
 */
const NameModal: React.FC<NameModalProps> = (props: NameModalProps) => {
  const dispatch: AppDispatch = useAppDispatch();
  const name = useAppSelector((state: AppState) => state.root.name);
  const [inputValue, setInputValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(name);
  }, [name]);

  const handleSave = () => {
    dispatch(setName(inputValue));
    props.onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} closeBtnClassName="hidden">
      <div className="mb-3">
        <input
          id="name"
          ref={inputRef}
          className="border text-sm rounded-lg block w-full p-2.5 bg-[color:var(--er-surface-primary)] border-white/5 placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/40 focus:border-[var(--er-button-primary)]/40 transition-colors"
          placeholder="Ranking name"
          value={inputValue}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <div className={classNames(modalFooter, 'mt-1 -mb-1')}>
        <IconButton className={modalActionBtn} onClick={handleSave} title="Save" />
        <IconButton
          className={modalActionBtn}
          onClick={() => setInputValue('')}
          isGrayTheme={true}
          title="Clear"
        />
        <IconButton
          className={modalActionBtn}
          onClick={props.onClose}
          isGrayTheme={true}
          title="Cancel"
        />
      </div>
    </Modal>
  );
};

export default NameModal;
