/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        raid: {
          bg: '#07110d',
          panel: '#0f1f18',
          ink: '#e7f0e8',
          muted: '#8eaa96',
          accent: '#3dbe7a',
          gold: '#f0c14b',
          gem: '#7ec8ff',
          danger: '#e4572e',
          rare: '#5b8dff',
          epic: '#b26bff',
          legendary: '#ffb347',
          mythic: '#ff5ec4',
          ancient: '#5ef0d0',
          divine: '#ffe566',
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(61, 190, 122, 0.35)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
      },
      animation: {
        shake: 'shake 0.35s ease-in-out',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
