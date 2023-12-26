import classNames from 'classnames';
import React, { ReactNode, useEffect, useRef } from 'react';

type ModalContainerProps = {
    isOpen: boolean;
    className: string;
    onClose: () => void;
    children: ReactNode;
};

const Modal: React.FC<ModalContainerProps> = (props: ModalContainerProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    
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

    if (!props.isOpen) return null;

    return (
        <div 
            className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
         <div
            ref={modalRef} className={
            classNames("relative bg-[#272557] opacity-95 m-4 h-auto max-h-[80vh] text-slate-400 z-200 p-6 rounded-lg shadow-lg max-w-lg w-full flex flex-col", props.className)}>
                <button onClick={props.onClose} className="absolute top-0 right-0 mt-4 mr-4 text-gray-300 text-lg leading-none hover:text-gray-400">
                    &#x2715;
                </button>
                {props.children}
            </div>
        </div>
    );
};

export default Modal;