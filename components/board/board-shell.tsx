'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { KanbanBoard } from './kanban-board'
import { JobDetail, type Job } from './job-detail'
import type { JobStatus } from '@/app/actions/jobs'

export function BoardShell({ initialJobs, defaultRole }: {
  initialJobs: Job[]
  defaultRole: string
}) {
  const [addingToColumn, setAddingToColumn] = useState<JobStatus | null>(null)
  const [jobs, setJobs] = useState<Job[]>(initialJobs.filter(j => !j.archived_at))
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  function handleJobUpdated(updated: Job) {
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j))
    setSelectedJob(updated)
  }

  function handleJobArchived(jobId: string) {
    setJobs(prev => prev.filter(j => j.id !== jobId))
    setSelectedJob(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        title="Job Board"
        subtitle={`${jobs.length} vaga${jobs.length !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => setAddingToColumn('to_analyse')}
            style={{
              fontSize: 12, fontWeight: 500, padding: '7px 13px',
              borderRadius: 'var(--rsm)', cursor: 'pointer', border: 'none',
              background: 'var(--accent)', color: 'var(--accent-text)',
              fontFamily: 'var(--font)',
            }}
          >
            + Nova vaga
          </button>
        }
      />
      <div style={{ flex: 1, overflow: 'hidden', padding: '20px 24px' }}>
        <div style={{ overflowX: 'auto', paddingBottom: 12, height: '100%' }}>
          <KanbanBoard
            initialJobs={jobs}
            defaultRole={defaultRole}
            addingToColumn={addingToColumn}
            onSetAdding={setAddingToColumn}
            onJobAdded={(job) => setJobs(prev => [job, ...prev])}
            onSelectJob={setSelectedJob}
            updatedJob={selectedJob}
          />
        </div>
      </div>

      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleJobUpdated}
          onArchive={handleJobArchived}
        />
      )}
    </div>
  )
}
