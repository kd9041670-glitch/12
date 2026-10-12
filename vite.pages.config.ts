import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/12/",
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  build: { outDir: "dist-pages" },
});
