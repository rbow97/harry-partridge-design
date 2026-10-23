import { defineCliConfig } from "sanity/cli";

// for the Sanity CLI: `npm run typegen` extracts the schema and generates src/sanity.types.ts from the
// queries in src/lib/sanity.ts, so the site's types always match the schema and what each query asks for
export default defineCliConfig({
  api: { projectId: "aewk7apr", dataset: "production" },
  typegen: {
    path: "./src/**/*.{ts,tsx}",
    schema: "./schema.json",
    generates: "./src/sanity.types.ts",
  },
});
