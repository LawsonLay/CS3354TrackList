/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media', 
  content: [
    "./index.html",
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        light: {
          primary: '#f3f4f6',    // More muted light background
          secondary: '#e5e7eb',  // Slightly darker secondary
          tertiary: '#d1d5db',   // Even darker tertiary
          accent: '#9ca3af',     // Muted accent
          surface: '#f8fafc',    // Card/surface background
        },
        // Existing colors
        primary: '#1DA1F2', // Twitter-like blue
        secondary: '#14171A', // Dark mode primary
        accent: '#657786', // Grayish color for text
      },
      backgroundColor: theme => ({
        'light-primary': theme('colors.light.primary'),
        'light-secondary': theme('colors.light.secondary'),
        'light-tertiary': theme('colors.light.tertiary'),
      }),
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-in-out',
        pulse: 'pulse 2s infinite',
        modalBackdrop: 'modalBackdrop 0.3s ease-out forwards',
        formAppear: 'formAppear 0.3s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'slideRight': 'slideRight 0.5s ease-out',
        'slideLeft': 'slideLeft 0.5s ease-out',
        'scaleIn': 'scaleIn 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.05)', opacity: 0.7 },
        },
        modalBackdrop: {
          '0%': { backgroundColor: 'rgba(75, 85, 99, 0)' },
          '100%': { backgroundColor: 'rgba(75, 85, 99, 0.5)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
    },
  },
  variants: {
    extend: {
      opacity: ['group-hover'],
    },
  },
  plugins: [],
}

