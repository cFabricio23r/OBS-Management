/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obs: {
          950: "#07090d",
          900: "#0d1117",
          850: "#111722",
          800: "#161d2a",
          700: "#222c3d",
          500: "#4d5b70",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
