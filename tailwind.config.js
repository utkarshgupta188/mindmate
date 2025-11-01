/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2fbf6',
          100: '#def7e7',
          200: '#b8eccd',
          300: '#86dcae',
          400: '#4cc98a',
          500: '#22b36e',
          600: '#17935a',
          700: '#14764b',
          800: '#125c3e',
          900: '#0f4a34'
        },
        moss: '#89a97b',
        mint: '#b9e4c9',
        clay: '#9e7f6d'
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(0,0,0,0.15)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
