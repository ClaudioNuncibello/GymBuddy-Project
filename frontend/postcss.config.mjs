/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // FIX: Tailwind v4 usa questo pacchetto specifico
    '@tailwindcss/postcss': {},
  },
};

export default config;