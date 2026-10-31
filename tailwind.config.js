/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef8ff',
          100: '#d8efff',
          200: '#b9e2fe',
          300: '#89d1fd',
          400: '#52b8fa',
          500: '#2b9bf4',
          600: '#157ee9',
          700: '#1066d4',
          800: '#1453ab',
          900: '#164687',
        }
      }
    },
  },
  plugins: [],
}

