import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      colors: {
        hub: {
          bg: "#0F172A",
          panel: "#111827",
          panel2: "#172033",
          border: "#334155",
          text: "#F8FAFC",
          muted: "#94A3B8",
          green: "#22C55E",
          blue: "#38BDF8"
        }
      },
      boxShadow: {
        hub: "0 20px 70px rgba(2, 6, 23, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
