import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      width: {
        "600": "600px",
      },
      maxHeight: {
        "500": "500px",
      },
      colors: {
        yellow: "#E2FA00",
        black: "#121212",
        white: "#FEFCFB",
        // Redesign tokens — "precise, tactile, curious, but not cold"
        paper: "#F4F1EA",
        ink: "#1A1A17",
        muted: "#6B675E", // 4.9:1 on paper
        rust: "#A4471F", // accent sampled from microbial leather, 5.3:1 on paper
        rule: "#1A1A1726",
      },
      fontFamily: {
        inconsolata: ["Inconsolata", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
};
export default config;
