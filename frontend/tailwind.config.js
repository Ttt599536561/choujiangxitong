/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface-1': '#0F131C',
        'surface-2': '#161D2B',
        'surface-3': '#1E2636',
        'gold': '#E9A568',
        'primary-red': '#DC2626',
        'accent-cyan': '#38BDF8',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
