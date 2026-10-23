import { sanityClient } from "sanity:client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { Project } from "@/types/Project";
import type { Page } from "@/types/Page";

/**
 * Every read from Sanity. The site is static, so these run at build time; a Sanity
 * webhook into Vercel's deploy hook rebuilds when Harry publishes.
 */

// the fields the homepage and a record page share, so the two queries can't drift
const projectCore = /* groq */ `
  _id,
  _createdAt,
  name,
  "slug": slug.current,
  "image": image.asset->url,
  "imageAlt": image.alt,
  priority,
  "audio": audio.asset->url,
  "partOf": partOf._ref,
  recordLabel,
  themes,
  disciplines,
  // fall back to Harry's existing description until a summary is written
  "summary": coalesce(summary, pt::text(description))
`;

export const getProjects = () => sanityClient.fetch<Project[]>(`*[_type == "project"]{ ${projectCore} }`);

export const getProject = (slug: string) =>
  sanityClient.fetch<Project | null>(
    `*[_type == "project" && slug.current == $slug][0]{
      ${projectCore},
      description,
      content,
      year,
      materials,
      process,
      location,
      collaborators,
      press,
      // a development record links back to its main project
      "parent": partOf->{ name, "slug": slug.current },
      // a main project shows its development records at the end of the page
      "development": *[_type == "project" && partOf._ref == ^._id] | order(coalesce(priority, 999) asc){
        _id,
        name,
        "slug": slug.current,
        "image": image.asset->url,
        recordLabel,
        "summary": coalesce(summary, pt::text(description))
      }
    }`,
    { slug }
  );

export const getPages = () =>
  sanityClient.fetch<Page[]>(`*[_type == "page"]{ _id, _createdAt, title, "slug": slug.current }`);

export const getPage = (slug: string) =>
  sanityClient.fetch<Page | null>(`*[_type == "page" && slug.current == $slug][0]{ _id, _createdAt, title, "slug": slug.current, content }`, {
    slug,
  });

const builder = createImageUrlBuilder(sanityClient);
/** a Sanity image at a given width, in the browser's best format */
export const imageUrl = (source: Parameters<typeof builder.image>[0], width: number) =>
  builder.image(source).width(width).auto("format").url();
