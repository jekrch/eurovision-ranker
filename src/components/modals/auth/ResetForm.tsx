import React from 'react';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { primaryBtn } from './authStyles';
import { AuthErrorBox, EmailSentNotice, IconInput } from './AuthFormElements';

type ResetInitiateFormProps = {
    email: string;
    setEmail: (value: string) => void;
    emailSent: boolean;
    authError: string | null | undefined;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
};

export const ResetInitiateForm: React.FC<ResetInitiateFormProps> = ({
    email, setEmail, emailSent, authError, loading, onSubmit,
}) => (
    <form onSubmit={onSubmit} className="space-y-3">
        {emailSent ? (
            <EmailSentNotice>
                If an account exists for{' '}
                <span className="font-semibold text-[var(--er-text-primary)]">{email}</span>,
                we've sent a reset link. Open it to set a new password.
            </EmailSentNotice>
        ) : (
            <>
                <IconInput
                    icon={faEnvelope}
                    type="email"
                    placeholder="Email address"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                />
                <AuthErrorBox error={authError} />
                <button type="submit" disabled={loading} className={primaryBtn}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
            </>
        )}
    </form>
);

type ResetCompleteFormProps = {
    password: string;
    setPassword: (value: string) => void;
    confirmPassword: string;
    setConfirmPassword: (value: string) => void;
    authError: string | null | undefined;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
};

export const ResetCompleteForm: React.FC<ResetCompleteFormProps> = ({
    password, setPassword, confirmPassword, setConfirmPassword, authError, loading, onSubmit,
}) => (
    <form onSubmit={onSubmit} className="space-y-3">
        <IconInput
            icon={faLock}
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
        />
        <IconInput
            icon={faLock}
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
        />
        <AuthErrorBox error={authError} />
        <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? 'Resetting…' : 'Reset Password'}
        </button>
    </form>
);
