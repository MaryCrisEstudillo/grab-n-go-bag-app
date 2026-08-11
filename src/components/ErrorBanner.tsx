import { AlertTriangle, RotateCw, X } from 'lucide-react';

/**
 * A write that failed, said out loud.
 *
 * Optimistic updates mean the screen has already moved on, so without this the
 * only sign of a failure would be a change quietly reverting — which reads as
 * the app losing your work rather than as a network problem.
 */
export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-4 flex items-start gap-3 rounded-card border border-danger-line bg-danger-soft px-4 py-3"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-danger">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-danger underline underline-offset-2"
          >
            <RotateCw size={14} />
            Try again
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-1 shrink-0 p-1 text-danger opacity-70 transition-opacity hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
