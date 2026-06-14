/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: update this list if you add folders that contain className usage.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Base comic palette — saturated and flat.
        ink: '#0A0A0A',
        paper: '#FDF6E3',
        // Per-sergeant accent palettes (see src/constants/characters.ts).
        gomez: {
          DEFAULT: '#2E5E3A', // verde militar
          dark: '#1B3A2F',
          accent: '#E3B23C', // dorado
        },
        rex: {
          DEFAULT: '#1E3A8A', // azul marino
          dark: '#0F1F4D',
          accent: '#E01E37', // rojo
        },
        valentina: {
          DEFAULT: '#D6219B', // rosa magenta
          dark: '#1A1A1A', // negro
          accent: '#FF4FD8',
        },
        fabianski: {
          DEFAULT: '#7C3AED', // morado
          dark: '#4C1D95',
          accent: '#FF7AB6', // arcoíris acento
        },
      },
      fontFamily: {
        // Loaded via expo-font in app/_layout.tsx — display = comic, body = sans.
        display: ['Bangers', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        // Hard offset comic shadow (used on web; native uses borders).
        comic: '4px 4px 0 0 #0A0A0A',
      },
      borderWidth: {
        comic: '3px',
      },
    },
  },
  plugins: [],
};
