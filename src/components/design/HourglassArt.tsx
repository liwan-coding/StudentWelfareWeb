import type { CSSProperties } from 'react'

/* Hourglass drawing from the design reference (viewBox 22 6 196 350). Liquid levels,
   drops and the student are moved from Hourglass.tsx through refs / class names. */

const TOP = 'M60 30C59 62 60 92 70 112C80 132 106 150 113 164H127C134 150 160 132 170 112C180 92 181 62 180 30Z'
const BOT = 'M113 178C106 192 80 210 70 232C60 254 59 290 60 322H180C181 290 180 254 170 232C160 210 134 192 127 178Z'
const GLASS =
  'M60 30C59 62 60 92 70 112C80 132 106 150 113 164L113 178C106 192 80 210 70 232C60 254 59 290 60 322H180C181 290 180 254 170 232C160 210 134 192 127 178L127 164C134 150 160 132 170 112C180 92 181 62 180 30Z'
const DROP_BIG = 'M120 172c2.6 3.6 3.6 5.6 3.6 7.2a3.6 3.6 0 0 1-7.2 0c0-1.6 1-3.6 3.6-7.2z'
const DROP_SMALL = 'M120 172c2.4 3.4 3.3 5.2 3.3 6.7a3.3 3.3 0 0 1-6.6 0c0-1.5.9-3.3 3.3-6.7z'

export interface HourglassClassNames {
  hg: string
  lqTop: string
  lqBot: string
  wTop: string
  wBack: string
  wFront: string
  wFoam: string
  shim: string
  glint: string
  ripple: string
  drop: string
  student: string
  lampLight: string
  upper: string
  armWrite: string
  armCheer: string
  pen: string
  head: string
  smile: string
  capWorn: string
  tassel: string
}

const v = (vars: Record<string, string>) => vars as CSSProperties

