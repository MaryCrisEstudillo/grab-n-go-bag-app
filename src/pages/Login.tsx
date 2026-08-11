import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field, inputClass } from '../components/Field';

type Mode = 'signin' | 'register';
type FieldName = 'email' | 'password' | 'confirmPassword';

export function Login() {
  const { signIn, register } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  const registering = mode === 'register';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = registering
      ? register(email, password, confirmPassword)
      : signIn(email, password);

    // On success the route guard swaps this screen out; nothing to do here.
    if (!result.ok) setErrors({ [result.field]: result.message });
  }

  function switchMode() {
    setMode(registering ? 'signin' : 'register');
    setConfirmPassword('');
    setErrors({});
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-7">
        <div className="flex size-14 items-center justify-center rounded-card bg-brand text-on-brand">
          <Briefcase size={26} />
        </div>
        <h1 className="mt-4 text-2xl font-bold">GrabnGo bag</h1>
        <p className="mt-1 text-sm text-muted">
          {registering
            ? 'Create an account to start tracking your kit.'
            : 'Know what’s in your bag, and what’s about to expire.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Email" error={errors.email}>
          {(field) => (
            <input
              {...field}
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="you@example.com"
              autoComplete="email"
            />
          )}
        </Field>

        <Field label="Password" error={errors.password}>
          {(field) => (
            <div className="relative">
              <input
                {...field}
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-16`}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                autoComplete={registering ? 'new-password' : 'current-password'}
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
          <Field label="Confirm password" error={errors.confirmPassword}>
            {(field) => (
              <input
                {...field}
                type={showPassword ? 'text' : 'password'}
                className={inputClass}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setErrors((current) => ({ ...current, confirmPassword: undefined }));
                }}
                autoComplete="new-password"
              />
            )}
          </Field>
        )}

        <button
          type="submit"
          className="min-h-11 w-full rounded-control bg-brand font-semibold text-on-brand transition-opacity hover:opacity-90"
        >
          {registering ? 'Create account' : 'Sign in'}
        </button>
      </form>

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
