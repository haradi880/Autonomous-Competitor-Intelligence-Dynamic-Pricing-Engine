import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        mist: "#eef3f4",
        coral: "#db5c4c",
        fern: "#2f7d59",
        brass: "#b0832f"
      }
    }
  },
  plugins: []
};

export default config;

