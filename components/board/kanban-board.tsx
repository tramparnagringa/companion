'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateJobStatus, createJob, type JobStatus } from '@/app/actions/jobs'

// ─── Types ───────────────────────────────────────────────────────────────────

import type { Job } from './job-detail'

const COLUMNS: { id: JobStatus; label: string; color: string }[] = [
  { id: 'to_analyse',   label: 'Analisar',    color: 'var(--tng-ink-3)' },
  { id: 'analysing',    label: 'Analisando',  color: 'var(--tng-purple-700)' },
  { id: 'applied',      label: 'Aplicado',    color: 'var(--tng-info)' },
  { id: 'interviewing', label: 'Entrevista',  color: 'var(--tng-warn)' },
  { id: 'offer',        label: 'Oferta',      color: 'var(--tng-success)' },
  { id: 'discarded',    label: 'Descartado',  color: 'var(--tng-danger)' },
]

const COLUMN_IDS = new Set(COLUMNS.map(c => c.id))

const STATUS_COLOR: Record<JobStatus, string> = Object.fromEntries(
  COLUMNS.map(c => [c.id, c.color])
) as Record<JobStatus, string>

// ─── Collision detection ──────────────────────────────────────────────────────

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fitColor(score: number | null): string {
  if (!score) return 'var(--tng-mute)'
  if (score >= 80) return 'var(--tng-success)'
  if (score >= 60) return 'var(--tng-warn)'
  return 'var(--tng-danger)'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// Tags visíveis por coluna: quantas strong / quantas weak
const TAG_QUOTA: Record<JobStatus, [number, number]> = {
  to_analyse:   [0, 0],
  analysing:    [2, 1],
  applied:      [3, 1],
  interviewing: [4, 2],
  offer:        [4, 2],
  discarded:    [2, 1],
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, isDragging = false }: { job: Job; isDragging?: boolean }) {
  const status = job.status as JobStatus
  const [strongLimit, weakLimit] = TAG_QUOTA[status] ?? [0, 0]
  const strong = job.strong_keywords?.slice(0, strongLimit) ?? []
  const weak   = job.weak_keywords?.slice(0, weakLimit) ?? []
  const hasTags = strong.length > 0 || weak.length > 0
  const hasFit  = job.fit_score !== null && status !== 'to_analyse'
  const showDate = (status === 'applied' || status === 'interviewing' || status === 'offer') && job.applied_at

  const accentColor = STATUS_COLOR[status] ?? 'var(--tng-rule)'

  return (
    <div style={{
      background: isDragging ? 'var(--tng-bone)' : 'var(--tng-paper)',
      border: `0.5px solid ${isDragging ? 'var(--tng-purple-700)' : 'var(--tng-rule)'}`,
      borderLeft: `3px solid ${isDragging ? 'var(--tng-purple-700)' : accentColor}`,
      borderRadius: 'var(--tng-radius-md)',
      padding: '18px 20px',
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.95 : 1,
      boxShadow: isDragging
        ? '0 12px 32px rgba(20,15,8,0.18)'
        : '0 1px 4px rgba(20,15,8,0.06)',
      userSelect: 'none',
      transition: 'box-shadow 120ms, border-color 120ms',
    }}>

      {/* Company — headline */}
      <div style={{
        fontSize: 19, fontWeight: 700, color: 'var(--tng-ink)',
        marginBottom: 4, lineHeight: 1.15,
        fontFamily: 'var(--tng-font-display)',
        letterSpacing: '-0.02em',
      }}>
        {job.company_name}
      </div>

      {/* Role — secondary */}
      <div style={{
        fontSize: 13, color: 'var(--tng-ink-2)',
        marginBottom: hasTags || hasFit || showDate ? 14 : 0,
        lineHeight: 1.4,
      }}>
        {job.role_title}
      </div>

      {/* Tags */}
      {hasTags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: hasFit || showDate ? 12 : 0 }}>
          {strong.map(kw => (
            <span key={kw} style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 'var(--tng-radius-pill)',
              background: 'var(--tng-purple-100)', color: 'var(--tng-purple-700)',
              fontWeight: 600, fontFamily: 'var(--tng-font-mono)',
              border: '0.5px solid var(--tng-purple-300)',
            }}>
              {kw}
            </span>
          ))}
          {weak.map(kw => (
            <span key={kw} style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 'var(--tng-radius-pill)',
              background: 'rgba(255,107,53,0.08)', color: 'var(--tng-coral-text)',
              fontWeight: 600, fontFamily: 'var(--tng-font-mono)',
              border: '0.5px solid rgba(255,107,53,0.2)',
            }}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Fit score bar */}
      {hasFit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: showDate ? 10 : 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, fontFamily: 'var(--tng-font-mono)',
            color: fitColor(job.fit_score), minWidth: 36,
          }}>
            {job.fit_score}%
          </span>
          <div style={{ flex: 1, height: 4, background: 'var(--tng-rule)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${job.fit_score}%`,
              background: fitColor(job.fit_score),
              transition: 'width 400ms var(--tng-ease-out)',
            }} />
          </div>
        </div>
      )}

      {/* Applied date */}
      {showDate && (
        <div style={{
          fontSize: 11, color: 'var(--tng-mute)',
          fontFamily: 'var(--tng-font-mono)',
          letterSpacing: '0.04em',
        }}>
          aplicado {formatDate(job.applied_at)}
        </div>
      )}
    </div>
  )
}

