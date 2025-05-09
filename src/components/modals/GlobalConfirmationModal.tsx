import React from 'react';
import Modal from '../modals/Modal';
import IconButton from '../IconButton';
import classNames from 'classnames';

interface GlobalConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
    className?: string;
}

/**
 * a reusable confirmation modal component used to prompt the user for 
 * confirmation before performing actions
 */
const GlobalConfirmationModal: React.FC<GlobalConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    message, 
    className
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            className={classNames("max-w-[28em]", className)} 
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
                    className="ml-2"
                    onClick={onClose}
                    title='Cancel'
                    isGrayTheme={true}
                />
            </div>
        </Modal>
    );
};

export default GlobalConfirmationModal;