/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-up': {
          '0%': {
            opacity: '0.2',
            transform: 'translateY(40px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'fade-up': 'fade-up 0.9s ease-out'
      }
    }
  },
  plugins: [],
}