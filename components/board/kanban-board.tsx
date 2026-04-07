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
  { id: 'to_analyse',   label: 'Analisar',    color: 'var(--text3)' },
  { id: 'analysing',    label: 'Analisando',  color: 'var(--purple)' },
  { id: 'applied',      label: 'Aplicado',    color: 'var(--accent)' },
  { id: 'interviewing', label: 'Entrevista',  color: '#60a5fa' },
  { id: 'offer',        label: 'Oferta',      color: 'var(--green)' },
  { id: 'discarded',    label: 'Descartado',  color: 'var(--red)' },
]

const COLUMN_IDS = new Set(COLUMNS.map(c => c.id))

// ─── Collision detection ──────────────────────────────────────────────────────
// Try pointer-within first (accurate when hovering a rect),
// fall back to rect intersection (catches edges and empty columns).

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fitColor(score: number | null): string {
  if (!score) return 'var(--text4)'
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return 'var(--orange)'
  return 'var(--red)'
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

  const statusBorder = status === 'offer'
    ? 'rgba(74, 222, 128, 0.25)'
    : status === 'discarded'
      ? 'rgba(248, 113, 113, 0.25)'
      : 'var(--border)'

  return (
    <div style={{
      background: isDragging ? 'var(--bg3)' : 'var(--bg2)',
      border: `0.5px solid ${isDragging ? 'var(--accent)' : statusBorder}`,
      borderRadius: 'var(--r)',
      padding: '11px 12px',
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.95 : 1,
      boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
      userSelect: 'none',
    }}>

      {/* Company — headline */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'var(--text1)',
        marginBottom: 2, lineHeight: 1.3,
      }}>
        {job.company_name}
      </div>

      {/* Role — secondary */}
      <div style={{
        fontSize: 11, color: 'var(--text3)',
        marginBottom: hasTags || hasFit || showDate ? 8 : 0,
        lineHeight: 1.4,
      }}>
        {job.role_title}
      </div>

      {/* Tags */}
      {hasTags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: hasFit || showDate ? 8 : 0 }}>
          {strong.map(kw => (
            <span key={kw} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: 'var(--purple-dim)', color: 'var(--purple)',
              fontWeight: 500,
            }}>
              {kw}
            </span>
          ))}
          {weak.map(kw => (
            <span key={kw} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: 'var(--orange-dim)', color: 'var(--orange)',
              fontWeight: 500,
            }}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Fit score bar */}
      {hasFit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: showDate ? 6 : 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)',
            color: fitColor(job.fit_score), minWidth: 28,
          }}>
            {job.fit_score}%
          </span>
          <div style={{ flex: 1, height: 2, background: 'var(--bg4)', borderRadius: 1 }}>
            <div style={{
              height: '100%', borderRadius: 1,
              width: `${job.fit_score}%`,
              background: fitColor(job.fit_score),
            }} />
          </div>
        </div>
      )}

      {/* Applied date */}
      {showDate && (
        <div style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>
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
        marginBottom: 7,
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
    width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    borderRadius: 'var(--rsm)', padding: '6px 8px', color: 'var(--text1)',
    fontSize: 12, fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div ref={formRef} style={{
      background: 'var(--bg2)', border: '0.5px solid var(--accent)',
      borderRadius: 'var(--r)', padding: '10px 11px', marginBottom: 7,
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
        style={{ ...inputStyle, marginBottom: 6, fontWeight: 600, fontSize: 13 }}
      />
      <input
        placeholder="Cargo"
        value={role}
        onChange={e => setRole(e.target.value)}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
        <button
          onClick={() => company.trim() && onSave(company.trim(), role.trim())}
          style={{
            flex: 1, padding: '5px 0', background: 'var(--accent)', color: 'var(--accent-text)',
            border: 'none', borderRadius: 'var(--rsm)', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font)',
            opacity: company.trim() ? 1 : 0.4,
          }}
        >
          Adicionar
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '5px 10px', background: 'none', color: 'var(--text3)',
            border: '0.5px solid var(--border)', borderRadius: 'var(--rsm)',
            fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)',
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
    <div style={{ width: 195, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 500,
        marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ color: col.color }}>{col.label}</span>
        <span style={{
          fontSize: 10, background: 'var(--bg3)', color: 'var(--text3)',
          padding: '1px 6px', borderRadius: 10,
        }}>
          {jobs.length}
        </span>
      </div>

      {/* Add button or form — always at the top of the column */}
      <div style={{ flexShrink: 0, marginBottom: isAdding || jobs.length > 0 ? 7 : 0 }}>
        {isAdding ? (
          <NewCardForm defaultRole={defaultRole} onSave={onSave} onCancel={onCancel} />
        ) : (
          <button
            onClick={onAdd}
            style={{
              padding: '6px 10px', background: 'none', border: 'none',
              color: 'var(--text4)', fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Adicionar
          </button>
        )}
      </div>

      {/* Full-height droppable area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          borderRadius: 'var(--r)',
          border: isOver ? '0.5px dashed var(--accent)' : '0.5px solid transparent',
          background: isOver ? 'var(--accent-dim)' : 'transparent',
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
            height: 60, border: '0.5px dashed var(--border2)',
            borderRadius: 'var(--r)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text4)', fontSize: 11,
          }}>
            —
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

  // Sync job list when shell removes/updates jobs (archive, edit)
  useEffect(() => {
    setJobs(initialJobs)
  }, [initialJobs])

  // Sync single job update from detail drawer
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

  // Given an over.id (column or card), return the column id
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
      // Reorder within column
      if (activeId === overId) return
      setJobs(prev => {
        const oldIndex = prev.findIndex(j => j.id === activeId)
        const newIndex = prev.findIndex(j => j.id === overId)
        // overId might be the column itself (dropped at end) — append
        if (newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    } else {
      // Move to different column — optimistic update
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
      <div style={{ display: 'flex', gap: 10, minWidth: 'max-content', height: '100%' }}>
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
      <div style={{ display: 'flex', gap: 10, minWidth: 'max-content', height: '100%' }}>
        {columns}
      </div>

      <DragOverlay>
        {activeJob && <JobCard job={activeJob} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
