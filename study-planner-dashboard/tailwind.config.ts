import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0B1220',
        sidebar: '#101827',
        card: '#162133',
        border: '#22304A',
        'primary-green': '#21D18B',
        'accent-blue': '#3B82F6',
        'text-white': '#F8FAFC',
        'text-secondary': '#94A3B8',
        danger: '#EF4444',
        warning: '#F59E0B',
        purple: '#8B5CF6',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 4px 24px 0 rgba(0,0,0,0.4)',
        'glow-green': '0 0 24px 4px rgba(33,209,139,0.25)',
        'glow-blue': '0 0 24px 4px rgba(59,130,246,0.25)',
        'glow-card': '0 8px 32px 0 rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'green-gradient': 'linear-gradient(135deg, #21D18B 0%, #1aaa70 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(22,33,51,0.95) 0%, rgba(16,24,39,0.98) 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #101827 0%, #0d1520 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
