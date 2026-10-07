type IconProps = {
  className?: string;
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "h-[18px] w-[18px]"}>
      <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "h-[18px] w-[18px]"}>
      <path
        d="M6.5 8.5h11l-.7 11h-9.6l-.7-11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M9 8.5V7a3 3 0 0 1 6 0v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "h-[18px] w-[18px]"}>
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16.6" cy="7.4" r="0.8" fill="currentColor" />
    </svg>
  );
}
