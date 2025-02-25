/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Remove static primary colors since we're using dynamic theming
      },
    },
  },
  plugins: [],
};
