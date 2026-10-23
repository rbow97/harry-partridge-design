const project = {
  name: "project",
  title: "Projects",
  type: "document",
  preview: {
    select: { title: "name", parent: "partOf.name", media: "image" },
    prepare: ({ title, parent, media }: any) => ({
      title,
      subtitle: parent ? `Part of: ${parent}` : undefined,
      media,
    }),
  },
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt",
          type: "string",
        },
      ],
    },
    {
      name: "partOf",
      title: "Part of",
      description:
        "For process/development records: pick the main project. It's grouped under that project on the homepage and listed at the end of its page.",
      type: "reference",
      to: [{ type: "project" }],
      options: {
        // only main projects can be parents (no nesting, no self-reference)
        filter: ({ document }: any) => ({
          filter: "!defined(partOf) && !(_id in [$id, $draftId])",
          params: {
            id: String(document._id).replace(/^drafts\./, ""),
            draftId: `drafts.${String(document._id).replace(/^drafts\./, "")}`,
          },
        }),
      },
    },
    {
      name: "recordLabel",
      title: "Link label",
      description:
        "What the link to this record says on the main project, like 'Wire recorder tests'. Leave it blank to show 'Development'.",
      type: "string",
      hidden: ({ document }: any) => !document?.partOf,
    },
    {
      name: "disciplines",
      title: "Disciplines",
      description: "Pick one or two — shown on the homepage as e.g. 'Sound / Textile'",
      hidden: ({ document }: any) => !!document?.partOf, // set on the main project instead
      type: "array",
      of: [{ type: "string" }],
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
      validation: (Rule: any) => Rule.max(2).warning("Two disciplines reads best on the homepage"),
    },
    {
      name: "summary",
      title: "Summary",
      description: "One line for the homepage",
      hidden: ({ document }: any) => !!document?.partOf, // set on the main project instead
      type: "string",
    },
    {
      name: "themes",
      title: "Themes",
      description: "Lights the project up when someone hovers that word on the homepage",
      hidden: ({ document }: any) => !!document?.partOf, // set on the main project instead
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Materials", value: "materials" },
          { title: "Sound", value: "sound" },
          { title: "Living systems", value: "living systems" },
        ],
      },
    },
    // Record metadata (redesign)
    { name: "year", title: "Year", type: "number" },
    { name: "materials", title: "Materials", type: "string" },
    { name: "process", title: "Process", type: "string" },
    { name: "location", title: "Location", type: "string" },
    { name: "collaborators", title: "Collaborators", type: "string" },
    {
      name: "press",
      title: "Press",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", title: "Title", type: "string" },
            { name: "url", title: "URL", type: "url" },
          ],
        },
      ],
    },
    {
      name: "audio",
      title: "Audio clip (Play a spool)",
      type: "file",
      options: { accept: "audio/*" },
    },
    {
      name: "priority",
      title: "Priority",
      type: "number",
    },
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [
        {
          type: "block",
        },
        { type: "image" },
      ],
    },
  ],
};

export default project;
