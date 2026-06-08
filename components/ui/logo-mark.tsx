import type React from 'react'

export function LogoMark({ size = 32, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-label="Trampar na Gringa"
      role="img"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      <circle cx="100" cy="100" r="92" fill="#430049" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#5A1F62" strokeWidth="1.5" />
      <g transform="rotate(15 100 100)">
        <polygon points="100,48 134,100 66,100" fill="#FF6B35" />
        <polygon points="66,100 134,100 100,152" fill="#FF8C66" />
      </g>
    </svg>
  )
}
