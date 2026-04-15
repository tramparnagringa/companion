'use client'

import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CVExperience, CVBullet } from '../types'

interface Props {
  data: CVExperience[]
  onChange: (data: CVExperience[]) => void
  onAiAction: (prompt: string) => void
}

// ── Sortable bullet ──────────────────────────────────────────────────────────

function SortableBullet({
  id,
  bullet,
  onChangeText,
  onRemove,
  onAiAction,
}: {
  id: string
  bullet: CVBullet
  onChangeText: (text: string) => void
  onRemove: () => void
  onAiAction: (prompt: string) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(bullet.text)
  const [hovered, setHovered] = useState(false)

  function commit() {
    setEditing(false)
    if (draft.trim() !== bullet.text) onChangeText(draft.trim())
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex', alignItems: 'flex-start', gap: 4,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          color: hovered ? 'var(--text3)' : 'transparent',
          fontSize: 10, padding: '5px 2px', flexShrink: 0,
          transition: 'color 0.1s', userSelect: 'none',
        }}
      >
        ⋮⋮
      </span>

      <span style={{ color: 'var(--text3)', fontSize: 12, padding: '5px 2px', flexShrink: 0 }}>•</span>

      <div style={{ flex: 1 }}>
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            rows={2}
            style={{
              width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--accent)',
              borderRadius: 'var(--rsm)', padding: '4px 7px', fontSize: 12,
              color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none',
              resize: 'vertical', lineHeight: 1.5,
            }}
          />
        ) : (
          <div
            onClick={() => { setDraft(bullet.text); setEditing(true) }}
            style={{
              fontSize: 12, color: bullet.text ? 'var(--text2)' : 'var(--text4)',
              padding: '4px 6px', borderRadius: 'var(--rsm)', cursor: 'text',
              border: '0.5px solid transparent', lineHeight: 1.5,
              transition: 'border-color 0.1s, background 0.1s',
              background: hovered ? 'var(--bg3)' : 'transparent',
              borderColor: hovered ? 'var(--border)' : 'transparent',
            }}
          >
            {bullet.text || <span style={{ color: 'var(--text4)' }}>Clique para escrever um bullet…</span>}
            {bullet.ai_generated && (
              <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--purple)', opacity: 0.7 }}>✦IA</span>
            )}
          </div>
        )}
      </div>

      {/* Actions on hover */}
      {hovered && !editing && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0, paddingTop: 3 }}>
          <button
            onClick={() => onAiAction(`Melhore este bullet do meu CV tornando-o mais impactante e quantificado:\n"${bullet.text}"`)}
            style={{
              background: 'none', border: 'none', color: 'var(--purple)', cursor: 'pointer',
              fontSize: 10, padding: '2px 4px', borderRadius: 4,
            }}
            title="Melhorar com IA"
          >
            ✦
          </button>
          <button
            onClick={onRemove}
            style={{
              background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer',
              fontSize: 13, padding: '2px 3px', borderRadius: 4,
            }}
            title="Remover"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

// ── Experience entry ─────────────────────────────────────────────────────────

