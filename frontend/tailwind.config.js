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
          50: '#FFFACD', // Pale yellow/cream
          100: '#FFE4B5',
          200: '#FFDAB9',
          300: '#F5DEB3', // Light taupe/tan
          400: '#DEB887',
          500: '#CD853F', // Medium brown
          600: '#D2691E', // Darker brown
          700: '#A0522D', // Dark reddish-brown
          800: '#8B4513', // Darker reddish-brown
          900: '#654321',
          accent: '#FF9999', // Muted coral/salmon pink
          'accent-dark': '#FF7F7F',
          brown: {
            light: '#F5DEB3',
            DEFAULT: '#CD853F',
            dark: '#8B4513',
          },
          coral: {
            light: '#FFE4E1',
            DEFAULT: '#FF9999',
            dark: '#FF7F7F',
          },
          cream: {
            light: '#FFFEF0',
            DEFAULT: '#FFFACD',
            dark: '#FFF8DC',
          },
          taupe: {
            light: '#F5F5DC',
            DEFAULT: '#D2B48C',
            dark: '#BC9A6A',
          },
        },
      },
    },
  },
  plugins: [],
}

