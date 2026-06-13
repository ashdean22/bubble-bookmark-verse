import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
    // Modern targets — smaller output, no legacy polyfills
    target: "esnext",
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
    rollupOptions: {
      output: {
        // Manual chunk splitting: keeps vendor code in separate long-cached files
        manualChunks: (id) => {
          // recharts + d3 deps — only loaded when Analytics panel opens
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) {
            return "vendor-charts";
          }
          // Radix UI dialog / modal primitives — loaded on first modal open
          if (
            id.includes("@radix-ui/react-dialog") ||
            id.includes("@radix-ui/react-alert-dialog") ||
            id.includes("@radix-ui/react-popover") ||
            id.includes("@radix-ui/react-dropdown-menu") ||
            id.includes("@radix-ui/react-select") ||
            id.includes("@radix-ui/react-tooltip")
          ) {
            return "vendor-radix-overlays";
          }
          // Remaining Radix primitives (checkboxes, sliders, etc.)
          if (id.includes("@radix-ui")) {
            return "vendor-radix-base";
          }
          // React core — always needed, separate for optimal caching
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // react-router — only needed for navigation
          if (id.includes("react-router")) {
            return "vendor-router";
          }
          // Tanstack query
          if (id.includes("@tanstack")) {
            return "vendor-query";
          }
          // lucide icons — medium-sized, loaded early
          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }
          // DOMPurify + Zod security utils
          if (id.includes("dompurify") || id.includes("zod")) {
            return "vendor-security";
          }
        },
      },
    },
  },
}));
