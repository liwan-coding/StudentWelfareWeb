interface BackdropProps {
  className?: string
}

/** Aurora: three soft brand lights drifting slowly behind a hero (still under reduced motion). */
export function Backdrop({ className = '' }: BackdropProps) {
  return (
    <div className={`ds-aurora ${className}`.trim()} aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  )
}
