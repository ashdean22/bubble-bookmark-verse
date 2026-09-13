import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  esbuild: {
    target: "es2018",
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Keep output compatible with older Safari/WebViews so the app boots consistently.
    target: "es2018",
    // Inline small assets as data URIs to save round-trips
    assetsInlineLimit: 4096,
    // Raise chunk-size warning threshold (recharts is legitimately large)
    chunkSizeWarningLimit: 600,
    // Faster minify; CSS split per chunk for better caching
    minify: "esbuild",
    cssCodeSplit: true,
    cssMinify: "esbuild",
    sourcemap: false,
    reportCompressedSize: false,
    modulePreload: { polyfill: true },
    // Let Rollup follow the real dynamic-import boundaries. Manual vendor
    // chunks made shared helpers pull the analytics package into first paint.
  },
}));
