import { useState, useEffect } from 'react';

export type ModalType = 'main' | 'name' | 'map' | 'song' | 'config' | 'tour';

interface ModalState {
  isOpen: boolean;
  hasRendered: boolean;
  data?: any;
}

export interface UseModalReturn {
  modalState: Record<ModalType, ModalState>;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: (type: ModalType) => void;
  setModalTab: (tab: string) => void;
  currentTab: string;
}

export const useModal = (initialTab: string = 'about'): UseModalReturn => {
  const [modalState, setModalState] = useState<Record<ModalType, ModalState>>({
    main: { isOpen: false, hasRendered: false },
    name: { isOpen: false, hasRendered: false },
    map: { isOpen: false, hasRendered: false },
    song: { isOpen: false, hasRendered: false },
    config: { isOpen: false, hasRendered: false },
    tour: { isOpen: false, hasRendered: false },
  });
  
  const [currentTab, setModalTab] = useState(initialTab);

  // Effect to update hasRendered when a modal opens
  useEffect(() => {
    const updatedState = { ...modalState };
    let hasChanges = false;

    Object.keys(modalState).forEach((key) => {
      const modalType = key as ModalType;
      if (modalState[modalType].isOpen && !modalState[modalType].hasRendered) {
        updatedState[modalType].hasRendered = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setModalState(updatedState);
    }
  }, [modalState]);

  const openModal = (type: ModalType, data?: any) => {
    setModalState((prev) => ({
      ...prev,
      [type]: { ...prev[type], isOpen: true, data },
    }));
  };

  const closeModal = (type: ModalType) => {
    setModalState((prev) => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false },
    }));
  };

  return { modalState, openModal, closeModal, setModalTab, currentTab };
};