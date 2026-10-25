interface BackdropProps {
  className?: string
}

/** A quiet colour mesh behind heroes (static, no animation loop). */
export function Backdrop({ className = '' }: BackdropProps) {
  return <div className={`ds-mesh ${className}`.trim()} aria-hidden="true" />
}
