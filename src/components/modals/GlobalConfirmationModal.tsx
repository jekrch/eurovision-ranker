import React from 'react';
import Modal from '../modals/Modal';
import IconButton from '../IconButton';

interface GlobalConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}

/**
 * a reusable confirmation modal component used to prompt the user for 
 * confirmation before performing actions
 */
const GlobalConfirmationModal: React.FC<GlobalConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    message
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            className="max-w-[28em]" 
            closeBtnClassName="hidden"
        >
            <div className="mb-4 text-sm text-gray-900 dark:text-slate-300 whitespace-pre-line leading-[1.2em]">
                {message}
            </div>
            <div className="float-right mt-1 -mb-1">
                <IconButton
                    className=""
                    onClick={handleConfirm}
                    title='Confirm'
                />
                <IconButton
                    className="ml-2 text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-blue-800"
                    onClick={onClose}
                    title='Cancel'
                />
            </div>
        </Modal>
    );
};

export default GlobalConfirmationModal;