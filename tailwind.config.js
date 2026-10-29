/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          dark: '#0B0D11',
          card: '#12161F',
          surface: '#1A202C',
          border: '#273142',
          red: {
            DEFAULT: '#D90429',
            hover: '#BA0020',
            light: '#EF233C',
            glow: 'rgba(217, 4, 41, 0.15)'
          },
          muted: '#94A3B8',
          text: '#F1F5F9'
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Montserrat', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
