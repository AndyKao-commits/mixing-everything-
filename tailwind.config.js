/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a1a',
        soft: '#4a5560',
        paper: '#f3f6f2',
        cream: '#f7f1e6',
        sky: '#b8d4e8',
        mint: '#d8ebe3',
        coral: '#e4572e',
        teal: '#7eb8b0',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
