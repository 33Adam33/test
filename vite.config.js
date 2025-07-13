import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";

export default defineConfig({
  base: '/test/', // ⬅️ Replace this with your actual repo name
  plugins: [glsl()],
});
