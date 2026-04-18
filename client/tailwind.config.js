/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--pure-white) / <alpha-value>)",
        black: "rgb(var(--pure-black) / <alpha-value>)",
        slate: {
          50: "rgb(var(--slate-50) / <alpha-value>)",
          100: "rgb(var(--slate-100) / <alpha-value>)",
          200: "rgb(var(--slate-200) / <alpha-value>)",
          300: "rgb(var(--slate-300) / <alpha-value>)",
          400: "rgb(var(--slate-400) / <alpha-value>)",
          500: "rgb(var(--slate-500) / <alpha-value>)",
          600: "rgb(var(--slate-600) / <alpha-value>)",
          700: "rgb(var(--slate-700) / <alpha-value>)",
          800: "rgb(var(--slate-800) / <alpha-value>)",
          900: "rgb(var(--slate-900) / <alpha-value>)",
          950: "rgb(var(--slate-950) / <alpha-value>)"
        },
        amber: {
          100: "rgb(var(--amber-100) / <alpha-value>)",
          200: "rgb(var(--amber-200) / <alpha-value>)",
          300: "rgb(var(--amber-300) / <alpha-value>)",
          400: "rgb(var(--amber-400) / <alpha-value>)",
          500: "rgb(var(--amber-500) / <alpha-value>)",
          600: "rgb(var(--amber-600) / <alpha-value>)",
          700: "rgb(var(--amber-700) / <alpha-value>)"
        },
        emerald: {
          100: "rgb(var(--emerald-100) / <alpha-value>)",
          200: "rgb(var(--emerald-200) / <alpha-value>)",
          300: "rgb(var(--emerald-300) / <alpha-value>)",
          400: "rgb(var(--emerald-400) / <alpha-value>)",
          500: "rgb(var(--emerald-500) / <alpha-value>)",
          600: "rgb(var(--emerald-600) / <alpha-value>)"
        },
        appBg: "rgb(var(--app-bg) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panelSoft: "rgb(var(--panel-soft) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent-2) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Playfair Display", "ui-serif", "Georgia", "serif"]
      },
      boxShadow: {
        glow: "0 18px 40px rgba(12, 5, 4, 0.45)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 12% 8%, rgba(241,124,33,0.26), transparent 32%), radial-gradient(circle at 86% 10%, rgba(241,124,33,0.14), transparent 28%), radial-gradient(circle at 45% 100%, rgba(110,71,34,0.28), transparent 34%)"
      }
    }
  },
  plugins: []
};
