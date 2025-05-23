import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        border: 'var(--border)',
        card: 'var(--card)',
      },
      typography: {
        DEFAULT: {
          css: {
            'b, strong': {
              fontWeight: '600',
            },
            'i, em': {
              fontStyle: 'italic',
            },
            'u': {
              textDecoration: 'underline',
            },
            '.chapter-content': {
              'b, strong': {
                fontWeight: '600',
              },
              'i, em': {
                fontStyle: 'italic',
              },
              'u': {
                textDecoration: 'underline',
              },
              'p': {
                marginBottom: '1.5em',
              },
            },
          },
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'fade-up': 'fade-up 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      backgroundColor: {
        container: 'var(--container)',
      },
    },
  },
  plugins: [],
};

export default config;
