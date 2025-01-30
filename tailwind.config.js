/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f15927",
          50: "#fff5f2",
          100: "#ffe9e2",
          200: "#ffd0bc",
          300: "#ffb496",
          400: "#ff8c5f",
          500: "#f15927",
          600: "#e54817",
          700: "#bd3712",
          800: "#982e15",
          900: "#7c2815",
          950: "#431109",
        },
      },
    },
  },
  plugins: [],
};
