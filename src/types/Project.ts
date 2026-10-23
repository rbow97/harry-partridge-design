import type { PortableTextBlock } from "@portabletext/types";

/** A project record, as the queries in lib/sanity.ts return it */
export type Project = {
  _id: string;
  _createdAt: string;
  name: string;
  slug: string;
  image?: string;
  imageAlt?: string;
  priority: number | null;
  // only on a single record (getProject)
  content?: PortableTextBlock[];
  description?: PortableTextBlock[];
  partOf?: string; // _id of the main project
  themes?: string[];
  disciplines?: string[];
  summary?: string;
  year?: number;
  materials?: string;
  process?: string;
  location?: string;
  collaborators?: string;
  press?: { title?: string; url?: string }[];
  audio?: string;
};
