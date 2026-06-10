import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Replaces hyphens with non-breaking hyphens so hyphenated words stay on one line
function nbh(text: string): string {
  return text.replace(/-/g, '‑')
}

// Scales subtitle font size down for longer texts so it never overflows the card
function subtitleFontSize(text: string): number {
  const len = text.length
  console.log(len)
  if (len <= 45) return 136
  if (len <= 65) return 96
  if (len <= 85) return 76
  return 60
}

// ── Fonts from @fontsource (local .woff, no HTTP) ────────────────────────
function readLocalFont(filename: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', filename))
  const ab = new ArrayBuffer(buf.length)
  new Uint8Array(ab).set(buf)
  return ab
}

let _fonts: ReturnType<typeof buildFonts> | undefined
function buildFonts() {
  return [
    { name: 'Bricolage', data: readLocalFont('bricolage-700.woff'),          weight: 700 as const, style: 'normal' as const },
    { name: 'Bricolage', data: readLocalFont('bricolage-800.woff'),          weight: 800 as const, style: 'normal' as const },
    { name: 'Serif',     data: readLocalFont('instrument-serif-italic.woff'), weight: 400 as const, style: 'italic' as const },
  ]
}
function getFonts() {
  return (_fonts ??= buildFonts())
}


// Splits a program name at the first natural preposition for two-line rendering
function splitProgramName(name: string): [string, string] {
  const words = name.split(' ')
  if (words.length <= 2) return [name, '']
  const prepositions = new Set(['de', 'do', 'da', 'dos', 'das', 'para', 'em', 'na', 'no', 'com', 'e'])
  for (let i = 1; i < words.length - 1; i++) {
    if (prepositions.has(words[i].toLowerCase())) {
      return [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')]
    }
  }
  const mid = Math.floor(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

const W = 1080
const H = 1080

const PAPER    = '#FBF8F1'
const PURPLE_900 = '#2A002E'
const PURPLE_700 = '#430049'
const CORAL    = '#FF6B35'
const LIME     = '#C9F23D'

type SchemeKey = 'lime' | 'coral' | 'purple' | 'dark' | 'paper' | 'white' | 'deep'

export const SCHEME_KEYS: SchemeKey[] = ['lime', 'coral', 'purple', 'dark', 'paper', 'white', 'deep']

const SCHEMES: Record<SchemeKey, {
  bg: string
  text: string
  textMuted: string
  quoteColor: string
  qrDark: string
}> = {
  lime: {
    bg:        LIME,
    text:      PURPLE_900,
    textMuted: 'rgba(42,0,46,0.55)',
    quoteColor: CORAL,
    qrDark:    PURPLE_900,
  },
  coral: {
    bg:        CORAL,
    text:      PAPER,
    textMuted: 'rgba(251,248,241,0.65)',
    quoteColor: LIME,
    qrDark:    PURPLE_900,
  },
  purple: {
    bg:        PURPLE_700,
    text:      PAPER,
    textMuted: 'rgba(251,248,241,0.55)',
    quoteColor: CORAL,
    qrDark:    PAPER,
  },
  dark: {
    bg:        '#0e0e10',
    text:      PAPER,
    textMuted: 'rgba(251,248,241,0.45)',
    quoteColor: LIME,
    qrDark:    PAPER,
  },
  paper: {
    bg:        PAPER,
    text:      PURPLE_900,
    textMuted: 'rgba(42,0,46,0.50)',
    quoteColor: CORAL,
    qrDark:    PURPLE_900,
  },
  white: {
    bg:        '#ffffff',
    text:      PURPLE_900,
    textMuted: 'rgba(42,0,46,0.45)',
    quoteColor: PURPLE_700,
    qrDark:    PURPLE_900,
  },
  deep: {
    bg:        PURPLE_900,
    text:      PAPER,
    textMuted: 'rgba(251,248,241,0.45)',
    quoteColor: LIME,
    qrDark:    PAPER,
  },
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('s')
  if (!raw) return new Response('Missing scores', { status: 400 })

  let scores: {
    overall: number
    verdict: string
    subtitle: string
    tagline?: string
    dimensions: Record<string, number>
  }

  try {
    scores = JSON.parse(decodeURIComponent(raw))
  } catch {
    return new Response('Invalid scores', { status: 400 })
  }

  const rawColor   = req.nextUrl.searchParams.get('c') ?? 'lime'
  const colorKey   = (rawColor === 'random'
    ? SCHEME_KEYS[Math.floor(Math.random() * SCHEME_KEYS.length)]
    : rawColor) as SchemeKey
  const s          = SCHEMES[colorKey] ?? SCHEMES.lime
  const programName = req.nextUrl.searchParams.get('p') ?? 'Diagnóstico de Carreira Internacional'

  const qrDataUrl = await QRCode.toDataURL(
    'https://www.tramparnagringa.com.br/diagnostico',
    { width: 450, margin: 1, color: { dark: s.qrDark, light: s.bg }, errorCorrectionLevel: 'M' }
  )
  const fonts = getFonts()

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H,
        display: 'flex', flexDirection: 'column',
        backgroundColor: s.bg,
        padding: 108,
        fontFamily: 'Bricolage, system-ui, sans-serif',
      }}>

        {/* ── Main content — full bleed, text on background ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: 48 }}>
          {/* Hero quote — Instrument Serif italic */}
          <div style={{
            fontFamily: 'Serif', fontStyle: 'italic', fontWeight: 400,
            fontSize: subtitleFontSize(scores.subtitle), lineHeight: 0.95, letterSpacing: '-0.03em',
            color: s.text,
            display: 'flex', flexWrap: 'wrap',
          }}>
            {nbh(scores.subtitle)}
          </div>

          {/* Tagline — Bricolage sans-serif, all caps */}
          {scores.tagline && (
            <div style={{
              fontFamily: 'Bricolage, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 34, lineHeight: 1.4,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: s.quoteColor,
              marginTop: 32,
              maxWidth: '80%',
              display: 'flex', flexWrap: 'wrap',
            }}>
              {nbh(scores.tagline)}
            </div>
          )}
        </div>

        {/* ── Bottom: CTA + logo + QR ─────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>

          {/* Left: CTA text + logo wordmark */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {splitProgramName(programName).map((line: string, i: number) => (
                <span key={i} style={{
                  fontSize: 36, fontWeight: 800,
                  color: s.text, letterSpacing: '-0.02em', lineHeight: 1.15,
                  display: 'flex',
                }}>
                  {line}
                </span>
              ))}
            </div>

            {/* Logo mark + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg viewBox="0 0 200 200" width="44" height="44">
                <circle cx="100" cy="100" r="92" fill={PURPLE_700} />
                <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <g transform="rotate(15 100 100)">
                  <polygon points="100,48 134,100 66,100" fill={CORAL} />
                  <polygon points="66,100 134,100 100,152" fill="rgba(255,255,255,0.5)" />
                </g>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{
                  fontSize: 20, fontWeight: 800,
                  letterSpacing: '0.10em', textTransform: 'uppercase',
                  color: s.text, display: 'flex',
                }}>
                  Trampar na Gringa
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: s.textMuted, display: 'flex',
                }}>
                  Companion
                </span>
              </div>
            </div>
          </div>

          {/* QR code — no wrapper, color matches card bg */}
          <img src={qrDataUrl} width={180} height={180} style={{ flexShrink: 0, marginLeft: 32 }} />
        </div>

      </div>
    ),
    { width: W, height: H, fonts }
  )
}
