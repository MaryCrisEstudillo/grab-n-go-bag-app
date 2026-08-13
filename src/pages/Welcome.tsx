import { Link } from 'react-router-dom';
import { BrandMark } from '../components/Logo';

/**
 * The first screen an unauthenticated visitor lands on. It exists to introduce
 * the app before asking for credentials, so it carries the mark and a single
 * way forward. Everything else it could offer is one tap away on the login
 * screen it hands off to.
 */
export function Welcome() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10 text-center">
      <BrandMark />

      <p className="mx-auto mt-4 max-w-xs text-sm text-muted">
        Your go bag monitoring app. Know what’s packed, and what’s about to
        expire.
      </p>

      <Link
        to="/login"
        className="mt-9 flex min-h-11 items-center justify-center rounded-control bg-brand font-semibold text-on-brand transition-opacity hover:opacity-90"
      >
        Get started
      </Link>
    </main>
  );
}
