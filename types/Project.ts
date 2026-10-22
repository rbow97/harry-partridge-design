import { PortableTextBlock } from "sanity";

export type Project = {
  _id: string;
  _createdAt: Date;
  name: string;
  slug: string;
  image: string;
  priority: number | null;
  content: PortableTextBlock[];
  description: PortableTextBlock[];
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
