import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import schemas from "./sanity/schemas";

// The Studio, embedded at /admin by @sanity/astro (which owns the base path)
const config = defineConfig({
  projectId: "aewk7apr",
  dataset: "production",
  title: "Harry Partridge Design",
  plugins: [
    structureTool({
      // Projects is a drag-and-drop list: its order is the homepage drawer's. The first time, choose
      // "Reset Order" from the list's menu to give every existing project a place
      structure: (S, context) =>
        S.list()
          .title("Content")
          .items([
            orderableDocumentListDeskItem({ type: "project", title: "Projects", S, context }),
            ...S.documentTypeListItems().filter((item) => item.getId() !== "project"),
          ]),
    }),
  ],
  schema: { types: schemas },
});

export default config;
