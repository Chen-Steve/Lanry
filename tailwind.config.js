/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

module.exports = config; 