import {
  faRightToBracket,
  faKey,
  faUserPlus,
  faShieldHalved,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import Modal from '../Modal';
import ModalHeader from '../ModalHeader';
import { InviteAlert } from './AuthFormElements';
import { tabBtn } from './authStyles';
import { AuthView } from './authTypes';
import LoginForm from './LoginForm';
import { RegisterInitiateForm, RegisterCompleteForm } from './RegisterForm';
import { ResetInitiateForm, ResetCompleteForm } from './ResetForm';
import { useAuthForms } from './useAuthForms';

// re-exported for existing importers (e.g. App.tsx)
export type { AuthTab, AuthView } from './authTypes';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  allowRegister?: boolean;
  onAuthSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView,
  allowRegister = false,
  onAuthSuccess,
}) => {
  const form = useAuthForms({ isOpen, onClose, initialView, onAuthSuccess });
  const { view } = form;

  const headerCopy = (() => {
    if (view.tab === 'login')
      return { title: 'Welcome back', subtitle: 'Sign in to sync your rankings across devices.' };
    if (view.tab === 'reset' && view.step === 2)
      return { title: 'Set a new password', subtitle: 'Almost done — pick a strong password.' };
    if (view.tab === 'reset')
      return { title: 'Reset your password', subtitle: "We'll email you a secure link." };
    if (view.tab === 'register' && view.step === 2)
      return { title: 'Finish your account', subtitle: 'Set a password to complete sign-up.' };
    return { title: 'Create an account', subtitle: 'Enter your email to get started.' };
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md !p-0 overflow-hidden">
      <ModalHeader icon={faShieldHalved} title={headerCopy.title} subtitle={headerCopy.subtitle} />

      <div className="px-6 py-5 space-y-4">
        {/* Tab switcher (only on step 1) */}
        {(view.tab === 'login' ||
          (view.tab === 'reset' && view.step !== 2) ||
          (view.tab === 'register' && view.step !== 2)) && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[color:var(--er-surface-primary)] ring-1 ring-inset ring-white/5">
            <button
              type="button"
              className={tabBtn(view.tab === 'login')}
              onClick={() => form.switchTab('login')}
            >
              <FontAwesomeIcon icon={faRightToBracket} className="text-[10px]" />
              Sign In
            </button>
            <button
              type="button"
              className={tabBtn(view.tab === 'reset')}
              onClick={() => form.switchTab('reset')}
            >
              <FontAwesomeIcon icon={faKey} className="text-[10px]" />
              Reset
            </button>
            {allowRegister && (
              <button
                type="button"
                className={tabBtn(view.tab === 'register')}
                onClick={() => form.switchTab('register')}
              >
                <FontAwesomeIcon icon={faUserPlus} className="text-[10px]" />
                Register
              </button>
            )}
          </div>
        )}

        {/* Step 2 back button */}
        {((view.tab === 'reset' && view.step === 2) ||
          (view.tab === 'register' && view.step === 2)) && (
          <button
            type="button"
            onClick={() => form.switchTab('login')}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
            Back to sign in
          </button>
        )}

        {/* Invite-only alert (shown on the login/register entry views when public sign-up isn't open) */}
        {!allowRegister &&
          (view.tab === 'login' || (view.tab === 'register' && view.step !== 2)) && <InviteAlert />}

        {view.tab === 'login' && (
          <LoginForm
            email={form.email}
            setEmail={form.setEmail}
            password={form.password}
            setPassword={form.setPassword}
            authError={form.authError}
            loading={form.loading}
            onSubmit={form.handleLogin}
            switchTab={form.switchTab}
          />
        )}

        {view.tab === 'reset' && view.step !== 2 && (
          <ResetInitiateForm
            email={form.email}
            setEmail={form.setEmail}
            emailSent={form.emailSent}
            authError={form.authError}
            loading={form.loading}
            onSubmit={form.handleResetInitiate}
          />
        )}

        {view.tab === 'reset' && view.step === 2 && (
          <ResetCompleteForm
            password={form.password}
            setPassword={form.setPassword}
            confirmPassword={form.confirmPassword}
            setConfirmPassword={form.setConfirmPassword}
            authError={form.authError}
            loading={form.loading}
            onSubmit={form.handleResetComplete}
          />
        )}

        {view.tab === 'register' && view.step !== 2 && (
          <RegisterInitiateForm
            email={form.email}
            setEmail={form.setEmail}
            inviteBlocked={form.inviteBlocked}
            emailSent={form.emailSent}
            authError={form.authError}
            loading={form.loading}
            onSubmit={form.handleRegisterInitiate}
          />
        )}

        {view.tab === 'register' && view.step === 2 && (
          <RegisterCompleteForm
            password={form.password}
            setPassword={form.setPassword}
            confirmPassword={form.confirmPassword}
            setConfirmPassword={form.setConfirmPassword}
            authError={form.authError}
            loading={form.loading}
            onSubmit={form.handleRegisterComplete}
          />
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
