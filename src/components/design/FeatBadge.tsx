interface FeatBadgeProps {
  label: string
  small?: boolean
  sparks?: boolean
  className?: string
}

/** The animated “مميز” badge (moving gradient, twinkling star, pulse ring, shine, sparks). */
export function FeatBadge({ label, small = false, sparks = false, className = '' }: FeatBadgeProps) {
  return (
    <span className={`ds-feat-badge ${small ? 'ds-sm' : ''} ${className}`.trim()}>
      {sparks && (
        <>
          <i className="ds-fb-spark ds-s1" aria-hidden="true" />
          <i className="ds-fb-spark ds-s2" aria-hidden="true" />
          <i className="ds-fb-spark ds-s3" aria-hidden="true" />
        </>
      )}
      <svg className="ds-fb-star" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l2.6 6.4L21 9.2l-5 4.4 1.5 6.6L12 16.8 6.5 20.2 8 13.6 3 9.2l6.4-.8z" fill="currentColor" />
      </svg>
      <span>{label}</span>
    </span>
  )
}
