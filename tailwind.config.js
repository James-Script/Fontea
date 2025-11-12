/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fontea: {
          primary: '#00BFA5',
          secondary: '#00897B',
          dark: '#004D40',
          light: '#B2DFDB',
        }
      }
    },
  },
  plugins: [],
}