export function HourglassArt({ id, c }: { id: string; c: HourglassClassNames }) {
  const u = (name: string) => `url(#${name}${id})`
  return (
    <svg className={c.hg} viewBox="22 6 196 350" aria-hidden="true">
      <defs>
        <clipPath id={`ct${id}`}><path d={TOP} /></clipPath>
        <clipPath id={`cb${id}`}><path d={BOT} /></clipPath>
        <linearGradient id={`lq${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB3E8" /><stop offset=".18" stopColor="#F06BCB" /><stop offset=".55" stopColor="#C33AA6" /><stop offset="1" stopColor="#6E1F63" />
        </linearGradient>
        <linearGradient id={`gloss${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".55" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`sheen${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".45" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`dropG${id}`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset=".3" stopColor="#FF8FDA" /><stop offset="1" stopColor="#B02F92" />
        </radialGradient>
        <linearGradient id={`lqs${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2A0C25" stopOpacity=".5" /><stop offset=".3" stopColor="#2A0C25" stopOpacity="0" /><stop offset=".7" stopColor="#FFFFFF" stopOpacity=".12" /><stop offset="1" stopColor="#2A0C25" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={`gl${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".38" /><stop offset=".14" stopColor="#FFFFFF" stopOpacity=".05" /><stop offset=".85" stopColor="#FFFFFF" stopOpacity=".02" /><stop offset="1" stopColor="#FFFFFF" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id={`gs${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9DDEC" /><stop offset=".5" stopColor="#7E6C86" /><stop offset="1" stopColor="#D8CADD" />
        </linearGradient>
        <linearGradient id={`base${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5A3A55" /><stop offset=".25" stopColor="#3B2238" /><stop offset="1" stopColor="#1C1320" />
        </linearGradient>
        <linearGradient id={`baseTop${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3B2238" /><stop offset=".5" stopColor="#8A5A82" /><stop offset="1" stopColor="#3B2238" />
        </linearGradient>
        <linearGradient id={`skin${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6D7C2" /><stop offset="1" stopColor="#D9A88A" />
        </linearGradient>
        <linearGradient id={`shirt${id}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset=".6" stopColor="#F1ECF4" /><stop offset="1" stopColor="#CBBFD3" />
        </linearGradient>
        <linearGradient id={`pants${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A2F45" /><stop offset="1" stopColor="#1F1828" />
        </linearGradient>
        <linearGradient id={`chair${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C79C74" /><stop offset="1" stopColor="#8E6646" />
        </linearGradient>
        <linearGradient id={`wood${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2C3A2" /><stop offset="1" stopColor="#B48A64" />
        </linearGradient>
        <radialGradient id={`lamp${id}`} cx=".5" cy="0" r="1">
          <stop offset="0" stopColor="#FFF1C9" stopOpacity=".95" /><stop offset="1" stopColor="#FFF1C9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`floor${id}`}>
          <stop offset="0" stopColor="#E58ACB" stopOpacity=".35" /><stop offset="1" stopColor="#E58ACB" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="350" rx="118" ry="12" fill={u('floor')} />
      {/* glass body tint */}
      <path d={GLASS} fill="rgba(255,255,255,.07)" />

      {/* top liquid */}
      <g clipPath={u('ct')}>
        <g className={c.lqTop} style={{ transform: 'translateY(34px)' }}>
          <path className={c.wTop} d="M20 0H220V200H20z" fill={u('lq')} />
          <rect x="72" y="6" width="16" height="190" fill={u('gloss')} />
          <rect className={c.shim} x="20" y="4" width="60" height="200" fill={u('sheen')} />
        </g>
        <rect x="40" y="0" width="160" height="180" fill={u('lqs')} opacity=".8" />
      </g>

      {/* bottom: student at a desk, riding on the rising liquid */}
      <g clipPath={u('cb')}>
        <g className={c.student} style={{ transform: 'translateY(0px)' }}>
          <g transform="translate(116 318) scale(1.12)">
            <path className={c.lampLight} d="M36 -55L10 -33H44Z" fill={u('lamp')} />
            {/* chair */}
            <path d="M-41 -60C-42 -48 -41 -34 -39 -22H-35.5C-37.5 -34 -38 -48 -37 -60Z" fill={u('chair')} />
            <rect x="-41" y="-25" width="25" height="4" rx="2" fill={u('chair')} />
            <path d="M-38 -21L-40 0M-19 -21L-17 0" stroke="#7A5A43" strokeWidth="2.4" strokeLinecap="round" />
            {/* desk */}
            <rect x="-6" y="-33" width="62" height="3.6" rx="1.2" fill={u('wood')} />
            <rect x="-4" y="-29.6" width="58" height="4" fill="#9C7A5E" />
            <rect x="-3" y="-26" width="2.6" height="26" fill="#8A6A50" />
            <rect x="50" y="-26" width="2.6" height="26" fill="#8A6A50" />
            {/* notebook, books, lamp */}
            <path d="M0 -33.2L9.5 -35 19 -33.2Z" fill="#FFFFFF" stroke="#D8CFDC" strokeWidth=".5" />
            <path d="M3 -33.6L8.5 -34.6M11 -34.6L16 -33.6" stroke="#B8AFC0" strokeWidth=".4" />
            <rect x="27" y="-36" width="14" height="3" rx=".8" fill="#7E2F6C" />
            <rect x="28" y="-39" width="13" height="3" rx=".8" fill="#32A1BF" />
            <rect x="27.5" y="-42" width="12" height="3" rx=".8" fill="#D47EC0" />
            <ellipse cx="49" cy="-33.4" rx="4.5" ry="1.2" fill="#2E2236" />
            <path d="M49 -34L45 -49 37 -55" stroke="#2E2236" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M31 -58L41 -53 38 -48 29 -53Z" fill="#2E2236" />
            <circle cx="35" cy="-52" r="1.6" fill="#FFF1C9" />
            {/* legs */}
            <path d="M-35 -27C-31 -30.5 -11 -30.5 -5 -27.5C-2 -25.5 -2 -21.5 -5 -20.5L-31 -20.5C-35 -21.5 -36 -24.5 -35 -27Z" fill={u('pants')} />
            <path d="M-8.5 -24C-6.5 -16 -6.5 -8 -7.5 -3H-2.5C-1.5 -9 -1.5 -18 -3.5 -25Z" fill={u('pants')} />
            <path d="M-9.5 -3.2C-9.5 -5.4 -2.5 -5.4 2.2 -3.2C4 -2.3 4 0 2 0H-9.5Z" fill="#1C1320" />
            <g className={c.upper}>
              {/* torso */}
              <path d="M-36 -27C-38 -38 -35 -50 -27 -54.5C-21 -57.5 -14 -54.5 -13 -47.5C-12 -40 -14 -32 -16 -27Z" fill={u('shirt')} />
              <path d="M-29 -50C-27 -42 -28 -34 -30 -28.5M-22 -52C-21 -46 -21.5 -40 -23 -36" stroke="#CFC3D6" strokeWidth=".7" fill="none" strokeLinecap="round" />
              {/* writing arm */}
              <g className={c.armWrite}>
                <path d="M-25 -51.5C-21 -46 -17 -40 -12.5 -37L-9.5 -40.2C-13.5 -44 -17.5 -49.5 -20.5 -54.5Z" fill={u('shirt')} />
                <path d="M-12.5 -39.5C-6.5 -36.5 -0.5 -34.8 5 -34.4L5 -31.8C-1 -31.8 -7 -33.4 -13 -36.4Z" fill={u('skin')} />
                <ellipse cx="6.6" cy="-33" rx="2.6" ry="1.9" fill={u('skin')} />
                <g className={c.pen}><path d="M6.2 -33L10.4 -38.6" stroke="#1C1320" strokeWidth="1.1" strokeLinecap="round" /></g>
              </g>
              {/* both arms raised in joy (when the initiative is complete) */}
              <g className={c.armCheer}>
                <path d="M-29 -51C-33 -58 -36 -66 -37 -74L-33.4 -75C-32 -67 -29 -60 -25 -54Z" fill="#E4DCEA" />
                <ellipse cx="-35.4" cy="-76.4" rx="2.4" ry="2.8" fill={u('skin')} />
                <path d="M-22 -53C-19 -60 -15 -67 -11 -74L-7.6 -72.4C-11 -66 -14.6 -59 -18 -51Z" fill={u('shirt')} />
                <ellipse cx="-9" cy="-75.4" rx="2.5" ry="2.9" fill={u('skin')} />
              </g>
              {/* head with a graduation cap */}
              <g className={c.head}>
                <g transform="rotate(14 -19 -56)">
                  <path d="M-22.5 -58H-16.5V-53H-22.5Z" fill={u('skin')} />
                  <ellipse cx="-19" cy="-63.5" rx="6.6" ry="7.6" fill={u('skin')} />
                  <path d="M-12.6 -64.5L-10.4 -61.6 -12.7 -60.9Z" fill="#E4B597" />
                  <ellipse cx="-21.6" cy="-62.6" rx="1.4" ry="2" fill="#DDA98A" />
                  <path className={c.smile} d="M-15.6 -60.6Q-13.6 -58.6 -11.8 -60.4" stroke="#8A4A3A" strokeWidth=".8" fill="none" strokeLinecap="round" />
                  <circle cx="-14.6" cy="-64.6" r=".75" fill="#2A1E24" />
                  <path d="M-16 -66.4L-13.2 -66.2" stroke="#2A1E24" strokeWidth=".55" strokeLinecap="round" />
                  <path d="M-26 -63C-26.5 -69 -21 -71.5 -16 -70.8C-13.6 -70.5 -12.6 -69 -12.6 -67.6C-15.5 -68.6 -20 -68.4 -22.4 -66.4C-23.6 -64.6 -24.4 -62.2 -25.6 -60.6Z" fill="#2A1E24" />
                  <g className={c.capWorn}>
                    <path d="M-26 -67.4C-25.4 -72.6 -12.8 -72.6 -12.2 -67.4L-12.8 -65.6C-17 -67.6 -21.6 -67.6 -25.8 -65.4Z" fill="#1C1320" />
                    <path d="M-32 -71.6L-19.2 -77 -5.6 -72 -18.6 -67.2Z" fill="#241A28" />
                    <path d="M-32 -71.6L-18.6 -67.2 -5.6 -72" stroke="#5E4A66" strokeWidth=".6" fill="none" />
                    <circle cx="-18.8" cy="-72" r=".9" fill="#D47EC0" />
                    <g className={c.tassel}>
                      <path d="M-18.8 -72L-8.5 -70.6 -7.6 -63" stroke="#D47EC0" strokeWidth=".9" fill="none" />
                      <path d="M-9 -63.5H-6.2L-6.6 -59.2H-8.6Z" fill="#D47EC0" />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
        <g className={c.lqBot} style={{ transform: 'translateY(318px)' }}>
          <path className={c.wBack} d="M20 0H220V120H20z" fill="#FF8FDA" opacity=".55" />
          <path className={c.wFront} d="M20 0H220V120H20z" fill={u('lq')} />
          <path className={c.wFoam} d="M20 0H220" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="1.4" fill="none" />
          <rect x="74" y="8" width="14" height="110" fill={u('gloss')} />
          <rect className={c.shim} x="20" y="6" width="60" height="120" fill={u('sheen')} />
          <circle className={c.glint} cx="96" cy="7" r="1.6" fill="#FFFFFF" />
          <circle className={c.glint} cx="150" cy="6" r="1.2" fill="#FFFFFF" style={{ animationDelay: '.9s' }} />
          <ellipse className={c.ripple} cx="120" cy="4" rx="10" ry="2.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" style={v({ '--d': '0s' })} />
          <ellipse className={c.ripple} cx="120" cy="4" rx="10" ry="2.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" style={v({ '--d': '.57s' })} />
        </g>
        <rect x="40" y="170" width="160" height="160" fill={u('lqs')} opacity=".6" />
      </g>

      {/* drops falling from the centre of the neck */}
      <g>
        <path className={c.drop} d={DROP_BIG} fill={u('dropG')} style={v({ '--d': '0s' })} />
        <path className={c.drop} d={DROP_SMALL} fill={u('dropG')} style={v({ '--d': '.57s' })} />
        <path className={c.drop} d={DROP_BIG} fill={u('dropG')} style={v({ '--d': '1.14s' })} />
      </g>

      {/* glass: sheen, outline, highlights */}
      <path d={GLASS} fill={u('gl')} />
      <path d={GLASS} fill="none" stroke={u('gs')} strokeWidth="2.6" strokeLinejoin="round" />
      <path d={GLASS} fill="none" stroke="#FFFFFF" strokeOpacity=".18" strokeWidth="1" strokeLinejoin="round" transform="translate(120 176) scale(.965 .985) translate(-120 -176)" />
      <path d="M70 40C69 66 71 90 79 106" stroke="#FFFFFF" strokeOpacity=".75" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M75 238C68 258 68 284 69 306" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M172 46C173 70 171 92 165 104" stroke="#FFFFFF" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* caps */}
      <rect x="48" y="14" width="144" height="16" rx="5" fill={u('base')} />
      <rect x="48" y="14" width="144" height="3" rx="1.5" fill={u('baseTop')} />
      <rect x="40" y="322" width="160" height="12" rx="4" fill={u('baseTop')} />
      <rect x="30" y="332" width="180" height="16" rx="5" fill={u('base')} />
      <rect x="36" y="333" width="168" height="2" rx="1" fill="#FFFFFF" opacity=".25" />
    </svg>
  )
}
