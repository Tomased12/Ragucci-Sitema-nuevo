/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ragucci: {
          primary: '#190303',
          'primary-light': '#470202',
          gold: '#c59f5e',
          'gold-light': '#ddccb1',
          red: '#7c1111',
          bg: '#f9f9f9',
          border: '#ddccb1'
        }
      },
      fontFamily: {
        bodoni: ['"Bodoni Moda"', 'serif'],
        fustat: ['Fustat', 'sans-serif']
      }
    },
  },
  plugins: [],
}
