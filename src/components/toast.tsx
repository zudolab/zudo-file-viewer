interface ToastAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface ToastProps {
  message: string;
  actions: ToastAction[];
  onDismiss?: () => void;
}

export function Toast({ message, actions, onDismiss }: ToastProps) {
  return (
    <div
      className="animate-toast-slide-in fixed top-xl left-1/2 z-50 flex items-center gap-md rounded-lg border border-edge bg-surface px-lg py-md shadow-dialog"
      role="status"
      aria-live="polite"
    >
      <span className="text-sm text-fg">{message}</span>
      <div className="flex items-center gap-xs">
        {actions.map((action) => (
          <button
            key={action.label}
            className={
              action.primary
                ? "rounded-md bg-accent px-md py-xs text-sm text-on-accent"
                : "text-sm text-muted hover:text-fg"
            }
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
      {onDismiss && (
        <button
          className="ml-xs flex items-center justify-center text-muted hover:text-fg"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-[14px] w-[14px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
