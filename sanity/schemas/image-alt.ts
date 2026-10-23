import { defineField } from "sanity";

/**
 * The alt field every image carries: what the photo shows, for people who can't see it.
 * `required` makes it block publishing (the main image), otherwise it warns (images in content).
 */
export const altField = (required: boolean) =>
  defineField({
    name: "alt",
    title: "Alt text",
    description: "What the photo shows, for people who can't see it. Leave out 'photo of'.",
    type: "string",
    validation: (rule) => {
      const check = rule.custom((alt, context) => {
        const image = context.parent as { asset?: unknown } | undefined;
        return image?.asset && !alt?.trim() ? "Describe the photo for people who can't see it" : true;
      });
      return required ? check : check.warning();
    },
  });
