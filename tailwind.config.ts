import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0B10",
        bgsoft: "#0F1119",
        surface: "#141726",
        surfacehi: "#1B1F33",
        border: "rgba(255,255,255,0.08)",
        borderstrong: "rgba(255,255,255,0.14)",
        ink: "#F4F5FA",
        mute: "#8A8FA8",
        faint: "#565B72",
        violet: {
          DEFAULT: "#8B7CFB",
          dim: "#6656D6",
        },
        gold: {
          DEFAULT: "#F4B740",
          dim: "#D99A1F",
        },
        good: "#3DD68C",
        bad: "#F6685C",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
