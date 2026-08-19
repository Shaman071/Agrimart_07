// Tailwind Config
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        farmer: {
          bg: '#fefce8',
          text: '#713f12',
          accent: '#f59e0b',
        },
        buyer: {
          bg: '#f8fafc',
          text: '#1e293b',
        },
        admin: {
          bg: '#0f172a',
          text: '#f1f5f9',
        }
      },
      fontSize: {
        'farmer-lg': ['1.25rem', { lineHeight: '1.8', fontWeight: '600' }],
        'farmer-xl': ['1.5rem', { lineHeight: '1.8', fontWeight: '700' }],
      }
    },
  },
  plugins: [],
}