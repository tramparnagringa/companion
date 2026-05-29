'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import {
  bold, italic, unorderedListCommand, orderedListCommand, divider,
} from '@uiw/react-md-editor'

const MDEditor = dynamic(() => import('@uiw/react-md-editor').then(m => m.default), {
  ssr: false,
  loading: () => (
    <textarea style={{
      width: '100%', minHeight: 80, padding: '7px 10px',
      borderRadius: 6, background: '#FBF8F1',
      border: '1px solid #D9D0BD', color: '#141414',
      fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
    }} />
  ),
})

// Cream palette overrides — injected as CSS variables on the wrapper
const creamVars: React.CSSProperties = {
  '--color-canvas-default':      '#FBF8F1',
  '--color-canvas-subtle':       '#EFE7D4',
  '--color-border-default':      '#D9D0BD',
  '--color-border-muted':        '#D9D0BD',
  '--color-fg-default':          '#141414',
  '--color-fg-muted':            '#6E665B',
  '--color-neutral-muted':       '#EFE7D4',
  '--color-accent-fg':           '#430049',
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid #D9D0BD',
} as React.CSSProperties

// Minimal toolbar — just the essentials
const TOOLBAR = [bold, italic, divider, unorderedListCommand, orderedListCommand]

interface Props {
  value: string
  onChange: (val: string) => void
  minHeight?: number
}

export function MarkdownField({ value, onChange, minHeight = 120 }: Props) {
  return (
    <div data-color-mode="light" style={creamVars}>
      <MDEditor
        value={value}
        onChange={val => onChange(val ?? '')}
        preview="edit"
        height={minHeight}
        visibleDragbar={false}
        commands={TOOLBAR}
        extraCommands={[]}
        style={{ fontSize: 13, background: 'transparent' }}
      />
    </div>
  )
}
