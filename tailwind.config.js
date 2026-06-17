/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        cs: {
          dark: '#0a0e1a',
          card: '#141b2d',
          border: '#1e2a45',
          gold: '#f0b90b',
        },
      },
    },
  },
  plugins: [],
}