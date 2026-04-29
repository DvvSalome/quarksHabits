/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float 14s ease-in-out infinite',
        'float-fast': 'float 5s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'aurora': 'aurora 16s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'wave': 'wave 2.5s ease-in-out infinite',
        'gradient-shift': 'gradientShift 5s ease infinite',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-28px) rotate(2deg)' },
          '66%': { transform: 'translateY(-12px) rotate(-1deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 15px rgba(124, 58, 237, 0.3), 0 0 30px rgba(124, 58, 237, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 35px rgba(124, 58, 237, 0.65), 0 0 70px rgba(124, 58, 237, 0.25)',
          },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-8deg)' },
          '60%': { transform: 'rotate(14deg)' },
          '80%': { transform: 'rotate(-4deg)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundSize: {
        '200%': '200%',
        '300%': '300%',
        '400%': '400%',
      },
    },
  },
  plugins: [],
}
