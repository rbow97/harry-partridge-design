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
      },
      fontFamily: {
        inconsolata: ["Inconsolata", "monospace"],
      },
    },
  },
};
export default config;
