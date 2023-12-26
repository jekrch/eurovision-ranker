import classNames from 'classnames';
import React, { ReactNode } from 'react';

type ModalContainerProps = {
    isOpen: boolean;
    className: string;
    onClose: () => void;
    children: ReactNode;
};

const Modal: React.FC<ModalContainerProps> = ({ isOpen, className, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
         <div className={
            classNames("relative bg-[#272557] opacity-95 m-4 h-auto max-h-[90vh] text-slate-400 z-200 p-6 rounded-lg shadow-lg max-w-lg w-full flex flex-col", className)}>
                <button onClick={onClose} className="absolute top-0 right-0 mt-4 mr-4 text-gray-300 text-lg leading-none hover:text-gray-400">
                    &#x2715;
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;