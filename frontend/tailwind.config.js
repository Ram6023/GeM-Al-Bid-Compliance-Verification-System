/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gem: {
          blue: "#1E3A8A",
          lightblue: "#3B82F6",
          dark: "#0F172A",
          accent: "#D97706",
          bg: "#F8FAFC",
        }
      }
    },
  },
  plugins: [],
}
