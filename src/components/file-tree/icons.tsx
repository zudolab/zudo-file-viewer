export function ChevronIcon({
  isExpanded,
  className,
}: {
  isExpanded: boolean;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-[0.625rem] w-[0.625rem] shrink-0 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""} ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function FolderIcon({
  isOpen,
  className,
}: {
  isOpen: boolean;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-[14px] w-[14px] shrink-0 ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      {isOpen ? (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 19a2 2 0 01-2-2V6a2 2 0 012-2h4l2 2h7a2 2 0 012 2v1"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 19h14l2-7H7l-2 7z"
          />
        </>
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      )}
    </svg>
  );
}

export function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-[14px] w-[14px] shrink-0 ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2v6h6"
      />
    </svg>
  );
}

export function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-[14px] w-[14px] shrink-0 ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 15l-5-5L5 21"
      />
    </svg>
  );
}

export function HeicBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-[12px] w-[14px] items-center justify-center rounded-sm bg-accent-subtle text-[9px] font-bold leading-none text-muted ${className ?? ""}`}
      aria-label="HEIC format"
    >
      H
    </span>
  );
}
