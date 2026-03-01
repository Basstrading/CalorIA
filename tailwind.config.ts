import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0A0A0F',
        card: '#141419',
        accent: '#00E676',
        'accent-soft': 'rgba(0, 230, 118, 0.2)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0B0',
        danger: '#FF5252',
        border: '#2A2A35',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        full: '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config
