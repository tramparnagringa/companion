'use client'

import { useState, useEffect, useRef, useCallback, createContext, useContext, forwardRef } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CVContent, CVExperience, CVSkillCategory } from './types'
import styles from './cv-document.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const DOC_WIDTH = 794
const PANEL_PADDING_H = 64

const SECTION_LABELS: Record<string, string> = {
  summary:    'Summary',
  skills:     'Skillset',
  experience: 'Professional Experience',
  education:  'Education',
  languages:  'Languages',
  projects:   'Projects',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// ── Print mode context ────────────────────────────────────────────────────────
// When true, form elements render as plain text so the browser
// doesn't clip or mis-size them in the print preview.

const PrintCtx = createContext(false)

/** Drop-in replacement for <input> that renders a <span> when printing */
function PI({ className, value, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  const printing = useContext(PrintCtx)
  if (printing) return <span className={className}>{String(value ?? '')}</span>
  return <input value={value} className={className} {...rest} />
}

/** Drop-in replacement for <textarea> that renders a <div> when printing */
const PT = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function PT({ className, value, ...rest }, ref) {
    const printing = useContext(PrintCtx)
    if (printing) {
      return (
        <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {String(value ?? '')}
        </div>
      )
    }
    return (
      <textarea
        ref={el => {
          // Re-run autoResize on every mount — covers the after-print restore case
          // where the parent useEffect won't fire because content hasn't changed.
          if (el) setTimeout(() => autoResize(el), 0)
          if (typeof ref === 'function') ref(el)
          else if (ref) (ref as React.RefObject<HTMLTextAreaElement | null>).current = el
        }}
        value={value}
        className={className}
        {...rest}
      />
    )
  }
)

// Flatten primary + adjacent into a uniform array for the UI
function flattenSkills(skills: CVContent['skills']): CVSkillCategory[] {
  return [skills.primary, ...skills.adjacent]
}

// Map flat array back to primary + adjacent
function unflattenSkills(cats: CVSkillCategory[]): CVContent['skills'] {
  const [primary = { area: 'Technical Skills', items: [] }, ...adjacent] = cats
  return { primary, adjacent }
}

// ── Header ────────────────────────────────────────────────────────────────────

function CvHeader({
  personal,
  onChange,
}: {
  personal: CVContent['personal']
  onChange: (p: CVContent['personal']) => void
}) {
  function contactField(key: keyof typeof personal, placeholder: string, minSize: number) {
    const val = personal[key] ?? ''
    return (
      <PI
        className={`${styles.field} ${styles.headerContactField}`}
        value={val}
        onChange={e => onChange({ ...personal, [key]: (e as React.ChangeEvent<HTMLInputElement>).target.value })}
        placeholder={placeholder}
        size={Math.max(minSize, val.length)}
      />
    )
  }

  const hasWebLink = personal.website !== undefined || personal.github !== undefined

  return (
    <div className={styles.header}>
      {/* Name */}
      <PI
        className={`${styles.field} ${styles.headerName}`}
        value={personal.full_name ?? ''}
        onChange={e => onChange({ ...personal, full_name: e.target.value })}
        placeholder="Full Name"
      />

      {/* Position */}
      <PI
        className={`${styles.field} ${styles.headerPosition}`}
        value={personal.position ?? ''}
        onChange={e => onChange({ ...personal, position: e.target.value })}
        placeholder="Job Title"
      />

      {/* Location */}
      <div className={styles.headerLine}>
        {contactField('location', 'City, Country', 14)}
      </div>

      {/* Phone | Email */}
      <div className={styles.headerLine}>
        {contactField('phone', '+XX XXX XXX XXXX', 16)}
        <span className={styles.separator}>|</span>
        {contactField('email', 'email@example.com', 20)}
      </div>

      {/* LinkedIn | Website */}
      <div className={styles.headerLine}>
        {contactField('linkedin', 'linkedin.com/in/username', 24)}
        {hasWebLink && <>
          <span className={styles.separator}>|</span>
          {personal.website !== undefined
            ? contactField('website', 'yoursite.com', 14)
            : contactField('github', 'github.com/username', 18)
          }
        </>}
      </div>
    </div>
  )
}

// ── Summary ───────────────────────────────────────────────────────────────────

function CvSummary({
  summary,
  onChange,
}: {
  summary: string[]
  onChange: (s: string[]) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const text = summary.join('\n\n')

  useEffect(() => { autoResize(textareaRef.current) }, [text])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    autoResize(e.target)
    const val = e.target.value
    const paragraphs = val.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    onChange(paragraphs.length > 0 ? paragraphs : [''])
  }

  return (
    <PT
      ref={textareaRef}
      className={`${styles.field} ${styles.summaryTextarea}`}
      value={text}
      onChange={handleChange}
      placeholder="Write a strong professional summary focused on your target role..."
      rows={1}
    />
  )
}

// ── Skills ────────────────────────────────────────────────────────────────────

function SkillRow({
  id,
  cat,
  onChangeCategory,
  onChangeItems,
  onRemove,
  dragHandleProps,
}: {
  id: string
  cat: CVSkillCategory
  onChangeCategory: (v: string) => void
  onChangeItems: (items: string[]) => void
  onRemove: () => void
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }
}) {
  // Local draft state — committed on blur
  const [skillsDraft, setSkillsDraft] = useState(cat.items.join(' | '))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync when items change from outside (e.g. AI edit or drag reorder)
  const prevJoined = useRef(cat.items.join(' | '))
  if (cat.items.join(' | ') !== prevJoined.current) {
    prevJoined.current = cat.items.join(' | ')
    setSkillsDraft(cat.items.join(' | '))
  }

  useEffect(() => { autoResize(textareaRef.current) }, [skillsDraft])

  return (
    <div className={styles.skillRow}>
      <button className={styles.itemHandle} {...dragHandleProps} title="Drag to reorder">⠿</button>
      <div className={styles.skillRowFields}>
        <PI
          className={`${styles.field} ${styles.skillCategory}`}
          value={cat.area}
          onChange={e => onChangeCategory(e.target.value)}
          placeholder="Skill Category"
        />
        <PT
          ref={textareaRef}
          className={`${styles.field} ${styles.skillItems}`}
          value={skillsDraft}
          rows={1}
          onChange={e => { autoResize(e.target as HTMLTextAreaElement); setSkillsDraft((e.target as HTMLTextAreaElement).value) }}
          onBlur={e => {
            const items = (e.target as HTMLTextAreaElement).value.split('|').map(s => s.trim()).filter(Boolean)
            onChangeItems(items)
          }}
          placeholder="Skill A | Skill B | Skill C"
        />
      </div>
      <button className={styles.removeBtn} onClick={onRemove} title="Remove">×</button>
    </div>
  )
}

