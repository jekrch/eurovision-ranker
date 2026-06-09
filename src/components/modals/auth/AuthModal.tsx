import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRightToBracket,
    faKey,
    faUserPlus,
    faEnvelope,
    faLock,
    faShieldHalved,
    faCircleInfo,
    faArrowLeft,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '../Modal';
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
    onAuthSuccess?: () => void;
}

const inputBase =
    'w-full rounded-lg border bg-[color:var(--er-surface-primary)] border-white/5 text-sm text-[var(--er-text-primary)] placeholder-[var(--er-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/40 focus:border-[var(--er-button-primary)]/40 transition-colors';

const inputWithIcon = `${inputBase} pl-10 pr-3 py-2.5`;

const primaryBtn =
    'relative overflow-hidden w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] shadow-sm shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const tabBtn = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-colors ${
        active
            ? 'bg-[var(--er-button-primary)]/20 text-[var(--er-text-primary)] ring-1 ring-inset ring-[var(--er-button-primary)]/30 shadow-sm shadow-black/20'
            : 'text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/[0.03]'
    }`;

const InviteAlert: React.FC = () => (
    <div className="rounded-lg border-[0.7px] border-[var(--er-button-primary)]/30 bg-[var(--er-button-primary)]/10 p-3 flex gap-2.5">
        <FontAwesomeIcon
            icon={faCircleInfo}
            className="text-[var(--er-button-primary)] mt-0.5 shrink-0"
        />
        <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">
            <span className="font-semibold text-[var(--er-text-primary)]">Private preview.</span>{' '}
            Accounts are invite-only while this feature is being tested with a small group.
            Public sign-ups will open in a future release. Thanks for your patience!
        </div>
    </div>
);

const FieldIcon: React.FC<{ icon: typeof faEnvelope }> = ({ icon }) => (
    <FontAwesomeIcon
        icon={icon}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--er-text-subtle)] text-xs pointer-events-none"
    />
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView, allowRegister = false, onAuthSuccess }) => {
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

    const headerCopy = (() => {
        if (view.tab === 'login') return { title: 'Welcome back', subtitle: 'Sign in to sync your rankings across devices.' };
        if (view.tab === 'reset' && view.step === 2) return { title: 'Set a new password', subtitle: 'Almost done — pick a strong password.' };
        if (view.tab === 'reset') return { title: 'Reset your password', subtitle: "We'll email you a secure link." };
        if (view.tab === 'register' && view.step === 2) return { title: 'Finish your account', subtitle: 'Set a password to complete sign-up.' };
        return { title: 'Create an account', subtitle: "Enter your email to get started." };
    })();

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md !p-0 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-black/30 via-black/10 to-transparent border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--er-button-primary)] to-[var(--er-button-primary-hover)] flex items-center justify-center text-white shadow-sm shrink-0">
                        <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-[var(--er-text-primary)] leading-tight truncate">
                            {headerCopy.title}
                        </h2>
                        <p className="text-xs text-[var(--er-text-subtle)] mt-0.5 truncate">
                            {headerCopy.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 space-y-4">
                {/* Tab switcher (only on step 1) */}
                {(view.tab === 'login' || (view.tab === 'reset' && view.step !== 2) || (view.tab === 'register' && view.step !== 2)) && (
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-[color:var(--er-surface-primary)] ring-1 ring-inset ring-white/5">
                        <button
                            type="button"
                            className={tabBtn(view.tab === 'login')}
                            onClick={() => switchTab('login')}
                        >
                            <FontAwesomeIcon icon={faRightToBracket} className="text-[10px]" />
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={tabBtn(view.tab === 'reset')}
                            onClick={() => switchTab('reset')}
                        >
                            <FontAwesomeIcon icon={faKey} className="text-[10px]" />
                            Reset
                        </button>
                        {allowRegister && (
                            <button
                                type="button"
                                className={tabBtn(view.tab === 'register')}
                                onClick={() => switchTab('register')}
                            >
                                <FontAwesomeIcon icon={faUserPlus} className="text-[10px]" />
                                Register
                            </button>
                        )}
                    </div>
                )}

                {/* Step 2 back button */}
                {((view.tab === 'reset' && view.step === 2) || (view.tab === 'register' && view.step === 2)) && (
                    <button
                        type="button"
                        onClick={() => switchTab('login')}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
                        Back to sign in
                    </button>
                )}

                {/* Invite-only alert (shown on the login/register entry views when public sign-up isn't open) */}
                {!allowRegister &&
                    (view.tab === 'login' || (view.tab === 'register' && view.step !== 2)) && (
                        <InviteAlert />
                    )}

                {/* LOGIN */}
                {view.tab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div className="relative">
                            <FieldIcon icon={faEnvelope} />
                            <input
                                className={inputWithIcon}
                                type="email"
                                placeholder="Email address"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <FieldIcon icon={faLock} />
                            <input
                                className={inputWithIcon}
                                type="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => switchTab('reset')}
                                className="text-xs text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {authError && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                                {authError}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className={primaryBtn}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                )}

                {/* RESET — initiate */}
                {view.tab === 'reset' && view.step !== 2 && (
                    <form onSubmit={handleResetInitiate} className="space-y-3">
                        {emailSent ? (
                            <div className="flex gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <FontAwesomeIcon icon={faCheck} className="text-emerald-400 mt-0.5 shrink-0" />
                                <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">
                                    If an account exists for{' '}
                                    <span className="font-semibold text-[var(--er-text-primary)]">{email}</span>,
                                    we've sent a reset link. Open it to set a new password.
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <FieldIcon icon={faEnvelope} />
                                    <input
                                        className={inputWithIcon}
                                        type="email"
                                        placeholder="Email address"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {authError && (
                                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                                        {authError}
                                    </div>
                                )}
                                <button type="submit" disabled={loading} className={primaryBtn}>
                                    {loading ? 'Sending…' : 'Send Reset Link'}
                                </button>
                            </>
                        )}
                    </form>
                )}

                {/* RESET — complete */}
                {view.tab === 'reset' && view.step === 2 && (
                    <form onSubmit={handleResetComplete} className="space-y-3">
                        <div className="relative">
                            <FieldIcon icon={faLock} />
                            <input
                                className={inputWithIcon}
                                type="password"
                                placeholder="New password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <FieldIcon icon={faLock} />
                            <input
                                className={inputWithIcon}
                                type="password"
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        {authError && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                                {authError}
                            </div>
                        )}
                        <button type="submit" disabled={loading} className={primaryBtn}>
                            {loading ? 'Resetting…' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {/* REGISTER — initiate */}
                {view.tab === 'register' && view.step !== 2 && (
                    <form onSubmit={handleRegisterInitiate} className="space-y-3">
                        {inviteBlocked ? (
                            <InviteAlert />
                        ) : emailSent ? (
                            <div className="flex gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <FontAwesomeIcon icon={faCheck} className="text-emerald-400 mt-0.5 shrink-0" />
                                <div className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">
                                    Check{' '}
                                    <span className="font-semibold text-[var(--er-text-primary)]">{email}</span>{' '}
                                    for a verification link. Open it to finish creating your account.
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <FieldIcon icon={faEnvelope} />
                                    <input
                                        className={inputWithIcon}
                                        type="email"
                                        placeholder="Email address"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {authError && (
                                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                                        {authError}
                                    </div>
                                )}
                                <button type="submit" disabled={loading} className={primaryBtn}>
                                    {loading ? 'Sending…' : 'Create Account'}
                                </button>
                            </>
                        )}
                    </form>
                )}

                {/* REGISTER — complete */}
                {view.tab === 'register' && view.step === 2 && (
                    <form onSubmit={handleRegisterComplete} className="space-y-3">
                        <div className="relative">
                            <FieldIcon icon={faLock} />
                            <input
                                className={inputWithIcon}
                                type="password"
                                placeholder="Password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <FieldIcon icon={faLock} />
                            <input
                                className={inputWithIcon}
                                type="password"
                                placeholder="Confirm password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        {authError && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                                {authError}
                            </div>
                        )}
                        <button type="submit" disabled={loading} className={primaryBtn}>
                            {loading ? 'Creating…' : 'Create Account'}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default AuthModal;
