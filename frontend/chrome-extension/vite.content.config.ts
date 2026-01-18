import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/content/inject.ts"),
      output: {
        // IMPORTANT: single file bundle
        format: "iife",
        entryFileNames: "content.js",
        inlineDynamicImports: true
      }
    }
  }
});
