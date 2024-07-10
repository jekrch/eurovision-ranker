import React, { Dispatch, useEffect, useRef, useState } from 'react';
import { AppDispatch, AppState } from '../../redux/store';
import { setName } from '../../redux/rootSlice';
import Modal from './Modal';
import { useAppDispatch, useAppSelector } from '../../utilities/hooks';

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
        <Modal isOpen={props.isOpen} onClose={(props.onClose)} className='' closeBtnClassName='hidden'>
          
                <div className="mb-3">
                    <input 
                        id="name" 
                        ref={inputRef} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                        placeholder="Ranking name"
                        value={inputValue}
                        onKeyDown={handleKeyDown} 
                        autoComplete="off" 
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </div>
                <div className="float-right mt-1 -mb-1">
                    <button
                        type="submit"
                        className="w-[1/2] text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-1.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        className="ml-2 text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-sm px-4 py-1.5 text-center dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-blue-800"
                        onClick={() => setInputValue('')}
                    >
                        Clear
                    </button>
                    <button
                        className="ml-2 text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-sm px-4 py-1.5 text-center dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-blue-800"
                        onClick={props.onClose}
                    >
                        Cancel
                    </button>
                </div>
        </Modal>
    );
};

export default NameModal;

