/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#17202a",
        calm: "#2f6f73",
        leaf: "#4f8a5b",
        citrus: "#d98c25",
        rose: "#b85462",
      },
    },
  },
  plugins: [],
};
