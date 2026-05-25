import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { faRightToBracket, faKey, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import Modal from '../Modal';
import TabButton from '../../TabButton';
import IconButton from '../../IconButton';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import { AppState } from '../../../redux/store';
import { loginSuccess, setAuthError, setAuthStatus } from '../../../redux/rootSlice';
import {
    login as apiLogin,
    passwordResetInitiate,
    passwordResetComplete,
    registerInitiate,
    registerComplete,
} from '../../../utilities/api/auth';
import { ApiError } from '../../../utilities/api/types';
import { userFromToken } from '../../../redux/authSlice';

export type AuthTab = 'login' | 'reset' | 'register';
export type AuthView =
    | { tab: 'login' }
    | { tab: 'reset'; step: 1 | 2; token?: string }
    | { tab: 'register'; step: 1 | 2; token?: string };

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: AuthView;
    allowRegister?: boolean;
}

const INVITE_COPY = 'Public sign-up coming soon.';

const inputClass =
    'border text-sm rounded-md block w-full p-2.5 bg-[var(--er-border-subtle)] border-[var(--er-border-medium)] placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView, allowRegister = false }) => {
    const dispatch = useAppDispatch();
    const authStatus = useAppSelector((s: AppState) => s.authStatus);
    const authError = useAppSelector((s: AppState) => s.authError);

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
                // client toasts this already
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
            onClose();
        } catch (err) {
            handleApiError(err);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="border-b border-[var(--er-border-lightest)] dark:border-[var(--er-border-darker)] -mt-4">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-[var(--er-text-muted)] dark:text-[var(--er-text-subtle)]">
                    <TabButton
                        isActive={view.tab === 'login'}
                        onClick={() => switchTab('login')}
                        icon={faRightToBracket}
                        label="Sign In"
                    />
                    <TabButton
                        isActive={view.tab === 'reset'}
                        onClick={() => switchTab('reset')}
                        icon={faKey}
                        label="Forgot Password"
                    />
                    {allowRegister && (
                        <TabButton
                            isActive={view.tab === 'register'}
                            onClick={() => switchTab('register')}
                            icon={faUserPlus}
                            label="Register"
                        />
                    )}
                </ul>
            </div>

            <div className="pt-4 pb-2">
                {view.tab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-3">
                        <input
                            className={inputClass}
                            type="email"
                            placeholder="Email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            className={inputClass}
                            type="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {authError && <div className="text-sm text-red-400">{authError}</div>}
                        {!allowRegister && (
                            <div className="text-xs text-[var(--er-text-subtle)]">{INVITE_COPY}</div>
                        )}
                        <div className="flex justify-end gap-2 pt-1">
                            <IconButton
                                onClick={onClose}
                                isGrayTheme
                                className="!font-medium !text-[0.9em] !px-4 py-2"
                                title="Cancel"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative overflow-hidden text-white font-medium py-2 px-4 rounded-md text-[0.9em] bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:opacity-50"
                            >
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                )}

                {view.tab === 'reset' && view.step !== 2 && (
                    <form onSubmit={handleResetInitiate} className="space-y-3">
                        {emailSent ? (
                            <div className="text-sm">
                                If an account exists for <b>{email}</b>, we've sent a reset link.
                                Open the link from your email to set a new password.
                            </div>
                        ) : (
                            <>
                                <input
                                    className={inputClass}
                                    type="email"
                                    placeholder="Email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {authError && <div className="text-sm text-red-400">{authError}</div>}
                                <div className="flex justify-end gap-2 pt-1">
                                    <IconButton
                                        onClick={onClose}
                                        isGrayTheme
                                        className="!font-medium !text-[0.9em] !px-4 py-2"
                                        title="Cancel"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="relative overflow-hidden text-white font-medium py-2 px-4 rounded-md text-[0.9em] bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:opacity-50"
                                    >
                                        {loading ? 'Sending…' : 'Send Reset Link'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                )}

                {view.tab === 'reset' && view.step === 2 && (
                    <form onSubmit={handleResetComplete} className="space-y-3">
                        <div className="text-sm">Set a new password for your account.</div>
                        <input
                            className={inputClass}
                            type="password"
                            placeholder="New password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <input
                            className={inputClass}
                            type="password"
                            placeholder="Confirm password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {authError && <div className="text-sm text-red-400">{authError}</div>}
                        <div className="flex justify-end gap-2 pt-1">
                            <IconButton
                                onClick={onClose}
                                isGrayTheme
                                className="!font-medium !text-[0.9em] !px-4 py-2"
                                title="Cancel"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative overflow-hidden text-white font-medium py-2 px-4 rounded-md text-[0.9em] bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:opacity-50"
                            >
                                {loading ? 'Resetting…' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}

                {view.tab === 'register' && view.step !== 2 && (
                    <form onSubmit={handleRegisterInitiate} className="space-y-3">
                        {inviteBlocked ? (
                            <div className="text-sm text-[var(--er-text-tertiary)]">{INVITE_COPY}</div>
                        ) : emailSent ? (
                            <div className="text-sm">
                                Check <b>{email}</b> for a verification link. Open it to finish creating your account.
                            </div>
                        ) : (
                            <>
                                <input
                                    className={inputClass}
                                    type="email"
                                    placeholder="Email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {authError && <div className="text-sm text-red-400">{authError}</div>}
                                <div className="flex justify-end gap-2 pt-1">
                                    <IconButton
                                        onClick={onClose}
                                        isGrayTheme
                                        className="!font-medium !text-[0.9em] !px-4 py-2"
                                        title="Cancel"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="relative overflow-hidden text-white font-medium py-2 px-4 rounded-md text-[0.9em] bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:opacity-50"
                                    >
                                        {loading ? 'Sending…' : 'Create Account'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                )}

                {view.tab === 'register' && view.step === 2 && (
                    <form onSubmit={handleRegisterComplete} className="space-y-3">
                        <div className="text-sm">Finish setting up your account.</div>
                        <input
                            className={inputClass}
                            type="password"
                            placeholder="Password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <input
                            className={inputClass}
                            type="password"
                            placeholder="Confirm password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {authError && <div className="text-sm text-red-400">{authError}</div>}
                        <div className="flex justify-end gap-2 pt-1">
                            <IconButton
                                onClick={onClose}
                                isGrayTheme
                                className="!font-medium !text-[0.9em] !px-4 py-2"
                                title="Cancel"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative overflow-hidden text-white font-medium py-2 px-4 rounded-md text-[0.9em] bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:opacity-50"
                            >
                                {loading ? 'Creating…' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default AuthModal;
