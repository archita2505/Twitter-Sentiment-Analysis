/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        navy: {
          800: '#0f172a',
          900: '#0b0f19',
          950: '#060911',
        },
        sentiment: {
          positive: '#10b981', // emerald-500
          'positive-bg': 'rgba(16, 185, 129, 0.12)',
          negative: '#f43f5e', // rose-500
          'negative-bg': 'rgba(244, 63, 94, 0.12)',
          neutral: '#f59e0b',  // amber-500
          'neutral-bg': 'rgba(245, 158, 11, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'glass-glow': '0 0 25px rgba(139, 92, 246, 0.15)',
        'card-hover': '0 12px 30px -10px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
