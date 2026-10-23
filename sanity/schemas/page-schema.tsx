import { defineArrayMember, defineField, defineType } from "sanity";
import { altField } from "./image-alt";

/** A page of its own, like Bio or Contact */
export default defineType({
  name: "page",
  title: "Pages",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [defineArrayMember({ type: "block" }), defineArrayMember({ type: "image", fields: [altField(false)] })],
    }),
  ],
});
