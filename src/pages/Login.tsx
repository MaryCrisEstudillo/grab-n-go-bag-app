import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/Logo';
import { Field, inputClass } from '../components/Field';

type Mode = 'signin' | 'register';

export function Login() {
  const { signIn, register, loading, error, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const registering = mode === 'register';

  // The error lives in the container, attributed to a field, so the form only
  // has to ask which one it belongs to.
  const errorFor = (field: string) =>
    error?.field === field ? error.message : undefined;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // On success the route guard swaps this screen out; nothing to do here.
    if (registering) {
      await register(email, password, confirmPassword);
    } else {
      await signIn(email, password);
    }
  }

  function switchMode() {
    setMode(registering ? 'signin' : 'register');
    setConfirmPassword('');
    clearError();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      {/* Centred, and the same mark and wordmark the welcome screen opens with,
          so arriving here reads as the next step rather than a new place. */}
      <div className="mb-7 text-center">
        <BrandMark size={132} />
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted">
          {registering
            ? 'Create an account and we’ll pack you a starter bag.'
            : 'Know what’s in your bag, and what’s about to expire.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Email" error={errorFor('email')}>
          {(field) => (
            <input
              {...field}
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError();
              }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          )}
        </Field>

        <Field label="Password" error={errorFor('password')}>
          {(field) => (
            <div className="relative">
              <input
                {...field}
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-16`}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearError();
                }}
                autoComplete={registering ? 'new-password' : 'current-password'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-brand"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          )}
        </Field>

        {registering && (
          <Field label="Confirm password" error={errorFor('confirmPassword')}>
            {(field) => (
              <input
                {...field}
                type={showPassword ? 'text' : 'password'}
                className={inputClass}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearError();
                }}
                autoComplete="new-password"
                disabled={loading}
              />
            )}
          </Field>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full rounded-control bg-brand font-semibold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading
            ? registering
              ? 'Creating your account…'
              : 'Signing in…'
            : registering
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      {registering && (
        <p className="mt-4 rounded-card border border-line bg-surface px-4 py-3 text-sm text-muted">
          Your bag starts with eight categories ready to fill. Add anything with
          an expiry date and we’ll email you a reminder before it runs out.
        </p>
      )}

      <p className="mt-5 text-center text-sm text-muted">
        {registering ? 'Already have an account? ' : 'No account yet? '}
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {registering ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </main>
  );
}
