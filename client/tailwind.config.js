/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eff8ff',
          100: '#dbf0ff',
          200: '#b6e0ff',
          300: '#7cc7ff',
          400: '#36a8f5',
          500: '#0e8be0',
          600: '#0570bd',
          700: '#075a99',
          800: '#0a4d7e',
          900: '#0d4068',
        },
        accent: {
          50:  '#effcf9',
          100: '#c8f5ec',
          400: '#34d6b8',
          500: '#0fbfa1',
          600: '#0a9d85',
          700: '#0a7d6b',
        },
        ink: {
          900: '#0f172a',  // headings
          800: '#1e293b',
          700: '#334155',  // body
          600: '#475569',
          500: '#64748b',  // muted
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',  // borders
          100: '#f1f5f9',  // soft bg
          50:  '#f8fafc',  // page bg
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        liftA: '0 6px 24px -4px rgba(14, 139, 224, 0.18)',
        liftB: '0 8px 28px -6px rgba(15, 191, 161, 0.20)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        floaty: 'floaty 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
