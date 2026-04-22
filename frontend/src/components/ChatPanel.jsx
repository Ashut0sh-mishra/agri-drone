/**
 * ChatPanel - Conversational assistant grounded in the current diagnosis.
 *
 * Sends the user's question plus the structured diagnosis context to the
 * backend LLM endpoint. Also hosts the VoiceInterface for mic input and
 * TTS playback.
 *
 * Props:
 *   result    - structured result object from /detect
 *   cropType  - 'wheat' | 'rice' | ...
 *   startOpen - whether the panel is expanded initially
 *
 * @component
 */
import React, { useState, useRef, useEffect } from 'react'
import { getApiUrl } from '../services/api'
import VoiceInterface from './VoiceInterface'

const STARTERS = [
  { emoji: '⏳', text: 'Can I delay treatment 3 days?' },
  { emoji: '🌧️', text: 'What if it rains tomorrow?' },
  { emoji: '💰', text: 'Cheaper alternative to this fungicide?' },
  { emoji: '🌿', text: 'Is this spreading to nearby plants?' },
  { emoji: '📉', text: "What's my estimated yield loss?" },
]

function buildDiseaseContext(result) {
  if (!result) return {}
  const s = result.structured
  if (s) {
    return {
      disease_key: s.disease?.key || '',
      disease: s.disease?.display_name || s.disease?.class || '',
      confidence: s.confidence?.score ?? 0,
      health_score: s.health?.score ?? 50,
      risk_level: s.health?.risk_level || 'unknown',
      yield_loss: s.yield_loss || 'unknown',
      urgency: s.urgency || 'within_7_days',
      treatment: s.treatment || [],
    }
  }
  // Fallback for older / unstructured results
  const det = result.detections?.[0]
  return {
    disease_key: det?.class_name?.toLowerCase().replace(/[\s-]+/g, '_') || '',
    disease: det?.class_name || 'Unknown',
    confidence: det?.confidence ?? 0,
    health_score: 50,
    risk_level: 'unknown',
    urgency: 'within_7_days',
    treatment: [],
  }
}

export default function ChatPanel({ result, cropType = 'wheat', startOpen = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [open, setOpen] = useState(startOpen)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  // Reset chat when result changes
  useEffect(() => {
    setMessages([])
    setInput('')
    setStreaming(false)
  }, [result?.structured?.disease?.key, result?.detections?.[0]?.class_name])

  const sendMessage = async (text) => {
    if (!text.trim() || streaming) return
    const question = text.trim()
    setInput('')

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    const userMsg = { role: 'user', content: question }
    setMessages((prev) => [...prev, userMsg])
    setStreaming(true)

    // Add placeholder assistant message
    const assistantIdx = messages.length + 1
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const apiUrl = getApiUrl()
      const resp = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          disease_context: buildDiseaseContext(result),
          conversation_history: history,
          crop_type: cropType,
        }),
      })

      if (!resp.ok) throw new Error(`Chat API error: ${resp.status}`)

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const text = accumulated
        setMessages((prev) =>
          prev.map((m, i) => (i === assistantIdx ? { ...m, content: text } : m))
        )
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === assistantIdx
            ? { ...m, content: m.content || `Sorry, I couldn't reach the advisor. ${err.message}` }
            : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (!result) return null

  /* ── Collapsed: floating button ── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
        style={{
          background: 'var(--accent)',
          color: '#fff',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent)',
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
        </svg>
        Ask the Advisor
      </button>
    )
  }

  /* ── Expanded: chat panel ── */
  const diseaseCtx = buildDiseaseContext(result)

  // Build a short summary string for TTS readback
  const diagnosisSummary = diseaseCtx.disease
    ? `Detected ${diseaseCtx.disease} with ${Math.round((diseaseCtx.confidence || 0) * 100)}% confidence. ` +
      `Health score: ${diseaseCtx.health_score ?? 'unknown'}. ` +
      `Risk level: ${diseaseCtx.risk_level || 'unknown'}. ` +
      (diseaseCtx.yield_loss && diseaseCtx.yield_loss !== 'unknown'
        ? `Estimated yield loss: ${diseaseCtx.yield_loss}. `
        : '') +
      (Array.isArray(diseaseCtx.treatment) && diseaseCtx.treatment.length
        ? `Recommended treatment: ${diseaseCtx.treatment[0]}.`
        : '')
    : null

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
          >
            🌾
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Field Advisor
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
              Ask about{' '}
              <span style={{ color: 'var(--accent)' }}>
                {diseaseCtx.disease || 'this diagnosis'}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition hover:opacity-80"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div
        className="px-4 py-3 space-y-3 overflow-y-auto"
        style={{ maxHeight: '360px', minHeight: '120px' }}
      >
        {messages.length === 0 ? (
          /* Starter questions */
          <div className="space-y-2">
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
              Quick questions:
            </p>
            {STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.text)}
                disabled={streaming}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition hover:scale-[1.01] disabled:opacity-50"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="mr-1.5">{s.emoji}</span>
                {s.text}
              </button>
            ))}
          </div>
        ) : (
          /* Conversation */
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'var(--accent)',
                        color: '#fff',
                        borderBottomRightRadius: '4px',
                      }
                    : {
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderBottomLeftRadius: '4px',
                      }
                }
              >
                {msg.content || (
                  <span className="inline-flex gap-1" style={{ color: 'var(--text-faint)' }}>
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 pt-1 pb-3">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <VoiceInterface
            onTranscript={(text) => {
              setInput(text)
              inputRef.current?.focus()
            }}
            diagnosisSummary={diagnosisSummary}
            disabled={streaming}
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this disease..."
            disabled={streaming}
            className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-50 disabled:opacity-40"
            style={{ color: 'var(--text-primary)' }}
            maxLength={500}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition disabled:opacity-30"
            style={{ background: 'var(--accent)' }}
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
