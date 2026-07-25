import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";

export default defineConfig({
  base: "/",
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    compression({ algorithms: ["brotliCompress"], exclude: [/\.(br)$/, /\.(gz)$/] }),
    compression({ algorithms: ["gzip"], exclude: [/\.(br)$/, /\.(gz)$/] }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 400,
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("scheduler") || /[\\/]react[\\/]/.test(id))
            return "vendor-react";
          if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router"))
            return "vendor-router";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("i18next") || id.includes("react-i18next")) return "vendor-i18n";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("date-fns")) return "vendor-date";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("embla-carousel")) return "vendor-carousel";
        },
      },
    },
  },
});
