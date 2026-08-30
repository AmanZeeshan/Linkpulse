/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Syne", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          950: "#07080a",
          900: "#0b0d10",
          800: "#12161c",
          700: "#191f27",
          600: "#232a33",
        },
        mist: {
          100: "#e8edf2",
          300: "#b4c0cc",
          500: "#8b98a5",
        },
        signal: {
          DEFAULT: "#3dffb0",
          dim: "#1fa875",
        },
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
