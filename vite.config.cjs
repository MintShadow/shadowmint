const { defineConfig } = require("vite");

module.exports = defineConfig({
  server: {
    host: true,
    port: 5173
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
});