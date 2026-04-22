/**
 * VoiceInterface - Mic-input + TTS-output shell for ChatPanel.
 *
 * Uses the Web Speech API for recognition, pipes the transcript to the
 * backend chat endpoint, and speaks the response back via SpeechSynthesis.
 * Supports per-language flag selection.
 *
 * @component
 */
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { getApiUrl } from '../services/api'

/*
 * Flag emoji per detected language code.
 * Falls back to 🌐 for unknown languages.
 */
const LANG_FLAGS = {
  en: '🇬🇧', hi: '🇮🇳', te: '🇮🇳', ta: '🇮🇳', pa: '🇮🇳',
  fi: '🇫🇮', nl: '🇳🇱', de: '🇩🇪',
}

/**
 * VoiceInterface — offline hold-to-record + TTS playback.
 *
 * Props:
 *   onTranscript(text)  — called with transcribed text (fills chat input)
 *   diagnosisSummary    — string to read aloud after detection
 *   disabled            — disables all buttons
 */
export default function VoiceInterface({ onTranscript, diagnosisSummary, disabled = false }) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [detectedLang, setDetectedLang] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const audioRef = useRef(null)
  const streamRef = useRef(null)

  // Cleanup mic stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  /* ── Recording ── */

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Prefer webm opus, fall back to wav
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(audioChunks.current, { type: mimeType })
        if (blob.size > 500) {
          sendForTranscription(blob)
        } else {
          setError('Recording too short')
        }
      }

      mediaRecorder.current = recorder
      recorder.start(250) // collect chunks every 250ms
      setRecording(true)
    } catch (err) {
      console.error('Mic access denied:', err)
      setError('Microphone access denied')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
    }
    setRecording(false)
  }, [])

  /* ── Transcription ── */

  const sendForTranscription = async (blob) => {
    setTranscribing(true)
    setError(null)
    try {
      const apiUrl = getApiUrl()
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')

      const resp = await fetch(`${apiUrl}/api/voice/transcribe`, {
        method: 'POST',
        body: form,
      })

      if (!resp.ok) {
        const detail = await resp.text()
        throw new Error(detail || `Transcription failed (${resp.status})`)
      }

      const data = await resp.json()
      setDetectedLang(data.language || 'en')

      if (data.text && data.text !== '(no speech detected)') {
        onTranscript?.(data.text)
      } else {
        setError('No speech detected — try again')
      }
    } catch (err) {
      console.error('Transcription error:', err)
      setError('Transcription failed — is whisper.cpp installed?')
    } finally {
      setTranscribing(false)
    }
  }

  /* ── Text-to-Speech ── */

  const speakDiagnosis = async () => {
    if (!diagnosisSummary || speaking) return
    setSpeaking(true)
    setError(null)
    try {
      const apiUrl = getApiUrl()
      const lang = detectedLang || 'en'
      const resp = await fetch(`${apiUrl}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: diagnosisSummary, language: lang }),
      })

      if (!resp.ok) {
        const detail = await resp.text()
        throw new Error(detail || `TTS failed (${resp.status})`)
      }

      const arrayBuf = await resp.arrayBuffer()
      const blob = new Blob([arrayBuf], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setSpeaking(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setSpeaking(false)
        setError('Audio playback failed')
        URL.revokeObjectURL(url)
      }
      audio.play()
    } catch (err) {
      console.error('TTS error:', err)
      setSpeaking(false)
      setError('TTS failed — is piper installed?')
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setSpeaking(false)
  }

  /* ── Render ── */

  const flagEmoji = detectedLang ? (LANG_FLAGS[detectedLang] || '🌐') : null

  return (
    <div className="flex items-center gap-1.5">
      {/* Hold-to-record mic button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={recording ? stopRecording : undefined}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled || transcribing}
        title={recording ? 'Release to send' : 'Hold to speak'}
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0"
        style={{
          background: recording
            ? 'var(--accent)'
            : transcribing
              ? 'var(--bg-secondary)'
              : 'var(--bg-secondary)',
          border: `2px solid ${recording ? 'var(--accent)' : 'var(--border)'}`,
          color: recording ? '#fff' : 'var(--text-muted)',
          cursor: disabled || transcribing ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          animation: recording ? 'pulse 1s ease-in-out infinite' : 'none',
        }}
      >
        {transcribing ? (
          /* Spinner */
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M4 12a8 8 0 018-8" strokeLinecap="round" />
          </svg>
        ) : (
          /* Mic icon */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}

        {/* Recording pulse ring */}
        {recording && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'var(--accent)', opacity: 0.3 }}
          />
        )}
      </button>

      {/* Speak diagnosis button */}
      {diagnosisSummary && (
        <button
          onClick={speaking ? stopSpeaking : speakDiagnosis}
          disabled={disabled}
          title={speaking ? 'Stop playback' : 'Read diagnosis aloud'}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0"
          style={{
            background: speaking ? 'var(--accent)' : 'var(--bg-secondary)',
            border: `2px solid ${speaking ? 'var(--accent)' : 'var(--border)'}`,
            color: speaking ? '#fff' : 'var(--text-muted)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {speaking ? (
            /* Stop icon */
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            /* Speaker icon */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5L6 9H2v6h4l5 4V5z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.54 8.46a5 5 0 010 7.07" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.07 4.93a10 10 0 010 14.14" />
            </svg>
          )}
        </button>
      )}

      {/* Language flag badge */}
      {flagEmoji && (
        <span
          className="text-sm leading-none select-none"
          title={`Detected: ${detectedLang}`}
        >
          {flagEmoji}
        </span>
      )}

      {/* Status text */}
      {(recording || transcribing || error) && (
        <span
          className="text-[10px] truncate max-w-[120px]"
          style={{
            color: error
              ? 'var(--red, #ef4444)'
              : recording
                ? 'var(--accent)'
                : 'var(--text-faint)',
          }}
        >
          {error || (recording ? 'Listening…' : transcribing ? 'Transcribing…' : '')}
        </span>
      )}
    </div>
  )
}
