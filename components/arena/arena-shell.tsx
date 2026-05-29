'use client'

import { useState, useRef } from 'react'
import { LobbyScreen } from './lobby-screen'
import { CallScreen } from './call-screen'
import { DebriefScreen } from './debrief-screen'

type Round = 'HR Screening' | 'Behavioral' | 'Technical' | 'Offer Negotiation'
type Mode  = 'guided' | 'pit'
type Screen = 'lobby' | 'call' | 'debrief'

interface Message { role: 'interviewer' | 'candidate'; content: string }

interface DebriefData {
  verdict: string
  scores: { clareza: number; evidencia: number; ingles: number }
  questions: {
    question: string; answer: string; score: number
    feedback: { type: 'positive' | 'warning' | 'negative' | 'tip'; text: string }[]
    annotated: { text: string; quality: 'strong' | 'ok' | 'weak' }[]
  }[]
}

interface Profile {
  target_role?: string | null
  seniority?: string | null
  tech_stack?: string[] | null
  years_experience?: number | null
  value_proposition?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
}

interface ArenaShellProps {
  profile: Profile | null
  userName: string
}

export function ArenaShell({ profile, userName }: ArenaShellProps) {
  const [screen, setScreen]               = useState<Screen>('lobby')
  const [selectedRound, setSelectedRound] = useState<Round>('HR Screening')
  const [selectedMode, setSelectedMode]   = useState<Mode>('guided')
  const [debrief, setDebrief]             = useState<DebriefData | null>(null)
  const [loadingDebrief, setLoadingDebrief] = useState(false)
  const [recordingBlob, setRecordingBlob]   = useState<Blob | null>(null)
  const startTimeRef = useRef<number>(0)
  const [duration, setDuration] = useState(0)

  const handleStart = () => {
    startTimeRef.current = Date.now()
    setDebrief(null)
    setScreen('call')
  }

  const handleCallEnd = async (transcript: Message[], blob: Blob | null) => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    setDuration(elapsed)
    setRecordingBlob(blob)
    setScreen('debrief')
    setLoadingDebrief(true)

    try {
      const res = await fetch('/api/arena/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          round: selectedRound,
          mode: selectedMode,
          profile: profile
            ? { target_role: profile.target_role, seniority: profile.seniority, tech_stack: profile.tech_stack }
            : undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setDebrief(data)
      } else {
        setDebrief(null)
      }
    } catch {
      setDebrief(null)
    } finally {
      setLoadingDebrief(false)
    }
  }

  const handleRestart = () => {
    setScreen('lobby')
    setDebrief(null)
    setRecordingBlob(null)
  }

  return (
    <>
      {screen === 'lobby' && (
        <LobbyScreen
          profile={profile}
          userName={userName}
          selectedRound={selectedRound}
          selectedMode={selectedMode}
          onRoundChange={setSelectedRound}
          onModeChange={setSelectedMode}
          onStart={handleStart}
        />
      )}

      {screen === 'call' && (
        <CallScreen
          round={selectedRound}
          mode={selectedMode}
          profile={profile}
          userName={userName}
          onEnd={handleCallEnd}
        />
      )}

      {screen === 'debrief' && (
        <DebriefScreen
          debriefData={debrief}
          isLoading={loadingDebrief}
          round={selectedRound}
          mode={selectedMode}
          duration={duration}
          recordingBlob={recordingBlob}
          onRestart={handleRestart}
        />
      )}
    </>
  )
}
