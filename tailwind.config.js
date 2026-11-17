/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 400: "#f472b6", 500: "#ec4899", 600: "#db2777" },
      },
    },
  },
  plugins: [],
};
