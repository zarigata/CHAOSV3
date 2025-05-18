// ==========================================================
// 🎨 C.H.A.O.S. TAILWIND CSS CONFIGURATION 🎨
// ==========================================================
// - MSN MESSENGER INSPIRED COLOR PALETTE
// - CUSTOM ANIMATION PRESETS
// - EXTENDED COMPONENT VARIANTS
// - RESPONSIVE DESIGN BREAKPOINTS
// ==========================================================

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // MSN-inspired color scheme
      colors: {
        // Main brand colors
        msn: {
          primary: "#0066cc", // Classic MSN blue
          secondary: "#6fbe4a", // MSN green
          accent: "#ff6600", // Notification orange
          status: {
            online: "#6fbe4a",
            away: "#ffcc00",
            busy: "#cc0000",
            offline: "#999999",
          },
        },
        // Modern UI scheme
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      // MSN-inspired border radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        msn: "6px", // Classic MSN rounded corners
      },
      // Custom animations
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // MSN notification animation
        "msn-nudge": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
        // MSN sign-in animation
        "msn-signin": {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        // Status change animation
        "status-pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "msn-nudge": "msn-nudge 0.8s ease-in-out",
        "msn-signin": "msn-signin 0.3s ease-out",
        "status-pulse": "status-pulse 2s infinite",
      },
      // Custom box shadows
      boxShadow: {
        'msn': '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 102, 204, 0.15)',
        'msn-hover': '0 4px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 102, 204, 0.2)',
      },
      // MSN-inspired gradients
      backgroundImage: {
        'msn-gradient': 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)',
        'msn-header': 'linear-gradient(to bottom, #0066cc, #004080)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
