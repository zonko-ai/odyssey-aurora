/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0A0A',
        surface: '#141414',
        'surface-light': '#1E1E1E',
        cyan: {
          DEFAULT: '#00D4FF',
          dim: 'rgba(0, 212, 255, 0.5)',
          faint: 'rgba(0, 212, 255, 0.15)',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          dim: 'rgba(45, 212, 191, 0.5)',
          faint: 'rgba(45, 212, 191, 0.15)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245, 158, 11, 0.5)',
          faint: 'rgba(245, 158, 11, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        breathe: 'breathe 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'slide-out-right': 'slideOutRight 0.3s ease-in forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 212, 255, 0.6), 0 0 60px rgba(0, 212, 255, 0.2)' },
        },
      },
    },
  },
  plugins: [],
};
