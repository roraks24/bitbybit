/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Dynamic color classes used via template literals
    ...['cyan', 'emerald', 'violet', 'amber', 'red', 'blue', 'slate', 'teal'].flatMap((c) => [
      `bg-${c}-500/10`, `bg-${c}-500/5`, `bg-${c}-500/8`, `bg-${c}-500/3`,
      `text-${c}-400`, `text-${c}-300`, `text-${c}-500`, `text-${c}-600`,
      `border-${c}-500/10`, `border-${c}-500/15`, `border-${c}-500/20`, `border-${c}-500/30`, `border-${c}-500/40`, `border-${c}-500/50`,
    ]),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        cyan: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0369a1',
        },
        void: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        warm: {
          50: '#faf8f5',
          100: '#f5f2ee',
          200: '#ede8e0',
          300: '#d4cec4',
          400: '#b8b0a2',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'enter': 'enter 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'enter-nav': 'enter-nav 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'enter-card': 'enter-card 0.7s cubic-bezier(0.22,1,0.36,1) both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(14,165,233,0.3), 0 0 10px rgba(14,165,233,0.15)' },
          '100%': { boxShadow: '0 0 20px rgba(14,165,233,0.4), 0 0 40px rgba(14,165,233,0.2)' },
        },
        enter: {
          from: { opacity: '0', transform: 'translateY(22px)', filter: 'blur(6px)' },
          to: { opacity: '1', transform: 'translateY(0)', filter: 'blur(0px)' },
        },
        'enter-nav': {
          from: { opacity: '0', transform: 'translateY(-14px)', filter: 'blur(4px)' },
          to: { opacity: '1', transform: 'translateY(0)', filter: 'blur(0px)' },
        },
        'enter-card': {
          from: { opacity: '0', transform: 'translateY(32px) scale(0.97)', filter: 'blur(8px)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
