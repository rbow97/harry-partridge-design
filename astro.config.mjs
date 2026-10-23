// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sanity from "@sanity/astro";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// Static site: every page is built from Sanity at build time. Content changes need a
// rebuild, so point a Sanity webhook at Vercel's deploy hook once this is live.
export default defineConfig({
  output: "static",
  adapter: vercel(),
  integrations: [
    sanity({
      projectId: "aewk7apr",
      dataset: "production",
      apiVersion: "2023-08-20",
      useCdn: false,
      // the Studio lives at /admin, as it did before
      studioBasePath: "/admin",
    }),
    react(),
  ],
  // the homepage is the projects index; the old grid page is gone
  redirects: {
    "/projects": "/",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
