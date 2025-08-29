import { defineConfig } from "vite";
import type { Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve, join } from "node:path";
import { cp } from "node:fs/promises";

function afterBuildPlugin(): Plugin {
  let outDir = "dist"; // 默认值

  return {
    name: "after-build-plugin",
    configResolved(config) {
      outDir = config.build.outDir || "dist";
    },
    async closeBundle() {
      const root = process.cwd();

      await cp(join(root, "icons/"), join(root, outDir, "icons/"), {
        recursive: true,
      });

      await cp(
        join(root, "manifest.json"),
        join(root, outDir, "manifest.json")
      );
    },
  };
}

export default defineConfig({
  plugins: [vue(), afterBuildPlugin()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        bookmarks: resolve(__dirname, "bookmarks.html"),
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    emptyOutDir: true,
    minify: false,
  },
  base: "./",
});
