import React, { useEffect, useRef, useState } from 'react';
import { AppDispatch, AppState } from '../../redux/store';
import { setName } from '../../redux/rootSlice';
import Modal from './Modal';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
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
    const name = useAppSelector((state: AppState) => state.name);
    const [inputValue, setInputValue] = useState(name); 
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setInputValue(name)
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
        <Modal isOpen={props.isOpen} onClose={(props.onClose)} closeBtnClassName='hidden'>
          
                <div className="mb-3">
                    <input 
                        id="name" 
                        ref={inputRef} 
                        className="border text-sm rounded-md block w-full p-2.5 bg-[var(--er-border-subtle)] border-[var(--er-border-medium)] placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent" 
                        placeholder="Ranking name"
                        value={inputValue}
                        onKeyDown={handleKeyDown} 
                        autoComplete="off" 
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </div>
                <div className="float-right mt-1 -mb-1">
                    <IconButton
                        className="w-[1/2] !font-medium !text-[0.9em] !px-4 py-2"
                        onClick={handleSave}
                        title="Save"
                    />
                    <IconButton
                        className="ml-3 w-[1/2] !font-medium !text-[0.9em] !px-4 py-2"
                        onClick={() => setInputValue('')}
                        isGrayTheme={true}
                        title="Clear"
                    />
                    <IconButton
                        className="ml-3 w-[1/2] !font-medium !text-[0.9em] !px-4 py-2"
                        onClick={props.onClose}
                        isGrayTheme={true}
                        title="Cancel"
                    />
                </div>
        </Modal>
    );
};

export default NameModal;

