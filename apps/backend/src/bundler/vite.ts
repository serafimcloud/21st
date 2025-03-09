import fs from "fs/promises"
import path from "path"

export const bundleWithVite = async (
  tempDir: string,
  outDir: string,
): Promise<boolean> => {
  try {
    console.log("vite: Starting bundling process...")

    await fs.writeFile(
      path.join(tempDir, "vite.config.js"),
      `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next': path.resolve(__dirname, 'node_modules/next'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: '${path.relative(tempDir, outDir)}',
    sourcemap: false,
    minify: true,
  },
});
      `,
    )

    const { build } = await import("vite")

    await build({
      root: tempDir,
      configFile: path.join(tempDir, "vite.config.js"),
      logLevel: "info",
    })

    console.log("vite: Bundle completed successfully")
    return true
  } catch (error) {
    console.warn("vite: Bundling error:", error)
    return false
  }
}