function ExperienceEntry({
  entry,
  entryId,
  onChange,
  onRemove,
  onAiAction,
  dragHandle,
}: {
  entry: CVExperience
  entryId: string
  onChange: (e: CVExperience) => void
  onRemove: () => void
  onAiAction: (prompt: string) => void
  dragHandle: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)
  const [editingMeta, setEditingMeta] = useState<string | null>(null)
  const [metaDraft, setMetaDraft] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function editMeta(field: string, current: string) {
    setEditingMeta(field)
    setMetaDraft(current)
  }

  function commitMeta(field: string) {
    setEditingMeta(null)
    onChange({ ...entry, [field]: metaDraft })
  }

  function MetaField({ field, value, placeholder, style: extraStyle }: {
    field: string; value: string; placeholder: string; style?: React.CSSProperties
  }) {
    return editingMeta === field ? (
      <input
        autoFocus
        value={metaDraft}
        onChange={e => setMetaDraft(e.target.value)}
        onBlur={() => commitMeta(field)}
        onKeyDown={e => e.key === 'Enter' && commitMeta(field)}
        style={{
          background: 'var(--bg4)', border: '0.5px solid var(--accent)',
          borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font)', outline: 'none',
          ...extraStyle,
        }}
      />
    ) : (
      <span
        onClick={() => editMeta(field, value)}
        style={{
          cursor: 'text', padding: '1px 4px', borderRadius: 4,
          border: '0.5px solid transparent',
          color: value ? undefined : 'var(--text4)',
          ...extraStyle,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
      >
        {value || placeholder}
      </span>
    )
  }

  function handleBulletDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = entry.bullets.map((_, i) => `${entryId}_b${i}`)
    const oldIdx = ids.indexOf(String(active.id))
    const newIdx = ids.indexOf(String(over.id))
    if (oldIdx !== -1 && newIdx !== -1) {
      onChange({ ...entry, bullets: arrayMove(entry.bullets, oldIdx, newIdx) })
    }
  }

  function updateBullet(idx: number, text: string) {
    const updated = entry.bullets.map((b, i) => i === idx ? { ...b, text, ai_generated: false } : b)
    onChange({ ...entry, bullets: updated })
  }

  function removeBullet(idx: number) {
    onChange({ ...entry, bullets: entry.bullets.filter((_, i) => i !== idx) })
  }

  function addBullet() {
    onChange({ ...entry, bullets: [...entry.bullets, { text: '', ai_generated: false }] })
  }

  const bulletIds = entry.bullets.map((_, i) => `${entryId}_b${i}`)

  return (
    <div style={{
      border: '0.5px solid var(--border)', borderRadius: 'var(--rsm)',
      background: 'var(--bg3)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 12px',
        borderBottom: expanded ? '0.5px solid var(--border)' : 'none',
      }}>
        {dragHandle}

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <MetaField
              field="role"
              value={entry.role}
              placeholder="Software Engineer"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
            />
            <span style={{ color: 'var(--text4)', fontSize: 12 }}>@</span>
            <MetaField
              field="company"
              value={entry.company}
              placeholder="Empresa"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}
            />
            <span style={{ color: 'var(--text4)', fontSize: 11 }}>·</span>
            <MetaField
              field="period"
              value={entry.period}
              placeholder="Jan 2022 – Present"
              style={{ fontSize: 11, color: 'var(--text3)' }}
            />
            {entry.location && (
              <>
                <span style={{ color: 'var(--text4)', fontSize: 11 }}>·</span>
                <MetaField
                  field="location"
                  value={entry.location ?? ''}
                  placeholder="Localização"
                  style={{ fontSize: 11, color: 'var(--text3)' }}
                />
              </>
            )}
            {!entry.location && (
              <button
                onClick={() => editMeta('location', '')}
                style={{
                  background: 'none', border: 'none', fontSize: 10, color: 'var(--text4)',
                  cursor: 'pointer', padding: '1px 4px',
                }}
              >
                + local
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => onAiAction(`Reescreva os bullets desta experiência de forma mais impactante para o mercado internacional. Cargo: "${entry.role}" na empresa "${entry.company}" (${entry.period}). Bullets atuais:\n${entry.bullets.map(b => `- ${b.text}`).join('\n')}`)}
            style={{ background: 'none', border: 'none', color: 'var(--purple)', cursor: 'pointer', fontSize: 11, padding: '3px 5px', borderRadius: 4, opacity: 0.7 }}
            title="Melhorar com IA"
          >
            ✦
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: '3px 5px' }}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: '3px 4px' }}
            title="Remover experiência"
          >
            ×
          </button>
        </div>
      </div>

      {/* Bullets */}
      {expanded && (
        <div style={{ padding: '10px 12px' }}>
          <DndContext id={`exp-bullets-${entryId}`} sensors={sensors} onDragEnd={handleBulletDragEnd}>
            <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {entry.bullets.map((bullet, idx) => (
                  <SortableBullet
                    key={bulletIds[idx]}
                    id={bulletIds[idx]}
                    bullet={bullet}
                    onChangeText={text => updateBullet(idx, text)}
                    onRemove={() => removeBullet(idx)}
                    onAiAction={onAiAction}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={addBullet}
            style={{
              marginTop: 6, fontSize: 11, color: 'var(--text3)', background: 'none',
              border: '0.5px dashed var(--border2)', borderRadius: 'var(--rsm)',
              padding: '3px 10px', cursor: 'pointer',
            }}
          >
            + bullet
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sortable experience wrapper ──────────────────────────────────────────────

function SortableExperience({
  id,
  entry,
  onChange,
  onRemove,
  onAiAction,
}: {
  id: string
  entry: CVExperience
  onChange: (e: CVExperience) => void
  onRemove: () => void
  onAiAction: (prompt: string) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const dragHandle = (
    <span
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', color: 'var(--text4)', fontSize: 11, padding: '0 2px' }}
    >
      ⋮⋮
    </span>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <ExperienceEntry
        entry={entry}
        entryId={id}
        onChange={onChange}
        onRemove={onRemove}
        onAiAction={onAiAction}
        dragHandle={dragHandle}
      />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function ExperienceSection({ data, onChange, onAiAction }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = data.map((_, i) => `exp_${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = ids.indexOf(String(active.id))
    const newIdx = ids.indexOf(String(over.id))
    if (oldIdx !== -1 && newIdx !== -1) onChange(arrayMove(data, oldIdx, newIdx))
  }

  function updateEntry(idx: number, entry: CVExperience) {
    onChange(data.map((e, i) => i === idx ? entry : e))
  }

  function removeEntry(idx: number) {
    onChange(data.filter((_, i) => i !== idx))
  }

  function addEntry() {
    onChange([...data, {
      role: '',
      company: '',
      period: '',
      bullets: [{ text: '', ai_generated: false }],
    }])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Experiência Profissional
        </span>
        <button
          onClick={() => onAiAction('Analise todas as experiências profissionais do meu CV e sugira como melhorar os bullets para serem mais impactantes e ATS-friendly no mercado internacional.')}
          style={{ fontSize: 11, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', opacity: 0.7 }}
          title="Melhorar com IA"
        >
          ✦
        </button>
      </div>

      <DndContext id="experience-entries" sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.map((entry, idx) => (
              <SortableExperience
                key={ids[idx]}
                id={ids[idx]}
                entry={entry}
                onChange={e => updateEntry(idx, e)}
                onRemove={() => removeEntry(idx)}
                onAiAction={onAiAction}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={addEntry}
        style={{
          marginTop: 6, alignSelf: 'flex-start', fontSize: 11, color: 'var(--text3)',
          background: 'none', border: '0.5px dashed var(--border2)', borderRadius: 'var(--rsm)',
          padding: '4px 10px', cursor: 'pointer',
        }}
      >
        + experiência
      </button>
    </div>
  )
}
