import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { AuthTab, AuthView } from './authTypes';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import { userFromToken } from '../../../redux/authSlice';
import { loginSuccess, setAuthError, setAuthStatus } from '../../../redux/rootSlice';
import { AppState } from '../../../redux/store';
import {
  login as apiLogin,
  passwordResetInitiate,
  passwordResetComplete,
  registerInitiate,
  registerComplete,
} from '../../../utilities/api/auth';
import { ApiError } from '../../../utilities/api/types';

type UseAuthFormsArgs = {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  onAuthSuccess?: () => void;
};

/**
 * Owns the AuthModal's shared form state (email/password/token), the active
 * view, and every submit handler (login, reset initiate/complete, register
 * initiate/complete) plus error normalization. The view components are purely
 * presentational against this view-model.
 */
export function useAuthForms({ isOpen, onClose, initialView, onAuthSuccess }: UseAuthFormsArgs) {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((s: AppState) => s.auth.authStatus);
  const authError = useAppSelector((s: AppState) => s.auth.authError);

  const [view, setView] = useState<AuthView>(initialView ?? { tab: 'login' });

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteBlocked, setInviteBlocked] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isOpen && initialView) {
      setView(initialView);
      if (initialView.tab === 'reset' && initialView.step === 2 && initialView.token) {
        setToken(initialView.token);
      }
      if (initialView.tab === 'register' && initialView.step === 2 && initialView.token) {
        setToken(initialView.token);
      }
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setToken('');
      setInviteBlocked(false);
      setEmailSent(false);
      dispatch(setAuthError(null));
    }
  }, [isOpen, dispatch]);

  const loading = authStatus === 'loading';

  const switchTab = (tab: AuthTab) => {
    dispatch(setAuthError(null));
    setEmailSent(false);
    setInviteBlocked(false);
    if (tab === 'login') setView({ tab: 'login' });
    if (tab === 'reset') setView({ tab: 'reset', step: 1 });
    if (tab === 'register') setView({ tab: 'register', step: 1 });
  };

  const handleApiError = (e: unknown, opts: { onForbiddenRegister?: boolean } = {}) => {
    if (e instanceof ApiError) {
      if (e.kind === 'forbidden' && opts.onForbiddenRegister) {
        setInviteBlocked(true);
        dispatch(setAuthError(null));
        return;
      }
      if (e.kind === 'rate_limited') {
        dispatch(setAuthError('Too many attempts. Try again in a minute.'));
        return;
      }
      if (e.kind === 'unauthorized') {
        dispatch(setAuthError('Invalid email or password.'));
        return;
      }
      dispatch(setAuthError(e.body?.trim() || e.message || 'Something went wrong.'));
      return;
    }
    dispatch(setAuthError('Network error. Check your connection and try again.'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(setAuthStatus('loading'));
    try {
      const res = await apiLogin({ email, password });
      const user = res.user ?? userFromToken(res.token) ?? { id: '', email };
      dispatch(loginSuccess({ token: res.token, user }));
      toast.success('Signed in.');
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleResetInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    dispatch(setAuthStatus('loading'));
    try {
      await passwordResetInitiate({ email });
      dispatch(setAuthStatus('idle'));
      setEmailSent(true);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;
    if (password !== confirmPassword) {
      dispatch(setAuthError('Passwords do not match.'));
      return;
    }
    dispatch(setAuthStatus('loading'));
    try {
      const res = await passwordResetComplete({ token, password });
      const user = res.user ?? userFromToken(res.token) ?? { id: '', email: '' };
      dispatch(loginSuccess({ token: res.token, user }));
      toast.success('Password reset. Signed in.');
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    dispatch(setAuthStatus('loading'));
    try {
      await registerInitiate({ email });
      dispatch(setAuthStatus('idle'));
      setEmailSent(true);
    } catch (err) {
      handleApiError(err, { onForbiddenRegister: true });
    }
  };

  const handleRegisterComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;
    if (password !== confirmPassword) {
      dispatch(setAuthError('Passwords do not match.'));
      return;
    }
    dispatch(setAuthStatus('loading'));
    try {
      const res = await registerComplete({ token, password });
      const user = res.user ?? userFromToken(res.token) ?? { id: '', email: '' };
      dispatch(loginSuccess({ token: res.token, user }));
      toast.success('Account created. Signed in.');
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      handleApiError(err);
    }
  };

  return {
    view,
    authError,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    token,
    confirmPassword,
    setConfirmPassword,
    inviteBlocked,
    emailSent,
    switchTab,
    handleLogin,
    handleResetInitiate,
    handleResetComplete,
    handleRegisterInitiate,
    handleRegisterComplete,
  };
}
