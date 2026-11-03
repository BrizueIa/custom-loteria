/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        loteria: {
          pink: '#E91E63',
          yellow: '#FFEB3B',
          green: '#4CAF50',
          blue: '#2196F3',
          cream: '#FFF9E6'
        }
      }
    },
  },
  plugins: [],
}
