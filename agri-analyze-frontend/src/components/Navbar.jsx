import React, { useState, useEffect } from 'react'
import { findAPI, API_URL } from '../services/api'

export default function Navbar() {
  const [time, setTime] = useState(new Date())
  const [apiPort, setApiPort] = useState(localStorage.getItem('api_port') || '...')
  const [apiOnline, setApiOnline] = useState(false)

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })

  /* Clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* API discovery on mount */
  useEffect(() => {
    findAPI().then((url) => {
      const port = new URL(url).port || '80'
      setApiPort(port)
      setApiOnline(true)
    }).catch(() => setApiOnline(false))
  }, [])

  /* Sync body class on mount + change */
  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  const clock = time.toLocaleTimeString('en-US', { hour12: false })
  const date = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 shadow-lg"
      style={{
        background: 'var(--bg-navbar)',
        borderBottom: '1px solid rgba(76,175,80,0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Left: Brand ── */}
      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 2C12 2 8 6 6 10C4 14 5 18 8 22C10 25 13 28 16 30C19 28 22 25 24 22C27 18 28 14 26 10C24 6 20 2 16 2Z"
            fill="#4CAF50"
            opacity="0.9"
          />
          <path
            d="M16 8C14 10 12 14 12 18C12 20 13 22 16 24C19 22 20 20 20 18C20 14 18 10 16 8Z"
            fill="#81C784"
          />
          <line x1="16" y1="12" x2="16" y2="26" stroke="#2E7D32" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="12" y2="13" stroke="#2E7D32" strokeWidth="1" />
          <line x1="16" y1="19" x2="20" y2="16" stroke="#2E7D32" strokeWidth="1" />
        </svg>
        <span className="text-white font-bold text-lg tracking-wide">
          AgriAnalyze AI
        </span>
      </div>

      {/* ── Center: Subtitle ── */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
        <span className="text-[11px] font-semibold tracking-[.25em] uppercase" style={{ color: 'rgba(76,175,80,0.7)' }}>
          Precision Agriculture Detection System
        </span>
      </div>

      {/* ── Right: Theme toggle + Status + Clock ── */}
      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {isDark ? '🌙' : '☀️'}
        </button>

        {/* API status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${apiOnline ? 'bg-[#4CAF50]' : 'bg-red-500'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${apiOnline ? 'bg-[#4CAF50]' : 'bg-red-500'}`} />
          </span>
          <span className={`text-xs font-semibold ${apiOnline ? 'text-[#4CAF50]' : 'text-red-400'}`}>
            {apiOnline ? `API Online :${apiPort}` : 'API Offline'}
          </span>
        </div>

        {/* Clock */}
        <div className="text-right leading-tight">
          <div className="text-white/90 text-xs font-mono font-bold">
            {clock}
          </div>
          <div className="text-white/40 text-[10px]">{date}</div>
        </div>
      </div>
    </nav>
  )
}
