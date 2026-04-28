/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "system-ui", "sans-serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            a: {
              color: "#0ea5e9",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