function SortableSkillRow(props: Omit<React.ComponentProps<typeof SkillRow>, 'dragHandleProps'>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <SkillRow
        {...props}
        dragHandleProps={{ ref: setActivatorNodeRef, ...listeners, ...attributes } as React.HTMLAttributes<HTMLButtonElement> & { ref: React.Ref<HTMLButtonElement> }}
      />
    </div>
  )
}

function CvSkills({
  skills,
  onChange,
}: {
  skills: CVContent['skills']
  onChange: (s: CVContent['skills']) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const cats = flattenSkills(skills)
  const ids = cats.map((_, i) => `skill_${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const o = ids.indexOf(String(active.id))
    const n = ids.indexOf(String(over.id))
    if (o !== -1 && n !== -1) onChange(unflattenSkills(arrayMove(cats, o, n)))
  }

  function updateCat(i: number, patch: Partial<CVSkillCategory>) {
    const updated = cats.map((c, j) => j === i ? { ...c, ...patch } : c)
    onChange(unflattenSkills(updated))
  }

  function removeCat(i: number) {
    onChange(unflattenSkills(cats.filter((_, j) => j !== i)))
  }

  function addCat() {
    onChange(unflattenSkills([...cats, { area: '', items: [] }]))
  }

  return (
    <>
      <DndContext id="cv-skills-cats" sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className={styles.skillsList}>
            {cats.map((cat, i) => (
              <SortableSkillRow
                key={ids[i]}
                id={ids[i]}
                cat={cat}
                onChangeCategory={v => updateCat(i, { area: v })}
                onChangeItems={items => updateCat(i, { items })}
                onRemove={() => removeCat(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button className={styles.addBtn} onClick={addCat}>+ Add category</button>
    </>
  )
}

// ── Experience ────────────────────────────────────────────────────────────────

function ExpItem({
  exp,
  expIndex,
  bulletRefs,
  onChange,
  onRemove,
  dragHandleProps,
}: {
  exp: CVExperience
  expIndex: number
  bulletRefs: React.MutableRefObject<(HTMLTextAreaElement | null)[][]>
  onChange: (e: CVExperience) => void
  onRemove: () => void
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }
}) {
  if (!bulletRefs.current[expIndex]) bulletRefs.current[expIndex] = []

  function setBulletRef(el: HTMLTextAreaElement | null, bi: number) {
    bulletRefs.current[expIndex][bi] = el
    if (el) autoResize(el)
  }

  function handleBulletInput(e: React.ChangeEvent<HTMLTextAreaElement>, bi: number) {
    autoResize(e.target)
    const updated = exp.bullets.map((b, j) =>
      j === bi ? { ...b, text: e.target.value, ai_generated: false } : b
    )
    onChange({ ...exp, bullets: updated })
  }

  function handleBulletKeydown(e: React.KeyboardEvent<HTMLTextAreaElement>, bi: number) {
    const el = e.currentTarget

    if (e.key === 'Enter') {
      e.preventDefault()
      const updated = [...exp.bullets]
      updated.splice(bi + 1, 0, { text: '', ai_generated: false })
      onChange({ ...exp, bullets: updated })
      // Focus next bullet after render
      setTimeout(() => {
        bulletRefs.current[expIndex]?.[bi + 1]?.focus()
      }, 0)
      return
    }

    if (e.key === 'Backspace' && exp.bullets.length > 1) {
      if (el.selectionStart === 0 && el.selectionEnd === 0) {
        e.preventDefault()
        const updated = exp.bullets.filter((_, j) => j !== bi)
        onChange({ ...exp, bullets: updated })
        setTimeout(() => {
          const prev = bulletRefs.current[expIndex]?.[Math.max(0, bi - 1)]
          if (prev) {
            prev.focus()
            prev.setSelectionRange(prev.value.length, prev.value.length)
          }
        }, 0)
      }
    }
  }

  return (
    <div className={styles.expItem}>
      <button className={styles.itemHandle} {...dragHandleProps} title="Drag to reorder">⠿</button>
      <div className={styles.expItemRow}>
        <div className={styles.expFields}>
          <PI
            className={`${styles.field} ${styles.expRole}`}
            value={exp.role}
            onChange={e => onChange({ ...exp, role: e.target.value })}
            placeholder="Job Title"
          />
          <div className={styles.expMeta}>
            <PI
              className={`${styles.field} ${styles.expMetaField}`}
              value={exp.company}
              onChange={e => onChange({ ...exp, company: e.target.value })}
              placeholder="Company Name"
              size={Math.max(2, exp.company.length)}
            />
            <span className={styles.separator}>·</span>
            <PI
              className={`${styles.field} ${styles.expMetaField}`}
              value={exp.location ?? ''}
              onChange={e => onChange({ ...exp, location: e.target.value })}
              placeholder="City, Country"
              size={Math.max(12, (exp.location ?? '').length)}
            />
            <span className={styles.separator}>·</span>
            <PI
              className={`${styles.field} ${styles.expMetaField}`}
              value={exp.period}
              onChange={e => onChange({ ...exp, period: e.target.value })}
              placeholder="Jan 2022 – Present"
              size={Math.max(16, exp.period.length)}
            />
          </div>
        </div>
        <button className={styles.removeBtn} onClick={onRemove} title="Remove">×</button>
      </div>
      <ul className={styles.expBullets}>
        {exp.bullets.map((bullet, bi) => (
          <li key={bi} className={styles.bulletRow}>
            <PT
              ref={el => setBulletRef(el, bi)}
              className={`${styles.field} ${styles.bulletTextarea}`}
              value={bullet.text}
              rows={1}
              placeholder="Describe an achievement or responsibility..."
              onChange={e => handleBulletInput(e as React.ChangeEvent<HTMLTextAreaElement>, bi)}
              onKeyDown={e => handleBulletKeydown(e as React.KeyboardEvent<HTMLTextAreaElement>, bi)}
            />
            {exp.bullets.length > 1 && (
              <button
                className={styles.removeBtn}
                onClick={() => onChange({ ...exp, bullets: exp.bullets.filter((_, j) => j !== bi) })}
                title="Remove bullet"
              >×</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SortableExpItem(props: Omit<React.ComponentProps<typeof ExpItem>, 'dragHandleProps'> & { id: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id })

  const { id, ...rest } = props

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <ExpItem
        {...rest}
        dragHandleProps={{ ref: setActivatorNodeRef, ...listeners, ...attributes } as React.HTMLAttributes<HTMLButtonElement> & { ref: React.Ref<HTMLButtonElement> }}
      />
    </div>
  )
}

function CvExperience({
  experience,
  onChange,
}: {
  experience: CVExperience[]
  onChange: (e: CVExperience[]) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const bulletRefs = useRef<(HTMLTextAreaElement | null)[][]>([])
  const ids = experience.map((_, i) => `exp_${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const o = ids.indexOf(String(active.id))
    const n = ids.indexOf(String(over.id))
    if (o !== -1 && n !== -1) onChange(arrayMove(experience, o, n))
  }

  function addExperience() {
    onChange([...experience, { role: '', company: '', location: '', period: '', bullets: [{ text: '', ai_generated: false }] }])
  }

  return (
    <>
      <DndContext id="cv-experience-entries" sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {experience.map((exp, i) => (
            <SortableExpItem
              key={ids[i]}
              id={ids[i]}
              exp={exp}
              expIndex={i}
              bulletRefs={bulletRefs}
              onChange={updated => onChange(experience.map((e, j) => j === i ? updated : e))}
              onRemove={() => onChange(experience.filter((_, j) => j !== i))}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button className={styles.addBtn} onClick={addExperience}>+ Add experience</button>
    </>
  )
}

// ── Education ─────────────────────────────────────────────────────────────────

function CvEducation({
  education,
  onChange,
}: {
  education: CVContent['education']
  onChange: (e: CVContent['education']) => void
}) {
  function updateEdu(i: number, patch: Partial<CVContent['education'][0]>) {
    onChange(education.map((e, j) => j === i ? { ...e, ...patch } : e))
  }

  return (
    <>
      {education.map((edu, i) => (
        <div key={i} className={styles.expItem}>
          <div className={styles.expItemRow}>
            <div className={styles.expFields}>
              <PI
                className={`${styles.field} ${styles.expRole}`}
                value={edu.degree}
                onChange={e => updateEdu(i, { degree: e.target.value })}
                placeholder="Bachelor's in Computer Science"
              />
              <div className={styles.expMeta}>
                <PI
                  className={`${styles.field} ${styles.expMetaField}`}
                  value={edu.institution}
                  onChange={e => updateEdu(i, { institution: e.target.value })}
                  placeholder="University"
                  size={Math.max(2, edu.institution.length)}
                />
                <span className={styles.separator}>·</span>
                <PI
                  className={`${styles.field} ${styles.expMetaField}`}
                  value={edu.year}
                  onChange={e => updateEdu(i, { year: e.target.value })}
                  placeholder="2019 – 2023"
                  size={Math.max(6, edu.year.length)}
                />
              </div>
            </div>
            <button className={styles.removeBtn} onClick={() => onChange(education.filter((_, j) => j !== i))}>×</button>
          </div>
        </div>
      ))}
      <button
        className={styles.addBtn}
        onClick={() => onChange([...education, { degree: '', institution: '', year: '' }])}
      >+ Add education</button>
    </>
  )
}

// ── Languages ─────────────────────────────────────────────────────────────────

function CvLanguages({
  languages,
  onChange,
}: {
  languages: Array<{ name?: string; language?: string; level: string }>
  onChange: (l: Array<{ name: string; level: string }>) => void
}) {
  function update(i: number, patch: { name?: string; level?: string }) {
    const updated = languages.map((l, j) =>
      j === i ? { name: l.name ?? l.language ?? '', level: l.level, ...patch } : { name: l.name ?? l.language ?? '', level: l.level }
    )
    onChange(updated)
  }

  return (
    <>
      <div className={styles.langList}>
        {languages.map((lang, i) => {
          const name = lang.name ?? lang.language ?? ''
          return (
            <div key={i} className={styles.langRow}>
              <PI
                className={`${styles.field} ${styles.langName}`}
                value={name}
                onChange={e => update(i, { name: e.target.value })}
                placeholder="Language"
                size={Math.max(2, name.length)}
              />
              <span className={styles.separator}>–</span>
              <PI
                className={`${styles.field} ${styles.langLevel}`}
                value={lang.level}
                onChange={e => update(i, { level: e.target.value })}
                placeholder="Level"
                size={Math.max(8, lang.level.length)}
              />
              <button className={styles.removeBtn} onClick={() => onChange(languages.filter((_, j) => j !== i).map(l => ({ name: l.name ?? l.language ?? '', level: l.level })))}>×</button>
            </div>
          )
        })}
      </div>
      <button className={styles.addBtn} onClick={() => onChange([...languages.map(l => ({ name: l.name ?? l.language ?? '', level: l.level })), { name: '', level: '' }])}>
        + Add language
      </button>
    </>
  )
}

// ── Projects ──────────────────────────────────────────────────────────────────

function CvProjects({
  projects,
  onChange,
}: {
  projects: Array<{ name: string; url?: string; description: string }>
  onChange: (p: Array<{ name: string; url?: string; description: string }>) => void
}) {
  const descRefs = useRef<(HTMLTextAreaElement | null)[]>([])

  return (
    <>
      <div className={styles.projectList}>
        {projects.map((proj, i) => (
          <div key={i} className={styles.projectItem}>
            <div className={styles.projectFields}>
              <PI
                className={`${styles.field} ${styles.projectName}`}
                value={proj.name}
                onChange={e => onChange(projects.map((p, j) => j === i ? { ...p, name: e.target.value } : p))}
                placeholder="Project name"
              />
              <PT
                ref={el => { descRefs.current[i] = el; if (el) autoResize(el) }}
                className={`${styles.field} ${styles.projectDesc}`}
                value={proj.description}
                rows={1}
                onChange={e => { autoResize(e.target as HTMLTextAreaElement); onChange(projects.map((p, j) => j === i ? { ...p, description: (e.target as HTMLTextAreaElement).value } : p)) }}
                placeholder="Brief description…"
              />
            </div>
            <button className={styles.removeBtn} onClick={() => onChange(projects.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
      <button className={styles.addBtn} onClick={() => onChange([...projects, { name: '', description: '' }])}>
        + Add project
      </button>
    </>
  )
}

// ── Sortable section wrapper ───────────────────────────────────────────────────

function SortableCvSection({
  id,
  title,
  onHide,
  children,
}: {
  id: string
  title: string
  onHide: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className={styles.section}>
        <button
          className={styles.sectionHandle}
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          title="Drag to reorder"
        >⠿</button>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <button className={styles.sectionHideBtn} onClick={onHide} title="Remove section">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  content: CVContent
  onChange: (updater: (prev: CVContent) => CVContent) => void
  onAiAction: (prompt: string) => void
}

export function CvDocument({ content, onChange }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const docRef   = useRef<HTMLDivElement>(null)
  const [scale, setScale]               = useState(1)
  const [sectionOrder, setSectionOrder] = useState(() => {
    const base = ['summary', 'skills', 'experience', 'education']
    if (content.optional?.languages?.length) base.push('languages')
    if (content.optional?.projects?.length) base.push('projects')
    return base
  })
  const [hidden, setHidden]             = useState<string[]>([])

  const [isPrinting, setIsPrinting] = useState(false)

  // Mark body so print CSS only applies on this page
  useEffect(() => {
    document.body.classList.add('cv-page')
    return () => document.body.classList.remove('cv-page')
  }, [])

  // Switch to plain-text rendering during print so form elements don't clip
  useEffect(() => {
    const before = () => setIsPrinting(true)
    const after  = () => setIsPrinting(false)
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint',  after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint',  after)
    }
  }, [])

  const sectionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // ── Responsive scaling
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const observer = new ResizeObserver(() => {
      const available = panel.clientWidth - PANEL_PADDING_H
      setScale(Math.min(1, available / DOC_WIDTH))
    })
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])

  // ── Section visibility
  function hideSection(key: string) {
    setSectionOrder(o => o.filter(k => k !== key))
    setHidden(h => [...h, key])
  }

  function showSection(key: string) {
    setHidden(h => h.filter(k => k !== key))
    setSectionOrder(o => [...o, key])
  }

  // ── Section drag
  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSectionOrder(o => {
      const oi = o.indexOf(String(active.id))
      const ni = o.indexOf(String(over.id))
      return oi !== -1 && ni !== -1 ? arrayMove(o, oi, ni) : o
    })
  }

  // ── Content updaters
  const update = useCallback(<K extends keyof CVContent>(key: K, val: CVContent[K]) => {
    onChange(prev => ({ ...prev, [key]: val }))
  }, [onChange])

  // ── Section renderers
  function renderSection(key: string) {
    switch (key) {
      case 'summary':
        return (
          <CvSummary
            summary={content.summary}
            onChange={s => update('summary', s)}
          />
        )
      case 'skills':
        return (
          <CvSkills
            skills={content.skills}
            onChange={s => update('skills', s)}
          />
        )
      case 'experience':
        return (
          <CvExperience
            experience={content.experience}
            onChange={e => update('experience', e)}
          />
        )
      case 'education':
        return (
          <CvEducation
            education={content.education}
            onChange={e => update('education', e)}
          />
        )
      case 'languages':
        return (
          <CvLanguages
            languages={content.optional?.languages ?? []}
            onChange={langs => update('optional', { ...content.optional, languages: langs })}
          />
        )
      case 'projects':
        return (
          <CvProjects
            projects={content.optional?.projects ?? []}
            onChange={projs => update('optional', { ...content.optional, projects: projs })}
          />
        )
      default:
        return null
    }
  }

  return (
    <PrintCtx.Provider value={isPrinting}>
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.wrapper}>
        <div ref={docRef} className={styles.document} data-cv-doc>

          {/* Header — not draggable, always first */}
          <CvHeader
            personal={content.personal}
            onChange={p => update('personal', p)}
          />

          {/* Draggable sections */}
          <DndContext id="cv-sections" sensors={sectionSensors} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              {sectionOrder.map(key => (
                <SortableCvSection
                  key={key}
                  id={key}
                  title={SECTION_LABELS[key] ?? key}
                  onHide={() => hideSection(key)}
                >
                  {renderSection(key)}
                </SortableCvSection>
              ))}
            </SortableContext>
          </DndContext>

          {/* Hidden sections — re-add buttons */}
          {hidden.length > 0 && (
            <div className={styles.hiddenSections}>
              {hidden.map(key => (
                <button
                  key={key}
                  className={styles.showSectionBtn}
                  onClick={() => showSection(key)}
                >
                  + {SECTION_LABELS[key] ?? key}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
    </PrintCtx.Provider>
  )
}
