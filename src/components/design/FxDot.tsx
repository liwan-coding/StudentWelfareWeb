import type { CSSProperties } from 'react'

const DOT_COLORS = ['#32A1BF', '#A2458C', '#D47EC0', '#7FD0E6']

/** The small breathing light in a box corner (colour and phase vary by index). */
export function FxDot({ index = 0 }: { index?: number }) {
  const style = {
    '--dc': DOT_COLORS[index % DOT_COLORS.length],
    '--dd': `${-index * 0.6}s`,
  } as CSSProperties
  return <i className="ds-fx-dot" style={style} aria-hidden="true" />
}
