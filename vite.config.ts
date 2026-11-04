import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
          theme: {
            extend: {
              colors: {
                loteria: {
                  pink: '#E91E63',
                  yellow: '#FFEB3B',
                  green: '#4CAF50',
                  blue: '#2196F3',
                  cream: '#FFF9E6',
                },
              },
              fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                serif: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
                loteria: ['"Fraunces"', '"Cinzel"', 'serif'],
              },
            },
          },
          plugins: [],
        }),
        autoprefixer(),
      ],
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
