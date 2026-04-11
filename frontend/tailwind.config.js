/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'page':    '#0a1a0a',
        'navbar':  '#1a3a1a',
        'sidebar': '#0f2010',
        'card':    '#1a2e1a',
        'accent':  '#4CAF50',
        'danger':  '#ff4444',
        'warning': '#ffaa00',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'gauge-fill': 'gauge-fill 1.2s ease-out forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.4', transform: 'scale(1.3)' },
        },
        'gauge-fill': {
          '0%': { strokeDashoffset: '565' },
        },
      },
    },
  },
  plugins: [],
}
