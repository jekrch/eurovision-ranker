import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

import { CountryContestant } from '../data/CountryContestant';
import { UseModalReturn } from '../hooks/useModal';
import { setShowUnranked } from '../redux/rootSlice';
import { AppDispatch } from '../redux/store';
import { toastOptions } from '../utilities/ToasterUtil';
import AuthModal, { AuthView } from './modals/auth/AuthModal';
import JoinGroupModal from './modals/groups/JoinGroupModal';
import SorterModal from './ranking/SorterModal';

// lazy load the modal components to reduce initial bundle size
const LazyMainModal = React.lazy(() => import('./modals/MainModal'));
const LazyNameModal = React.lazy(() => import('./modals/NameModal'));
const LazyMapModal = React.lazy(() => import('./modals/MapModal'));
const LazyConfigModal = React.lazy(() => import('./modals/config/ConfigModal'));
const LazySongModal = React.lazy(() => import('./modals/LyricsModal'));
const LazyQuizModal = React.lazy(() => import('./modals/quiz/QuizModal'));
const LazyJoyrideTour = React.lazy(() => import('../tour/JoyrideTour'));
const LazyJoyrideTourSort = React.lazy(() => import('../tour/JoyrideTourSort'));

interface AppModalsProps {
  modalState: UseModalReturn['modalState'];
  currentTab: string;
  openModal: UseModalReturn['openModal'];
  closeModal: UseModalReturn['closeModal'];
  dispatch: AppDispatch;
  configModalTab: string;
  configTabNonce: number;
  openConfigModalWithTab: (tabName: string, force?: boolean) => void;
  openLoginModal: () => void;
  setRefreshUrl: React.Dispatch<React.SetStateAction<number>>;
  selectedCountryContestant: CountryContestant | undefined;
  isSorterModalOpen: boolean;
  closeSorterModal: () => void;
  openSorterModal: (items?: CountryContestant[]) => void;
  getItemsToSort: () => CountryContestant[];
  authModalOpen: boolean;
  setAuthModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authModalView: AuthView | undefined;
  authModalAllowRegister: boolean;
  quizModalOpen: boolean;
  setQuizModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quizCode: string | null;
  setQuizCode: React.Dispatch<React.SetStateAction<string | null>>;
  joinGroupToken: string | null;
  setJoinGroupToken: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * All of App's overlay surfaces: the lazily-loaded modal stack (main/name/song/
 * config/map/tour/sort-tour/quiz), the sorter, auth, join-group modals, and the
 * toast host. Extracted from App so the root component stays focused on layout +
 * state wiring; behavior is unchanged (same conditional render tree).
 */
const AppModals: React.FC<AppModalsProps> = ({
  modalState,
  currentTab,
  openModal,
  closeModal,
  dispatch,
  configModalTab,
  configTabNonce,
  openConfigModalWithTab,
  openLoginModal,
  setRefreshUrl,
  selectedCountryContestant,
  isSorterModalOpen,
  closeSorterModal,
  openSorterModal,
  getItemsToSort,
  authModalOpen,
  setAuthModalOpen,
  authModalView,
  authModalAllowRegister,
  quizModalOpen,
  setQuizModalOpen,
  quizCode,
  setQuizCode,
  joinGroupToken,
  setJoinGroupToken,
}) => {
  return (
    <>
      {/* Render all modals conditionally */}
      <Suspense fallback={<div />}>
        {(modalState.main.isOpen || modalState.main.hasRendered) && (
          <LazyMainModal
            tab={currentTab}
            isOpen={modalState.main.isOpen}
            onClose={() => closeModal('main')}
            startTour={() => {
              dispatch(setShowUnranked(true));
              openModal('tour');
            }}
          />
        )}

        {(modalState.name.isOpen || modalState.name.hasRendered) && (
          <LazyNameModal isOpen={modalState.name.isOpen} onClose={() => closeModal('name')} />
        )}

        {(modalState.song.isOpen || modalState.song.hasRendered) && (
          <LazySongModal
            isOpen={modalState.song.isOpen}
            countryContestant={selectedCountryContestant}
            onClose={() => closeModal('song')}
          />
        )}
      </Suspense>

      <div className="tour-step-14 sort-tour-step-modal">
        {(modalState.config.isOpen || modalState.config.hasRendered) && (
          <Suspense fallback={<div />}>
            <LazyConfigModal
              tab={configModalTab}
              tabRequestNonce={configTabNonce}
              isOpen={modalState.config.isOpen}
              onClose={() => closeModal('config')}
              startTour={() => {
                dispatch(setShowUnranked(true));
                openModal('tour');
              }}
              openAuthModal={openLoginModal}
            />
          </Suspense>
        )}
      </div>

      {(modalState.map.isOpen || modalState.map.hasRendered) && (
        <Suspense fallback={<div />}>
          <LazyMapModal isOpen={modalState.map.isOpen} onClose={() => closeModal('map')} />
        </Suspense>
      )}

      {(modalState.tour.isOpen || modalState.tour.hasRendered) && (
        <Suspense fallback={<div />}>
          <LazyJoyrideTour
            setRefreshUrl={setRefreshUrl}
            openConfigModal={openConfigModalWithTab}
            setConfigModalShow={(show) => (show ? openModal('config') : closeModal('config'))}
            setRunTour={(run) => (run ? openModal('tour') : closeModal('tour'))}
            runTour={modalState.tour.isOpen}
          />
        </Suspense>
      )}

      {(modalState.sortTour.isOpen || modalState.sortTour.hasRendered) && (
        <Suspense fallback={<div />}>
          <LazyJoyrideTourSort
            openSortModal={openSorterModal}
            setRefreshUrl={setRefreshUrl}
            openConfigModal={openConfigModalWithTab}
            setConfigModalShow={(show) => (show ? openModal('config') : closeModal('config'))}
            setRunTour={(run) => (run ? openModal('sortTour') : closeModal('sortTour'))}
            runTour={modalState.sortTour.isOpen}
            closeSortModal={closeSorterModal}
          />
        </Suspense>
      )}

      {/* Include the sorter modal */}
      <SorterModal
        isOpen={isSorterModalOpen}
        onClose={closeSorterModal}
        initialItems={getItemsToSort()}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
        allowRegister={authModalAllowRegister}
        onAuthSuccess={() => {
          // Pre-seed the ConfigModal's sticky-tab storage so a first-mount
          // (modal never opened this session) still lands on Account.
          try {
            localStorage.setItem('configModalActiveTab', 'account');
          } catch {
            /* ignore */
          }
          openConfigModalWithTab('account');
        }}
      />

      {quizModalOpen && (
        <Suspense fallback={<div />}>
          <LazyQuizModal
            isOpen={quizModalOpen}
            initialCode={quizCode}
            onClose={() => {
              setQuizModalOpen(false);
              setQuizCode(null);
            }}
          />
        </Suspense>
      )}

      <JoinGroupModal
        isOpen={!!joinGroupToken}
        token={joinGroupToken}
        onClose={() => setJoinGroupToken(null)}
        onSignInRequired={openLoginModal}
        onJoined={() => {
          // Sticky-tab so the Groups tab is what they see when the
          // config modal opens.
          try {
            localStorage.setItem('configModalActiveTab', 'groups');
          } catch {
            /* ignore */
          }
          openConfigModalWithTab('groups');
        }}
      />

      <Toaster toastOptions={toastOptions} position="top-center" />
    </>
  );
};

export default AppModals;
