'use client'

import type { CVContent } from './types'

interface Props {
  content: CVContent
}

export function CvPreview({ content }: Props) {
  const { personal, summary, skills, experience, education } = content

  return (
    <div style={{
      background: '#fff',
      color: '#1a1a1a',
      fontFamily: 'Georgia, serif',
      fontSize: 11,
      lineHeight: 1.5,
      padding: '32px 36px',
      height: '100%',
      overflowY: 'auto',
      borderRadius: 0,
    }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'Arial, sans-serif' }}>
          {personal.full_name || 'Seu Nome'}
        </div>
        {personal.position && (
          <div style={{ fontSize: 12, color: '#444', marginTop: 2, fontFamily: 'Arial, sans-serif' }}>
            {personal.position}
          </div>
        )}
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: 10, color: '#555', fontFamily: 'Arial, sans-serif' }}>
          {personal.email    && <span>{personal.email}</span>}
          {personal.phone    && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github   && <span>{personal.github}</span>}
          {personal.website  && <span>{personal.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary?.some(p => p.trim()) && (
        <Section title="Professional Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {summary.filter(p => p.trim()).map((p, i) => (
              <p key={i} style={{ margin: 0, fontSize: 11, color: '#333', lineHeight: 1.6 }}>{p}</p>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {(skills?.primary?.items?.length > 0 || skills?.adjacent?.length > 0) && (
        <Section title="Skills">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {skills.primary?.items?.length > 0 && (
              <SkillRow area={skills.primary.area} items={skills.primary.items} />
            )}
            {skills.adjacent?.map((cat, i) =>
              cat.items.length > 0 ? <SkillRow key={i} area={cat.area} items={cat.items} /> : null
            )}
          </div>
        </Section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <Section title="Professional Experience">
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < experience.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 11.5, fontFamily: 'Arial, sans-serif' }}>{exp.role}</span>
                  {exp.company && <span style={{ fontStyle: 'italic', color: '#444', fontSize: 11 }}> · {exp.company}</span>}
                </div>
                <span style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.period}</span>
              </div>
              {exp.location && <div style={{ fontSize: 10, color: '#777', marginBottom: 3 }}>{exp.location}</div>}
              {exp.bullets?.filter(b => b.text).map((b, bi) => (
                <div key={bi} style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                  <span style={{ flexShrink: 0, color: '#666' }}>•</span>
                  <span style={{ fontSize: 10.5, color: '#333', lineHeight: 1.5 }}>{b.text}</span>
                </div>
              ))}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <Section title="Education">
          {education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 11, fontFamily: 'Arial, sans-serif' }}>{edu.degree}</span>
                {edu.institution && <span style={{ color: '#555', fontSize: 10.5 }}> · {edu.institution}</span>}
              </div>
              <span style={{ fontSize: 10, color: '#666' }}>{edu.year}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: '#1a1a1a', borderBottom: '0.5px solid #ccc', paddingBottom: 3, marginBottom: 7,
        fontFamily: 'Arial, sans-serif',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SkillRow({ area, items }: { area: string; items: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 10.5, lineHeight: 1.4 }}>
      <span style={{ fontWeight: 600, color: '#333', minWidth: 80, flexShrink: 0, fontFamily: 'Arial, sans-serif' }}>{area}:</span>
      <span style={{ color: '#444' }}>{items.join(' · ')}</span>
    </div>
  )
}
