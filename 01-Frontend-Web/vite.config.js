import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  if (command === "build" && environment.VITE_USE_MOCK_API === "true") {
    throw new Error("Production builds cannot enable VITE_USE_MOCK_API.");
  }

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("react")) {
                return "vendor-react";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("qrcode.react")) {
                return "vendor-qrcode";
              }
              return "vendor";
            }
          }
        }
      }
    }
  };
});
