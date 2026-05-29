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

  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>Job Board</strong>
      {jobs.length > 0 && (
        <>
          <span className="sep crumb-detail">/</span>
          <strong className="crumb-detail">
            {jobs.length} vaga{jobs.length !== 1 ? 's' : ''}
          </strong>
        </>
      )}
    </div>
  )

  return (
    <div className="page-col">
      <Topbar
        title={breadcrumb}
        actions={
          <button
            onClick={() => setAddingToColumn('to_analyse')}
            style={{
              fontSize: 12, fontWeight: 600, padding: '7px 14px',
              borderRadius: 'var(--tng-radius-xs)', cursor: 'pointer', border: 'none',
              background: 'var(--tng-purple-700)', color: 'var(--tng-cream)',
              fontFamily: 'var(--tng-font-body)',
            }}
          >
            + Nova vaga
          </button>
        }
      />
      <div style={{ flex: 1, overflow: 'hidden', padding: '28px 56px 0' }}>
        <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: 28, height: '100%' }}>
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
