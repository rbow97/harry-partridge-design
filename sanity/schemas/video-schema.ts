import { defineField, defineType } from "sanity";
import { parseVideo } from "../../src/lib/video";

/**
 * A video in a project's content: a YouTube or Vimeo link that plays in place on the record page,
 * where it sits in the content. The site shows a still and loads the player only on play.
 */
export default defineType({
  name: "video",
  title: "Video",
  type: "object",
  fields: [
    defineField({
      name: "url",
      title: "Link",
      description: "Paste the YouTube or Vimeo link as it appears in the address bar.",
      type: "url",
      validation: (rule) =>
        rule.required().custom((url) => (!url || parseVideo(url) ? true : "This needs to be a YouTube or Vimeo link")),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      description: "Shown under the video, and read out as its name. Something like 'Exhibition film'.",
      type: "string",
    }),
    defineField({
      name: "transcript",
      title: "Transcript",
      description:
        "What's said in the video, and anything important that's only shown. Readers who can't hear it open this under the video. Leave a blank line between paragraphs.",
      type: "text",
      rows: 6,
    }),
  ],
  preview: {
    select: { title: "caption", subtitle: "url" },
    prepare: ({ title, subtitle }) => ({ title: title || "Video", subtitle }),
  },
});
