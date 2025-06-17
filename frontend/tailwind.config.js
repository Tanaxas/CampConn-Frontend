/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          'hit-primary': '#005511',
          'hit-secondary': '#f8b800',
          'primary-color': '#5D5CDE',
        },
      },
    },
    plugins: [require("daisyui")],
  }