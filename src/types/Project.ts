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
  recordLabel?: string; // what the link to a development record says, "Development" when blank
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
  // only on a single record (getProject)
  parent?: { name: string; slug: string } | null;
  development?: DevelopmentRecord[];
};

/** A development record as its main project's page lists it */
export type DevelopmentRecord = Pick<Project, "_id" | "name" | "slug" | "image" | "recordLabel" | "summary">;

/** The link text for a development record */
export const recordLabel = (r: Pick<Project, "recordLabel">) => r.recordLabel?.trim() || "Development";
