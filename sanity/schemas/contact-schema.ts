import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * The Contact page's content, in parts the page lays out. Each field falls back to what the page
 * shows now until it's filled in (src/lib/site.ts), so this can be completed a piece at a time.
 */
export default defineType({
  name: "contact",
  title: "Contact",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      title: "Headline",
      description: "The large line the page opens on.",
      type: "string",
    }),
    defineField({
      name: "intro",
      title: "Intro",
      description: "A sentence under the headline.",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "emailLead",
      title: "Before the email",
      description: "The few words that lead into the address, like 'Email me at'.",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: "links",
      title: "Links",
      description: "Set out along the foot of the page, like LinkedIn.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "link",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "url", title: "Link", type: "url", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Contact" }) },
});
