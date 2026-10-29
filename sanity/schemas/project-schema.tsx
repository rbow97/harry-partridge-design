import { defineArrayMember, defineField, defineType } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { altField } from "./image-alt";

/** A project, or a development record that belongs to one (set "Part of") */
export default defineType({
  name: "project",
  title: "Projects",
  type: "document",
  // drag-and-drop order from the Projects list (sanity.config.ts), the order of the homepage drawer
  orderings: [orderRankOrdering],
  preview: {
    select: { title: "name", parent: "partOf.name", media: "image" },
    prepare: ({ title, parent, media }) => ({
      title,
      subtitle: parent ? `Part of: ${parent}` : undefined,
      media,
    }),
  },
  fields: [
    orderRankField({ type: "project", newItemPosition: "after" }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [altField(true)],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "partOf",
      title: "Part of",
      description:
        "For process/development records: pick the main project. It's grouped under that project on the homepage and listed at the end of its page.",
      type: "reference",
      to: [{ type: "project" }],
      options: {
        // only main projects can be parents (no nesting, no self-reference)
        filter: ({ document }) => {
          const id = String(document._id).replace(/^drafts\./, "");
          return { filter: "!defined(partOf) && !(_id in [$id, $draftId])", params: { id, draftId: `drafts.${id}` } };
        },
      },
    }),
    defineField({
      name: "recordLabel",
      title: "Link label",
      description:
        "What the link to this record says on the main project, like 'Wire recorder tests'. Leave it blank to show 'Development'.",
      type: "string",
      hidden: ({ document }) => !document?.partOf,
    }),
    defineField({
      name: "disciplines",
      title: "Disciplines",
      description: "Pick one or two — shown on the homepage as e.g. 'Sound / Textile'",
      hidden: ({ document }) => !!document?.partOf, // set on the main project instead
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        layout: "grid",
        list: [
          { title: "Sound", value: "Sound" },
          { title: "Textile", value: "Textile" },
          { title: "Wearable", value: "Wearable" },
          { title: "Material", value: "Material" },
          { title: "Biodesign", value: "Biodesign" },
          { title: "Installation", value: "Installation" },
          { title: "Film", value: "Film" },
          { title: "Process", value: "Process" },
        ],
      },
      validation: (rule) => rule.max(2).warning("Two disciplines reads best on the homepage"),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      description: "One line for the homepage",
      hidden: ({ document }) => !!document?.partOf, // set on the main project instead
      type: "string",
    }),
    // Record metadata (redesign)
    defineField({ name: "year", title: "Year", type: "number" }),
    defineField({ name: "materials", title: "Materials", type: "string" }),
    defineField({ name: "process", title: "Process", type: "string" }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({ name: "collaborators", title: "Collaborators", type: "string" }),
    defineField({
      name: "press",
      title: "Press",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "audio",
      title: "Audio clip (Play a spool)",
      type: "file",
      options: { accept: "audio/*" },
    }),
    defineField({
      name: "audioTranscript",
      title: "Audio transcript",
      description: "What's said in the clip, for readers who can't hear it. Shown under the spool. Leave a blank line between paragraphs.",
      type: "text",
      rows: 6,
      hidden: ({ document }) => !document?.audio,
    }),
    defineField({
      name: "priority",
      title: "Priority",
      description: "Replaced by dragging projects into order in the Projects list. Kept so older entries still sort until then.",
      type: "number",
      hidden: true,
    }),
    defineField({
      name: "content",
      title: "Content",
      description: "The work, top to bottom: photos, photos side by side, text, quotes and videos. No need for empty lines, the layout spaces them.",
      type: "array",
      of: [
        // text is plain paragraphs with links: headings and lists belong to the words column, not the work
        defineArrayMember({ type: "block", styles: [{ title: "Normal", value: "normal" }], lists: [] }),
        defineArrayMember({ type: "figure" }),
        defineArrayMember({ type: "pair" }),
        defineArrayMember({ type: "quote" }),
        defineArrayMember({ type: "video" }),
        // the old free-standing photo, kept so content from before the blocks still opens. New photos are Photo blocks
        defineArrayMember({ type: "image", title: "Image (old, use Photo)", options: { hotspot: true }, fields: [altField(false)] }),
      ],
      // a warning, not a block on publishing: empty lines do no harm, the site skips them
      validation: (rule) =>
        rule
          .custom((blocks) => {
            const empty = (blocks ?? []).filter(
              (b) => (b as { _type?: string })._type === "block" && !((b as { children?: { text?: string }[] }).children ?? []).some((s) => s.text?.trim())
            );
            return empty.length ? `Remove the ${empty.length} empty paragraph${empty.length > 1 ? "s" : ""}: the layout spaces the blocks` : true;
          })
          .warning(),
    }),
  ],
});
