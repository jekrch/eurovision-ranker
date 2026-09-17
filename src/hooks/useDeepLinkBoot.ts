import { useEffect } from 'react';

import { useModalController } from '../components/modals/ModalControllerContext';

interface DeepLinkBootArgs {
  // Loads a `?id=<ranking_id>` shared ranking into the store. Owned by App
  // (it needs the active category and the URL-writer arming ref), passed in
  // so this hook stays focused on parsing the boot URL.
  loadPublicRankingById: (id: string) => void;
}

/**
 * On-mount boot handling for email-link deep paths and query deep links:
 * /complete-registration, /reset-password, ?signup=beta, /join-group?token=,
 * ?join=, ?quiz=<code>, and ?id=<ranking_id>. Each recognized link opens the
 * matching modal (via the modal controller) and strips its params back to the
 * SPA root so a reload or share copies a clean URL. Runs once; the URL is only
 * read at startup.
 */
export function useDeepLinkBoot({ loadPublicRankingById }: DeepLinkBootArgs): void {
  const {
    setAuthModalView,
    setAuthModalAllowRegister,
    setAuthModalOpen,
    setJoinGroupToken,
    setQuizCode,
    setQuizModalOpen,
  } = useModalController();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    const stripParamsAndPath = (paramKeys: string[]) => {
      const sp = new URLSearchParams(window.location.search);
      paramKeys.forEach((k) => sp.delete(k));
      // Reset path to the SPA root for gh-pages-friendly deep links.
      const newPath = window.location.origin + '/';
      const newSearch = sp.toString();
      window.history.replaceState(null, '', newPath + (newSearch ? `?${newSearch}` : ''));
    };

    if (path.endsWith('/complete-registration')) {
      const token = params.get('token') || '';
      setAuthModalView({ tab: 'register', step: 2, token });
      setAuthModalAllowRegister(true);
      setAuthModalOpen(true);
      stripParamsAndPath(['token']);
    } else if (path.endsWith('/reset-password')) {
      const token = params.get('token') || '';
      setAuthModalView({ tab: 'reset', step: 2, token });
      setAuthModalAllowRegister(false);
      setAuthModalOpen(true);
      stripParamsAndPath(['token']);
    } else if (params.get('signup') === 'beta') {
      setAuthModalView({ tab: 'register', step: 1 });
      setAuthModalAllowRegister(true);
      setAuthModalOpen(true);
      stripParamsAndPath(['signup']);
    } else if (path.endsWith('/join-group') && params.get('token')) {
      // Canonical invite link: /join-group?token=…
      setJoinGroupToken(params.get('token'));
      stripParamsAndPath(['token']);
    } else if (params.get('join')) {
      // Query-only fallback for static hosts that can't route /join-group.
      setJoinGroupToken(params.get('join'));
      stripParamsAndPath(['join']);
    }

    // ?quiz=<code> — open the quiz modal and replay the exact same quiz.
    const quizParam = params.get('quiz');
    if (quizParam) {
      setQuizCode(quizParam);
      setQuizModalOpen(true);
      stripParamsAndPath(['quiz']);
    }

    // ?id=<ranking_id> — fetch a public ranking and load it. Set the flag
    // synchronously so the other on-mount effects don't write n/y/load
    // anything stale before the fetch resolves.
    const idParam = params.get('id');
    if (idParam) {
      loadPublicRankingById(idParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
