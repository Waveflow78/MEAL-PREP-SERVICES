import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#2D4A3E', light: '#3D6354' },
        terracotta: { DEFAULT: '#C4622D', light: '#E8845A' },
        gold: { DEFAULT: '#D4A853', light: '#EBC878' },
        cream: '#FAF7F2',
        'warm-white': '#FFFDF9',
        charcoal: '#1E2822',
        mid: '#4A5E54',
        muted: '#8A9E95',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
