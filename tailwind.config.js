/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14181f',
        soft: '#5a6573',
        paper: '#f2f5f8',
        coral: '#ff3b5c',
        mint: '#1ec9a8',
        gold: '#f5b942',
        night: '#0e141c',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Sora', 'sans-serif'],
        body: ['var(--font-body)', 'Noto Sans TC', 'sans-serif'],
      },
      boxShadow: {
        pop: '0 12px 40px rgba(20, 24, 31, 0.12)',
        glow: '0 0 0 4px rgba(255, 59, 92, 0.18)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'flip-in': {
          '0%': { opacity: '0', transform: 'rotateX(-18deg) translateY(16px)' },
          '100%': { opacity: '1', transform: 'rotateX(0) translateY(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 59, 92, 0.45)' },
          '100%': { boxShadow: '0 0 0 18px rgba(255, 59, 92, 0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'flip-in': 'flip-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        bounceSoft: 'bounceSoft 0.8s ease-in-out infinite',
        pulseRing: 'pulseRing 1.4s ease-out infinite',
      },
    },
  },
  plugins: [],
}
