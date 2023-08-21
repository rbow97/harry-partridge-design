import { Project } from "@/types/Project";
import { createClient, groq } from "next-sanity";
import clientConfig from "./config/client-config";
import { Page } from "@/types/Page";

export const getProjects = async (): Promise<Project[]> => {
  return createClient(clientConfig).fetch(
    groq`*[_type == "project"]{
      _id,
      _createdAt,
      name,
      "slug": slug.current,
      "image": image.asset->url,
      url,
      content,
    }`
  );
};

export const getProject = async (slug: string): Promise<Project> => {
  return createClient(clientConfig).fetch(
    groq`*[_type == "project" && slug.current == $slug][0]{
      _id,
      _createdAt,
      name,
      "slug": slug.current,
      "image": image.asset->url,
      url,
      content,
    }`,
    {
      slug,
    }
  );
};

export const getPages = async (): Promise<Page[]> => {
  return createClient(clientConfig).fetch(
    groq`*[_type == "page"]{
      _id,
      _createdAt,
      title,
      "slug": slug.current,
    }`
  );
};

export const getPage = async (slug: string): Promise<Page> => {
  return createClient(clientConfig).fetch(
    groq`*[_type == "page" && slug.current == $slug][0]{
      _id,
      _createdAt,
      title,
      "slug": slug.current,
      content,
    }`,
    {
      slug,
    }
  );
};
