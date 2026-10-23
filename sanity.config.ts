import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import schemas, { SINGLETONS } from "./sanity/schemas";

// the three one-off documents, each opened straight from the sidebar at its fixed id
const singletons = [
  { type: "siteSettings", title: "Site settings" },
  { type: "about", title: "About" },
  { type: "contact", title: "Contact" },
];

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
            ...singletons.map(({ type, title }) =>
              S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title))
            ),
            S.divider(),
            orderableDocumentListDeskItem({ type: "project", title: "Projects", S, context }),
            ...S.documentTypeListItems().filter((item) => !["project", ...SINGLETONS].includes(item.getId() ?? "")),
          ]),
    }),
  ],
  schema: {
    types: schemas,
    // a singleton is never made from the "new document" menu: it already has its place in the sidebar
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    // and it can't be deleted, duplicated or unpublished, only edited and published
    actions: (actions, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : actions,
  },
});

export default config;
