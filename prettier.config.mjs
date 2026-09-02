/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 keeps its configuration in CSS, so the plugin needs the stylesheet entrypoint
  // to resolve the class order.
  tailwindStylesheet: "./src/styles/globals.css",
};

export default config;
