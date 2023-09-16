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
};