// ─── Sortable Job Card ────────────────────────────────────────────────────────

function SortableJobCard({ job, onSelect }: { job: Job; onSelect: (j: Job) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { colId: job.status },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: 14,
        opacity: isDragging ? 0.3 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={() => { if (!isDragging) onSelect(job) }}
    >
      <JobCard job={job} />
    </div>
  )
}

// ─── New Card Form ────────────────────────────────────────────────────────────

function NewCardForm({ defaultRole, onSave, onCancel }: {
  defaultRole: string
  onSave: (company: string, role: string) => void
  onCancel: () => void
}) {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState(defaultRole)
  const companyRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => { companyRef.current?.focus() }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) onCancel()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCancel])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onCancel(); return }
    if (e.key === 'Enter' && company.trim()) onSave(company.trim(), role.trim())
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--tng-cream)',
    border: '0.5px solid var(--tng-rule)',
    borderRadius: 'var(--tng-radius-xs)', padding: '7px 10px',
    color: 'var(--tng-ink)', fontSize: 13,
    fontFamily: 'var(--tng-font-body)', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div ref={formRef} style={{
      background: 'var(--tng-paper)', border: '0.5px solid var(--tng-purple-700)',
      borderRadius: 'var(--tng-radius-md)', padding: '16px 18px', marginBottom: 12,
    }}>
      <input
        ref={companyRef}
        placeholder="Empresa"
        value={company}
        onChange={e => setCompany(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') { onCancel(); return }
          if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault()
            ;(formRef.current?.querySelector('input:last-of-type') as HTMLInputElement)?.focus()
          }
        }}
        style={{ ...inputStyle, marginBottom: 7, fontWeight: 700, fontSize: 15,
          fontFamily: 'var(--tng-font-display)', letterSpacing: '-0.01em' }}
      />
      <input
        placeholder="Cargo"
        value={role}
        onChange={e => setRole(e.target.value)}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button
          onClick={() => company.trim() && onSave(company.trim(), role.trim())}
          style={{
            flex: 1, padding: '7px 0',
            background: 'var(--tng-purple-700)', color: 'var(--tng-cream)',
            border: 'none', borderRadius: 'var(--tng-radius-xs)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--tng-font-body)',
            opacity: company.trim() ? 1 : 0.4,
            transition: 'opacity 120ms',
          }}
        >
          Adicionar
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 12px', background: 'none', color: 'var(--tng-ink-3)',
            border: '0.5px solid var(--tng-rule)', borderRadius: 'var(--tng-radius-xs)',
            fontSize: 12, cursor: 'pointer', fontFamily: 'var(--tng-font-body)',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({ col, jobs, isOver, isAdding, defaultRole, onAdd, onSave, onCancel, onSelectJob }: {
  col: { id: JobStatus; label: string; color: string }
  jobs: Job[]
  isOver: boolean
  isAdding: boolean
  defaultRole: string
  onAdd: () => void
  onSave: (company: string, role: string) => void
  onCancel: () => void
  onSelectJob: (j: Job) => void
}) {
  const { setNodeRef } = useDroppable({ id: col.id })

  return (
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Column header */}
      <div style={{ flexShrink: 0, marginBottom: 16, paddingBottom: 14, borderBottom: `2px solid ${col.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 15, fontWeight: 700, color: col.color,
            fontFamily: 'var(--tng-font-display)',
            letterSpacing: '-0.02em',
          }}>
            {col.label}
          </span>
          <span style={{
            fontSize: 11, fontFamily: 'var(--tng-font-mono)',
            color: 'var(--tng-ink-3)',
            background: 'var(--tng-bone)',
            padding: '2px 9px', borderRadius: 'var(--tng-radius-pill)',
            border: '0.5px solid var(--tng-rule)',
          }}>
            {jobs.length}
          </span>
        </div>
      </div>

      {/* Add button or form */}
      <div style={{ flexShrink: 0, marginBottom: isAdding || jobs.length > 0 ? 12 : 0 }}>
        {isAdding ? (
          <NewCardForm defaultRole={defaultRole} onSave={onSave} onCancel={onCancel} />
        ) : (
          <button
            onClick={onAdd}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'none', border: '0.5px dashed var(--tng-rule)',
              borderRadius: 'var(--tng-radius-sm)',
              color: 'var(--tng-mute)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'var(--tng-font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'border-color 120ms, color 120ms',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--tng-purple-700)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--tng-purple-700)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--tng-rule)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--tng-mute)'
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>
            Adicionar vaga
          </button>
        )}
      </div>

      {/* Full-height droppable area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          borderRadius: 'var(--tng-radius-sm)',
          border: isOver ? '0.5px dashed var(--tng-purple-700)' : '0.5px solid transparent',
          background: isOver ? 'var(--tng-purple-100)' : 'transparent',
          padding: 4,
          overflowY: 'auto',
          transition: 'border-color 0.12s, background 0.12s',
        }}
      >
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map(job => (
            <SortableJobCard key={job.id} job={job} onSelect={onSelectJob} />
          ))}
        </SortableContext>

        {jobs.length === 0 && !isOver && (
          <div style={{
            padding: '32px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6,
          }}>
            <div style={{ fontSize: 20, color: 'var(--tng-rule)' }}>◈</div>
            <div style={{ fontSize: 11, color: 'var(--tng-mute)', textAlign: 'center', lineHeight: 1.5 }}>
              Nenhuma vaga aqui
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Board ──────────────────────────────────────────────────────────────

export function KanbanBoard({ initialJobs, defaultRole, addingToColumn, onSetAdding, onJobAdded, onSelectJob, updatedJob }: {
  initialJobs: Job[]
  defaultRole: string
  addingToColumn: JobStatus | null
  onSetAdding: (col: JobStatus | null) => void
  onJobAdded: (job: Job) => void
  onSelectJob: (job: Job) => void
  updatedJob: Job | null
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [overColumn, setOverColumn] = useState<JobStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => { setJobs(initialJobs) }, [initialJobs])

  useEffect(() => {
    if (!updatedJob) return
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j))
  }, [updatedJob])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const jobsByStatus = useCallback(
    (status: JobStatus) => jobs.filter(j => j.status === status),
    [jobs]
  )

  async function handleSaveNewJob(colId: JobStatus, company: string, role: string) {
    onSetAdding(null)
    const saved = await createJob(company, role, colId)
    const newJob = saved as unknown as Job
    setJobs(prev => [newJob, ...prev])
    onJobAdded(newJob)
  }

  function resolveColumn(overId: string): JobStatus | null {
    if (COLUMN_IDS.has(overId as JobStatus)) return overId as JobStatus
    return jobs.find(j => j.id === overId)?.status as JobStatus ?? null
  }

  function handleDragStart(event: DragStartEvent) {
    const job = jobs.find(j => j.id === event.active.id)
    if (job) setActiveJob(job)
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over ? String(event.over.id) : null
    setOverColumn(overId ? resolveColumn(overId) : null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveJob(null)
    setOverColumn(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const draggedJob = jobs.find(j => j.id === activeId)
    if (!draggedJob) return

    const targetColId = resolveColumn(overId)
    if (!targetColId) return

    const isSameColumn = draggedJob.status === targetColId

    if (isSameColumn) {
      if (activeId === overId) return
      setJobs(prev => {
        const oldIndex = prev.findIndex(j => j.id === activeId)
        const newIndex = prev.findIndex(j => j.id === overId)
        if (newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    } else {
      const snapshot = jobs
      setJobs(prev => prev.map(j =>
        j.id === activeId ? { ...j, status: targetColId } : j
      ))
      updateJobStatus(activeId, targetColId).catch(() => {
        setJobs(snapshot)
      })
    }
  }

  const columns = COLUMNS.map(col => (
    <Column
      key={col.id}
      col={col}
      jobs={jobsByStatus(col.id)}
      isOver={overColumn === col.id}
      isAdding={addingToColumn === col.id}
      defaultRole={defaultRole}
      onAdd={() => onSetAdding(col.id)}
      onSave={(company, role) => handleSaveNewJob(col.id, company, role)}
      onCancel={() => onSetAdding(null)}
      onSelectJob={onSelectJob}
    />
  ))

  if (!mounted) {
    return (
      <div style={{ display: 'flex', gap: 20, minWidth: 'max-content', height: '100%' }}>
        {columns}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 20, minWidth: 'max-content', height: '100%', padding: '28px 36px 0'}}>
        {columns}
      </div>

      <DragOverlay>
        {activeJob && <JobCard job={activeJob} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
