import React, { createContext, useCallback, useContext, useState } from 'react';

import { CountryContestant } from '../../data/CountryContestant';
import { useModal, UseModalReturn } from '../../hooks/useModal';
import useSorterModal from '../../hooks/useSortModal';
import { VideoPipProvider } from '../video/VideoPipContext';
import { AuthView } from './auth/AuthModal';

/**
 * Every piece of modal open/close/tab state the app surfaces, in one place.
 * Previously this lived in App and was threaded as ~30 props through AppContent
 * and AppModals; consumers now read it via useModalController() instead.
 */
export interface ModalControllerValue {
  // generic lazy-modal stack (main/name/map/song/config/tour/sortTour)
  modalState: UseModalReturn['modalState'];
  openModal: UseModalReturn['openModal'];
  closeModal: UseModalReturn['closeModal'];
  setModalTab: UseModalReturn['setModalTab'];
  currentTab: string;
  openMainModalWithTab: (tabName: string) => void;

  // config modal (sticky tab + nonce that forces a tab jump on a repeat open)
  configModalTab: string;
  configTabNonce: number;
  openConfigModalWithTab: (tabName: string, force?: boolean) => void;

  // song modal
  selectedCountryContestant: CountryContestant | undefined;
  openSongModalWithData: (countryContestant: CountryContestant) => void;

  // auth modal
  authModalOpen: boolean;
  setAuthModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authModalView: AuthView | undefined;
  setAuthModalView: React.Dispatch<React.SetStateAction<AuthView | undefined>>;
  authModalAllowRegister: boolean;
  setAuthModalAllowRegister: React.Dispatch<React.SetStateAction<boolean>>;
  openLoginModal: () => void;

  // quiz modal (initialCode replays a ?quiz=<code> deep link)
  quizModalOpen: boolean;
  setQuizModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quizCode: string | null;
  setQuizCode: React.Dispatch<React.SetStateAction<string | null>>;

  // join-group modal (token from an invite deep link)
  joinGroupToken: string | null;
  setJoinGroupToken: React.Dispatch<React.SetStateAction<string | null>>;

  // sorter modal
  isSorterModalOpen: boolean;
  openSorterModal: (items?: CountryContestant[]) => void;
  closeSorterModal: () => void;
  getItemsToSort: () => CountryContestant[];
}

const ModalControllerContext = createContext<ModalControllerValue | undefined>(undefined);

/**
 * Owns all modal state and the pip<->song-modal wiring, exposing both to the tree
 * below via useModalController(). Wraps children in VideoPipProvider because the
 * floating (pip) player re-docks into the song modal on expand, so the two share
 * this state.
 */
export const ModalControllerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { modalState, openModal, closeModal, setModalTab, currentTab } = useModal('about');
  const [configModalTab, setConfigModalTab] = useState('display');
  // Incremented on forced opens so the ConfigModal jumps to the requested tab
  // even when the tab string is unchanged (overriding its sticky-tab memory).
  const [configTabNonce, setConfigTabNonce] = useState(0);

  const [selectedCountryContestant, setSelectedCountryContestant] = useState<
    CountryContestant | undefined
  >(undefined);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView | undefined>(undefined);
  const [authModalAllowRegister, setAuthModalAllowRegister] = useState(false);

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  // a ?quiz=<code> deep link replays the exact same quiz; null = normal setup
  const [quizCode, setQuizCode] = useState<string | null>(null);

  const [joinGroupToken, setJoinGroupToken] = useState<string | null>(null);

  const { isSorterModalOpen, openSorterModal, closeSorterModal, getItemsToSort } = useSorterModal();

  function openMainModalWithTab(tabName: string): void {
    setModalTab(tabName);
    openModal('main');
  }

  function openConfigModalWithTab(tabName: string, force = false): void {
    setConfigModalTab(tabName);
    if (force) {
      setConfigTabNonce((n) => n + 1);
    }
    openModal('config');
  }

  function openSongModalWithData(countryContestant: CountryContestant): void {
    setSelectedCountryContestant(countryContestant);
    openModal('song');
  }

  const openLoginModal = useCallback(() => {
    setAuthModalView({ tab: 'login' });
    setAuthModalAllowRegister(false);
    setAuthModalOpen(true);
  }, []);

  const value: ModalControllerValue = {
    modalState,
    openModal,
    closeModal,
    setModalTab,
    currentTab,
    openMainModalWithTab,
    configModalTab,
    configTabNonce,
    openConfigModalWithTab,
    selectedCountryContestant,
    openSongModalWithData,
    authModalOpen,
    setAuthModalOpen,
    authModalView,
    setAuthModalView,
    authModalAllowRegister,
    setAuthModalAllowRegister,
    openLoginModal,
    quizModalOpen,
    setQuizModalOpen,
    quizCode,
    setQuizCode,
    joinGroupToken,
    setJoinGroupToken,
    isSorterModalOpen,
    openSorterModal,
    closeSorterModal,
    getItemsToSort,
  };

  return (
    <ModalControllerContext.Provider value={value}>
      {/* re-open the song modal when a floating (pip) video is expanded; the
          modal's video tab then re-docks the still-playing player */}
      <VideoPipProvider onExpand={openSongModalWithData} onMinimize={() => closeModal('song')}>
        {children}
      </VideoPipProvider>
    </ModalControllerContext.Provider>
  );
};

export function useModalController(): ModalControllerValue {
  const ctx = useContext(ModalControllerContext);
  if (!ctx) {
    throw new Error('useModalController must be used within a ModalControllerProvider');
  }
  return ctx;
}
