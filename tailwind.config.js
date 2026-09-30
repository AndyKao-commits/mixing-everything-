/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1917',
        soft: '#6b6560',
        paper: '#f4f5f7',
        ember: '#e85d04',
        coal: '#292524',
        moss: '#2a9d8f',
        cream: '#fffaf5',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Sora', 'sans-serif'],
        body: ['var(--font-body)', 'Noto Sans TC', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(28, 25, 23, 0.08)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseNum: {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        rise: 'rise 0.35s ease both',
        pop: 'pop 0.25s ease both',
        pulseNum: 'pulseNum 0.45s ease',
      },
    },
  },
  plugins: [],
}
