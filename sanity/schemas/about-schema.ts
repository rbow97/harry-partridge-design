import { defineArrayMember, defineField, defineType } from "sanity";
import { altField } from "./image-alt";

/**
 * The Bio page's content, in parts the page lays out: the statement, the portrait and the facts.
 * Until it has a lede the Bio page keeps reading its Page document as before (src/lib/site.ts).
 */
export default defineType({
  name: "about",
  title: "About",
  type: "document",
  fields: [
    defineField({
      name: "lede",
      title: "Statement",
      description: "The large text the Bio page opens on. A paragraph or two.",
      type: "array",
      of: [defineArrayMember({ type: "block", styles: [{ title: "Normal", value: "normal" }], lists: [] })],
    }),
    defineField({
      name: "portrait",
      title: "Portrait",
      type: "image",
      options: { hotspot: true },
      fields: [altField(true)],
    }),
    defineField({
      name: "sections",
      title: "Facts",
      description: "The ruled columns under the statement, like Clients or Publications.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "section",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "items",
              title: "Items",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "item",
                  fields: [
                    defineField({ name: "text", title: "Text", type: "string", validation: (rule) => rule.required() }),
                    defineField({
                      name: "project",
                      title: "Project",
                      description: "Links the item to a project on the site, like a client to the work made with them.",
                      type: "reference",
                      to: [{ type: "project" }],
                    }),
                    defineField({
                      name: "url",
                      title: "Link",
                      description: "Or a link elsewhere, like an article. A project, if chosen, wins.",
                      type: "url",
                    }),
                  ],
                  preview: { select: { title: "text", subtitle: "project.name" } },
                }),
              ],
            }),
          ],
          preview: { select: { title: "label" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "About" }) },
});
