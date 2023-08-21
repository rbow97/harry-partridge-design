import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
      },
      fontFamily: {
        inconsolata: ["Inconsolata", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
