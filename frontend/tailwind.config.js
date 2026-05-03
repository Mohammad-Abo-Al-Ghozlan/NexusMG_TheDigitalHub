/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        /* NexusMG Custom Palette */
        nexus: {
          bg: '#0A0A0F',
          surface: '#111118',
          'surface-hover': '#16161F',
          border: '#1E1E2E',
          'border-hover': '#2A2A3E',
          violet: '#6C63FF',
          'violet-hover': '#5B54E6',
          cyan: '#00D4FF',
          success: '#00C896',
          warning: '#FFB830',
          danger: '#FF4D6D',
          text: '#F0F0FF',
          'text-secondary': '#8888AA',
          'text-muted': '#44445A',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(108, 99, 255, 0.2)',
        'glow-violet-lg': '0 0 40px rgba(108, 99, 255, 0.3), 0 0 80px rgba(108, 99, 255, 0.1)',
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.2)',
        'glow-success': '0 0 20px rgba(0, 200, 150, 0.2)',
        'glow-danger': '0 0 20px rgba(255, 77, 109, 0.2)',
      },
      animation: {
        'grid-move': 'gridMove 20s linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
