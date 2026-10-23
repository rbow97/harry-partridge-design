import { defineArrayMember, defineField, defineType } from "sanity";
import { altField } from "./image-alt";

/** The modes a statement word can turn on, as the homepage knows them (ProjectColumns) */
export const MODES = [
  { title: "Materials", value: "materials" },
  { title: "Sound", value: "sound" },
  { title: "Living systems", value: "living" },
];

/**
 * One document for the whole site: what isn't a project or a page. Every field is optional, and
 * the site falls back to what it shipped with until Harry fills one in (src/lib/site.ts).
 */
export default defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "statement",
      title: "Homepage statement",
      description:
        "The sentence at the top of the homepage. Select a word and add a Mode to make it one of the hover words: Materials, Sound or Living systems.",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [],
            annotations: [
              defineArrayMember({
                name: "mode",
                title: "Mode",
                type: "object",
                fields: [
                  defineField({
                    name: "mode",
                    title: "Mode",
                    type: "string",
                    options: { list: MODES, layout: "radio" },
                    validation: (rule) => rule.required(),
                  }),
                ],
              }),
            ],
          },
        }),
      ],
      validation: (rule) => rule.max(1).warning("The homepage shows the first paragraph only"),
    }),
    defineField({
      name: "ambient",
      title: "Ambient recording",
      description: "Plays quietly under everything while a visitor has the Sound switch on.",
      type: "file",
      options: { accept: "audio/*,video/mp4" },
    }),
    defineField({
      name: "title",
      title: "Site name",
      description: "In the browser tab, after each page's name. Leave blank for 'Harry Partridge'.",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      description: "What search engines and link previews show under the site's name. A sentence or two.",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(200).warning("Search results cut descriptions off around 160 characters"),
    }),
    defineField({
      name: "shareImage",
      title: "Share image",
      description: "The picture a link preview shows when the site is shared. Landscape, about 1200 by 630.",
      type: "image",
      fields: [altField(true)],
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
