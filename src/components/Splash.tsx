import { Logo } from './Logo';

/**
 * Shown while the stored session is being checked, and again while the bag is
 * first loading.
 *
 * It carries the logo rather than a bare spinner because this is often the
 * first paint of the whole app — a lone spinner on an empty page reads as
 * something having gone wrong.
 */
export function Splash({ label = 'Loading your bag…' }: { label?: string }) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-4"
      aria-busy="true"
    >
      <Logo size={96} className="animate-pulse" />
      {/* Announced politely so a screen reader isn't interrupted mid-sentence. */}
      <p className="text-sm text-muted" role="status">
        {label}
      </p>
    </main>
  );
}
