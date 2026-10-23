import { defineArrayMember, defineField, defineType } from "sanity";
import { altField } from "./image-alt";

/**
 * The blocks a project's content is made of, so each piece says what it is rather than the site
 * guessing: a photo with its own caption, photos side by side, a pull quote. Text and video are the
 * other two (plain paragraphs, and video-schema.ts). Space between blocks comes from the layout.
 */

const photo = (title: string) =>
  defineField({
    name: "image",
    title,
    type: "image",
    options: { hotspot: true },
    fields: [altField(false)],
    validation: (rule) => rule.required(),
  });

export const figure = defineType({
  name: "figure",
  title: "Photo",
  type: "object",
  fields: [
    photo("Photo"),
    defineField({
      name: "caption",
      title: "Caption",
      description: "Shown under the photo. Optional.",
      type: "string",
    }),
    defineField({
      name: "size",
      title: "Size",
      description: "Full is the width of the column. Half and inset suit portrait photos, which run very tall at full width.",
      type: "string",
      initialValue: "full",
      options: {
        list: [
          { title: "Full", value: "full" },
          { title: "Inset", value: "inset" },
          { title: "Half", value: "half" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
  ],
  preview: {
    select: { media: "image", title: "caption", size: "size" },
    prepare: ({ media, title, size }) => ({ media, title: title || "Photo", subtitle: size && size !== "full" ? size : undefined }),
  },
});

export const pair = defineType({
  name: "pair",
  title: "Photos side by side",
  type: "object",
  fields: [
    defineField({
      name: "images",
      title: "Photos",
      description: "Two or three, shown in a row. They sit best when they're the same shape.",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true }, fields: [altField(false)] })],
      validation: (rule) => rule.min(2).max(3).required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      description: "One caption for the row. Optional.",
      type: "string",
    }),
  ],
  // a preview can't select a whole array, so it checks the three places a photo can be
  preview: {
    select: { media: "images.0", title: "caption", a: "images.0.asset", b: "images.1.asset", c: "images.2.asset" },
    prepare: ({ media, title, a, b, c }) => {
      const n = [a, b, c].filter(Boolean).length;
      return { media, title: title || `${n} photos side by side`, subtitle: title ? `${n} photos side by side` : undefined };
    },
  },
});

export const quote = defineType({
  name: "quote",
  title: "Quote",
  type: "object",
  fields: [
    defineField({ name: "text", title: "Quote", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: "cite",
      title: "Who said it",
      description: "Optional, like 'A garment worker in Dhaka'.",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "text", subtitle: "cite" },
  },
});
