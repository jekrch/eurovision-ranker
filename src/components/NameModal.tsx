import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { setName } from '../redux/actions';

type NameModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const NameModal: React.FC<NameModalProps> = (props: NameModalProps) => {
    const dispatch: Dispatch<any> = useDispatch();
    const  { name } = useSelector((state: AppState) => state);

    const [inputValue, setInputValue] = useState(name); 
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (props.isOpen && inputRef.current) {
            inputRef.current.focus(); // Set focus on the input element when the modal is open
        }
    }, [props.isOpen]); 

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                props.onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [modalRef, props]);

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

    if (!props.isOpen) return null;

    return (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div
                ref={modalRef}
                className="relative bg-[#272557] opacity-95 m-4 h-auto text-slate-400 z-200 p-6 rounded-lg shadow-lg max-w-lg w-full">

                <div className="mb-4">
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
                <div className="float-right">
                    <button
                        type="submit"
                        className="w-[1/2] text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        className="ml-2 text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-blue-800"
                        onClick={() => setInputValue('')}
                    >
                        Clear
                    </button>
                    <button
                        className="ml-2 text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-blue-800"
                        onClick={props.onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NameModal;

