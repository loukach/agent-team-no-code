/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        progressive: '#3b82f6',
        conservative: '#ef4444',
        tech: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
