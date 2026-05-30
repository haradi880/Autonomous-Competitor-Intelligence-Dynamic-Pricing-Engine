import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        graphite: "#243036",
        mist: "#eef3f4",
        cloud: "#f7faf9",
        frost: "rgba(255,255,255,0.74)",
        coral: "#db5c4c",
        fern: "#2f7d59",
        brass: "#b0832f",
        violet: "#6254d9"
      },
      boxShadow: {
        glass: "0 18px 60px rgba(23,33,38,0.10)",
        lift: "0 10px 30px rgba(23,33,38,0.14)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
