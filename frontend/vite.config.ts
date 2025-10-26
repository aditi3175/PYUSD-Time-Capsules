import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      // To add only specific polyfills, include them here.
      // If no option is passed, adds all polyfills.
      include: ["buffer"],
    }),
  ],

});
