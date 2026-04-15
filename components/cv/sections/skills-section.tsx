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
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CVSkillCategory } from '../types'

interface SkillsData {
  primary: CVSkillCategory
  adjacent: CVSkillCategory[]
}

interface Props {
  data: SkillsData
  onChange: (data: SkillsData) => void
  onAiAction: (prompt: string) => void
}

// ── Sortable skill chip ──────────────────────────────────────────────────────

function SortableSkill({
  id, label, onRemove,
}: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex', alignItems: 'center', gap: 3,
        background: 'var(--bg4)', border: '0.5px solid var(--border2)',
        borderRadius: 20, padding: '3px 8px 3px 6px',
        fontSize: 11, color: 'var(--text2)',
        userSelect: 'none',
      }}
    >
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', color: 'var(--text4)', fontSize: 9, lineHeight: 1 }}
      >
        ⋮⋮
      </span>
      {label}
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}

// ── Skill category ───────────────────────────────────────────────────────────

function SkillCategory({
  category,
  categoryId,
  onChangeArea,
  onChangeItems,
  onAiAction,
  dragHandle,
}: {
  category: CVSkillCategory
  categoryId: string
  onChangeArea: (v: string) => void
  onChangeItems: (items: string[]) => void
  onAiAction: (prompt: string) => void
  dragHandle: React.ReactNode
}) {
  const [editingArea, setEditingArea] = useState(false)
  const [areaDraft, setAreaDraft] = useState(category.area)
  const [newSkill, setNewSkill] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleSkillDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = category.items.indexOf(String(active.id))
    const newIdx = category.items.indexOf(String(over.id))
    if (oldIdx !== -1 && newIdx !== -1) {
      onChangeItems(arrayMove(category.items, oldIdx, newIdx))
    }
  }

  function addSkill() {
    const trimmed = newSkill.trim()
    if (trimmed && !category.items.includes(trimmed)) {
      onChangeItems([...category.items, trimmed])
    }
    setNewSkill('')
  }

  return (
    <div style={{
      background: 'var(--bg3)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--rsm)', padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {dragHandle}
        {editingArea ? (
          <input
            autoFocus
            value={areaDraft}
            onChange={e => setAreaDraft(e.target.value)}
            onBlur={() => { setEditingArea(false); onChangeArea(areaDraft) }}
            onKeyDown={e => e.key === 'Enter' && (setEditingArea(false), onChangeArea(areaDraft))}
            style={{
              background: 'var(--bg4)', border: '0.5px solid var(--accent)',
              borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600,
              color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', flex: 1,
            }}
          />
        ) : (
          <span
            onClick={() => setEditingArea(true)}
            style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text2)', cursor: 'text',
              flex: 1, padding: '2px 4px', borderRadius: 4,
              border: '0.5px solid transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          >
            {category.area || 'Categoria'}
          </span>
        )}
        <button
          onClick={() => onAiAction(`Sugira mais skills relevantes para a categoria "${category.area}" do meu CV, considerando meu cargo alvo e stack tecnológico.`)}
          style={{ fontSize: 10, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px', opacity: 0.7 }}
          title="Sugerir skills com IA"
        >
          ✦
        </button>
      </div>

      <DndContext id={`skills-chips-${categoryId}`} sensors={sensors} onDragEnd={handleSkillDragEnd}>
        <SortableContext items={category.items} strategy={horizontalListSortingStrategy}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {category.items.map(skill => (
              <SortableSkill
                key={skill}
                id={skill}
                label={skill}
                onRemove={() => onChangeItems(category.items.filter(s => s !== skill))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSkill()}
          placeholder="+ skill"
          style={{
            flex: 1, background: 'transparent', border: '0.5px dashed var(--border2)',
            borderRadius: 'var(--rsm)', padding: '3px 8px', fontSize: 11,
            color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none',
          }}
        />
        <button
          onClick={addSkill}
          style={{
            background: 'var(--bg4)', border: '0.5px solid var(--border2)',
            borderRadius: 'var(--rsm)', padding: '3px 8px', fontSize: 11,
            color: 'var(--text2)', cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ── Sortable category wrapper ────────────────────────────────────────────────

function SortableCategory({
  id,
  category,
  onChangeArea,
  onChangeItems,
  onAiAction,
}: {
  id: string
  category: CVSkillCategory
  onChangeArea: (v: string) => void
  onChangeItems: (items: string[]) => void
  onAiAction: (prompt: string) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const dragHandle = (
    <span
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', color: 'var(--text4)', fontSize: 10, padding: '0 2px' }}
    >
      ⋮⋮
    </span>
  )

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <SkillCategory
        category={category}
        categoryId={id}
        onChangeArea={onChangeArea}
        onChangeItems={onChangeItems}
        onAiAction={onAiAction}
        dragHandle={dragHandle}
      />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function SkillsSection({ data, onChange, onAiAction }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allCategories = [
    { id: '__primary', cat: data.primary },
    ...data.adjacent.map((cat, i) => ({ id: `adj_${i}`, cat })),
  ]

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const ids = allCategories.map(c => c.id)
    const oldIdx = ids.indexOf(String(active.id))
    const newIdx = ids.indexOf(String(over.id))
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(allCategories, oldIdx, newIdx)
    const [newPrimary, ...newAdjacent] = reordered.map(c => c.cat)
    onChange({ primary: newPrimary, adjacent: newAdjacent })
  }

  function updatePrimaryItems(items: string[]) {
    onChange({ ...data, primary: { ...data.primary, items } })
  }

  function updatePrimaryArea(area: string) {
    onChange({ ...data, primary: { ...data.primary, area } })
  }

  function updateAdjacentItems(idx: number, items: string[]) {
    const updated = data.adjacent.map((c, i) => i === idx ? { ...c, items } : c)
    onChange({ ...data, adjacent: updated })
  }

  function updateAdjacentArea(idx: number, area: string) {
    const updated = data.adjacent.map((c, i) => i === idx ? { ...c, area } : c)
    onChange({ ...data, adjacent: updated })
  }

  function addCategory() {
    onChange({ ...data, adjacent: [...data.adjacent, { area: 'Nova Categoria', items: [] }] })
  }

  function removeAdjacent(idx: number) {
    onChange({ ...data, adjacent: data.adjacent.filter((_, i) => i !== idx) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Skills
        </span>
        <button
          onClick={() => onAiAction('Analise as skills do meu CV e sugira como reorganizá-las e complementá-las para o mercado internacional no meu cargo alvo.')}
          style={{ fontSize: 11, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', opacity: 0.7 }}
          title="Melhorar com IA"
        >
          ✦
        </button>
      </div>

      <DndContext id="skills-categories" sensors={sensors} onDragEnd={handleCategoryDragEnd}>
        <SortableContext items={allCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SortableCategory
              id="__primary"
              category={data.primary}
              onChangeArea={updatePrimaryArea}
              onChangeItems={updatePrimaryItems}
              onAiAction={onAiAction}
            />
            {data.adjacent.map((cat, idx) => (
              <div key={`adj_${idx}`} style={{ position: 'relative' }}>
                <SortableCategory
                  id={`adj_${idx}`}
                  category={cat}
                  onChangeArea={v => updateAdjacentArea(idx, v)}
                  onChangeItems={items => updateAdjacentItems(idx, items)}
                  onAiAction={onAiAction}
                />
                <button
                  onClick={() => removeAdjacent(idx)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'none', border: 'none', color: 'var(--text4)',
                    cursor: 'pointer', fontSize: 14, padding: '0 2px',
                  }}
                  title="Remover categoria"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={addCategory}
        style={{
          marginTop: 6, alignSelf: 'flex-start', fontSize: 11, color: 'var(--text3)',
          background: 'none', border: '0.5px dashed var(--border2)', borderRadius: 'var(--rsm)',
          padding: '4px 10px', cursor: 'pointer',
        }}
      >
        + categoria
      </button>
    </div>
  )
}
