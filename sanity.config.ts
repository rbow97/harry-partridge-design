import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import schemas from "./sanity/schemas";

// The Studio, embedded at /admin by @sanity/astro (which owns the base path)
const config = defineConfig({
  projectId: "aewk7apr",
  dataset: "production",
  title: "Harry Partridge Design",
  plugins: [structureTool()],
  schema: { types: schemas },
});

export default config;
