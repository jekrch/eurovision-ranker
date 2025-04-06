import classNames from 'classnames';
import React, { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import GlobalConfirmationModal from './GlobalConfirmationModal'; 

type ModalContainerProps = {
    isOpen: boolean;
    className?: string;
    closeBtnClassName?: string;
    onClose: () => void;
    children: ReactNode;
    closeWarning?: string;
    shouldCloseWarn?: boolean;
};

/**
 * A shared modal component that provides a general style and standard
 * open/close functionality, using a custom confirmation modal for close warnings.
 *
 * @param props
 * @returns
 */
const Modal: React.FC<ModalContainerProps> = ({
    isOpen,
    className,
    closeBtnClassName,
    onClose,
    children,
    closeWarning,
    shouldCloseWarn = false,
}: ModalContainerProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [showModal, setShowModal] = useState(false);
    const [transitionStyles, setTransitionStyles] = useState({
        opacity: 'opacity-0',
        transform: 'translate-y-20'
    });
    // --- State for the confirmation modal ---
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    // --- Handle Close Attempt Logic ---
    const handleAttemptClose = useCallback(() => {
        // Check if warning is enabled and a message exists
        if (shouldCloseWarn && closeWarning) {
            // Open the confirmation modal instead of window.confirm
            setIsConfirmationOpen(true);
        } else {
            // No warning needed, close directly
            onClose();
        }
    }, [onClose, shouldCloseWarn, closeWarning]); // Dependencies

    // handler for confirming close from confirmation modal ---
    const handleConfirmClose = useCallback(() => {
        setIsConfirmationOpen(false); // close confirmation modal
        onClose(); // proceed with closing the main modal
    }, [onClose]);

    // handle for cancelling close from confirmation modal ---
    const handleCancelClose = useCallback(() => {
        setIsConfirmationOpen(false); // just close the confirmation modal
    }, []);


    // effects
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (isOpen) {
            setShowModal(false)
            setTransitionStyles({
                opacity: 'opacity-0',
                transform: 'translate-y-20'
            });
            setShowModal(true);
            timeoutId = setTimeout(() => {
                setTransitionStyles({
                    opacity: 'opacity-100',
                    transform: 'translate-y-0'
                });
            }, 50);
        } else {
            // if the modal is closing, ensure the confirmation modal is also closed
            setIsConfirmationOpen(false);
            setTransitionStyles({
                opacity: 'opacity-0',
                transform: 'translate-y-20'
            });
            timeoutId = setTimeout(() => setShowModal(false), 300);
        }

        return () => clearTimeout(timeoutId);
    }, [isOpen]); // only depend on isOpen for open/close animation trigger

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // don't close if the confirmation modal is open
            if (isConfirmationOpen) {
                return;
            }
            // Ignore clicks within dropdowns
            if ((event.target as Element).closest('.dropdown-menu')) {
                return;
            }
            // check if click is outside the main modal content area
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                handleAttemptClose();
            }
        };

        // Add listener only when the main modal is intended to be open
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
        // Depend on isOpen, handleAttemptClose, and isConfirmationOpen
    }, [isOpen, handleAttemptClose, isConfirmationOpen]);


    // render null if the parent indicates closed AND the fade-out is complete
    if (!showModal && !isOpen) return null;

    return (
        <> 
            <div
                className={classNames(
                    "fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 transition-opacity duration-300",
                    isOpen && showModal ? transitionStyles.opacity : 'opacity-0', // Control overlay visibility smoothly
                    !isOpen && !showModal ? 'pointer-events-none' : '' // Prevent interaction when fully closed
                )}
                // prevent clicks on the overlay from triggering when confirmation is open
                onClick={isConfirmationOpen ? (e) => e.stopPropagation() : undefined}
            >
                <div
                    ref={modalRef}
                    className={classNames(
                        "relative bg-[#22283e] m-4 max-h-[80vh] text-slate-400 p-6 rounded-lg shadow-lg max-w-lg w-full flex flex-col transform transition-all duration-300 ease-out",
                        isOpen && showModal ? `${transitionStyles.opacity} ${transitionStyles.transform}` : 'opacity-0 translate-y-20', // Control modal visibility/position smoothly
                        className
                    )}
                >
                    <button
                        type="button"
                        className={classNames(
                            "absolute -top-1 right-0 mt-4 mr-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white",
                            closeBtnClassName
                        )}
                        data-modal-hide="default-modal"
                        onClick={handleAttemptClose}
                        // disable button while confirmation is showing
                        disabled={isConfirmationOpen}
                    >
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    {children}
                </div>
            </div>

            {/* used for confirming whether the user wants to close*/}
            <GlobalConfirmationModal
                className="max-w-[22em]"
                isOpen={isConfirmationOpen}
                onClose={handleCancelClose} 
                onConfirm={handleConfirmClose} 
                message={closeWarning || ''} 
            />
        </>
    );
};

export default Modal;