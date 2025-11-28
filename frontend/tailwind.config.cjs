const colors = require("tailwindcss/colors");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,js,ts,jsx,tsx,css}"
  ],
  safelist: [
    // cores e utilitários mais usados no projeto  mantenha/adicione conforme necessário
    "bg-gray-50","bg-gray-100","bg-gray-200","bg-gray-300","bg-gray-400","bg-gray-500","bg-gray-600","bg-gray-700","bg-gray-800","bg-gray-900",
    "text-gray-50","text-gray-100","text-gray-200","text-gray-300","text-gray-400","text-gray-500","text-gray-600","text-gray-700","text-gray-800","text-gray-900",
    "bg-blue-600","bg-blue-500","bg-green-600","bg-white","bg-black",
    "p-2","p-3","p-4","px-3","py-1","rounded","rounded-md","rounded-full"
  ],
  theme: {
    extend: {
      colors: {
        gray: colors.gray,
        blue: colors.blue,
        green: colors.green,
      }
    },
  },
  plugins: [],
};
