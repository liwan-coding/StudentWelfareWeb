interface FeatBadgeProps {
  label: string
  small?: boolean
  /** kept for API compatibility; the Apple badge has no sparks */
  sparks?: boolean
  className?: string
}

/** “Featured” capsule badge. */
export function FeatBadge({ label, small = false, className = '' }: FeatBadgeProps) {
  return (
    <span className={`ds-feat-badge ${small ? 'ds-sm' : ''} ${className}`.trim()}>
      <svg className="ds-fb-star" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l2.6 6.4L21 9.2l-5 4.4 1.5 6.6L12 16.8 6.5 20.2 8 13.6 3 9.2l6.4-.8z" fill="currentColor" />
      </svg>
      <span>{label}</span>
    </span>
  )
}
