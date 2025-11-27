/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // 🎯 Brand Colors
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1e50bb',   // blue-700
          light: '#3b82f6',   // blue-500
        },

        secondary: {
          DEFAULT: '#4b5563', // gray-600
          hover: '#374151',   // gray-700
          light: '#6b7280',   // gray-500
        },

        // Estados
        success: {
          DEFAULT: '#16a34a', // green-600
          light: '#22c55e',
          dark: '#15803d'
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          light: '#ef4444',
          dark: '#b91c1c'
        },
        warning: {
          DEFAULT: '#d97706', // amber-600
          light: '#f59e0b',
          dark: '#b45309'
        },
        info: {
          DEFAULT: '#0284c7', // sky-600
          light: '#0ea5e9',
          dark: '#0369a1'
        },

        // Estrutura
        background: '#f9fafb', // gray-50
        surface: '#ffffff',    // white
      },

      borderRadius: {
        'xl-card': '1rem',
        '2xl-modal': '1.25rem',
      },

      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.04)',
        elevated: '0 4px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
