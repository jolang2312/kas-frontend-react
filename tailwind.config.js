/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bgMain: '#050505',
        bgSec: '#090909',
        sidebarBg: '#080808',
        cardBg: '#101010',
        cardHover: '#161616',
        inputBg: '#0D0D0D',
        borderDark: '#292929',
        textPrimary: '#F5F5F5',
        textSec: '#A1A1AA',
        textMuted: '#71717A',
        chrome: '#D4D4D8',
        brightChrome: '#FAFAFA',
      },
    },
  },
  plugins: [],
}