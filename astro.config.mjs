import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://purdy.dev",
  adapter: vercel(),
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/archive/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
