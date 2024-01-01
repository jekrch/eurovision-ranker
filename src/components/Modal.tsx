import classNames from 'classnames';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

type ModalContainerProps = {
    isOpen: boolean;
    className: string;
    onClose: () => void;
    children: ReactNode;
};

const Modal: React.FC<ModalContainerProps> = (props: ModalContainerProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [showModal, setShowModal] = useState(false);
    const [transitionStyles, setTransitionStyles] = useState({
        opacity: 'opacity-0',
        transform: 'translate-y-20'
    });

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // delays to enable open and close transition animations
        if (props.isOpen) {
            setShowModal(true);
            timeoutId = setTimeout(() => {
                setTransitionStyles({
                    opacity: 'opacity-100',
                    transform: 'translate-y-0'
                });
            }, 10);
        } else {
            setTransitionStyles({
                opacity: 'opacity-0',
                transform: 'translate-y-20'
            });
            timeoutId = setTimeout(() => setShowModal(false), 300);
        }

        return () => clearTimeout(timeoutId);
    }, [props.isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if ((event.target as Element).closest('.dropdown-menu')) {
                return;
            }
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                props.onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [modalRef, props]);

    if (!showModal) return null;

    return (
        <div className={
            classNames(
                "fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 transition-opacity duration-300",
                transitionStyles.opacity
            )}
        >
            <div ref={modalRef}
                className={
                    classNames(
                        "relative bg-[#272557] m-4 max-h-[80vh] text-slate-400 p-6 rounded-lg shadow-lg max-w-lg w-full flex flex-col transform transition-transform duration-300",
                        transitionStyles.transform,
                        props.className
                    )}
            >
                <button onClick={props.onClose}
                    className="absolute top-0 right-0 mt-4 mr-4 text-gray-300 text-lg leading-none hover:text-gray-400">
                    &#x2715;
                </button>
                {props.children}
            </div>
        </div>
    );
};

export default Modal;
