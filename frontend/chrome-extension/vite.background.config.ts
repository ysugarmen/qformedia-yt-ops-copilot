import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/background/index.ts"),
      output: {
        format: "es",
        entryFileNames: "background.js"
      }
    }
  }
});
