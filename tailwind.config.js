export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#05080F", 900: "#0A0F1E", 800: "#0F1629", 700: "#151E38", 600: "#1C2849" },
        risk: { high: "#EF4444", medium: "#F59E0B", low: "#22C55E", unclassified: "#6B7280", pending: "#FB923C" },
        entity: { org: "#3B82F6", date: "#22C55E", amount: "#EAB308", gst: "#A855F7", clause: "#EF4444", person: "#06B6D4" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-amber": "pulseAmber 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseAmber: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
      },
    },
  },
  plugins: [],
};
