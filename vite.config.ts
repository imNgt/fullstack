import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
console.log(import.meta.dirname);
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  base: "./",
  build: {
    outDir: "docs",
  },
  assetsInclude: ["**/*.md"],
});
