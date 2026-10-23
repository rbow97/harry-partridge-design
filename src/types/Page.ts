import type { PortableTextBlock } from "@portabletext/types";

/** A Sanity page (Bio, Contact) */
export type Page = {
  _id: string;
  _createdAt: string;
  title: string;
  slug: string;
  // only on a single page (getPage)
  content?: PortableTextBlock[];
};
