/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Dynamic color classes used via template literals: bg-${color}-500/10, text-${color}-400, etc.
    ...['cyan', 'emerald', 'violet', 'amber', 'red', 'blue', 'slate'].flatMap((c) => [
      `bg-${c}-500/10`, `bg-${c}-500/5`, `bg-${c}-500/8`, `bg-${c}-500/3`,
      `text-${c}-400`, `text-${c}-300`, `text-${c}-500`, `text-${c}-600`,
      `border-${c}-500/10`, `border-${c}-500/15`, `border-${c}-500/20`, `border-${c}-500/30`, `border-${c}-500/40`, `border-${c}-500/50`,
    ]),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
        sans: ['Syne', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      colors: {
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        void: {
          900: '#020408',
          800: '#060d14',
          700: '#0a1628',
          600: '#0f2040',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #06b6d4, 0 0 10px #06b6d4' },
          '100%': { boxShadow: '0 0 20px #06b6d4, 0 0 40px #06b6d4, 0 0 80px #06b6d4' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
