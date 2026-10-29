import { sanityClient } from "sanity:client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { defineQuery } from "groq";

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
  // the photo's main colour, which Sanity works out on upload: shown in its place while it loads
  "imageColor": image.asset->metadata.palette.dominant.background,
  orderRank,
  priority,
  "audio": audio.asset->url,
  "partOf": partOf._ref,
  recordLabel,
  disciplines,
  // fall back to Harry's existing description until a summary is written
  "summary": coalesce(summary, pt::text(description))
`;

// defineQuery lets TypeGen read each query and generate its result type (src/sanity.types.ts), and the
// client then types each fetch from it. Run `npm run typegen` after changing a query or the schema
// a project with no name or slug yet (a half-made entry) can't be linked to, so it's left out
export const projectsQuery = defineQuery(`*[_type == "project" && defined(name) && defined(slug.current)]{ ${projectCore} }`);
export const getProjects = () => sanityClient.fetch(projectsQuery);

export const projectQuery = defineQuery(`*[_type == "project" && slug.current == $slug][0]{
      ${projectCore},
      description,
      content,
      audioTranscript,
      year,
      materials,
      process,
      location,
      collaborators,
      press,
      // a development record links back to its main project
      "parent": partOf->{ name, "slug": slug.current },
      // a main project shows its development records at the end of the page
      "development": *[_type == "project" && partOf._ref == ^._id] | order(orderRank asc, coalesce(priority, 999) asc){
        _id,
        name,
        "slug": slug.current,
        "image": image.asset->url,
        "imageColor": image.asset->metadata.palette.dominant.background,
        recordLabel,
        "summary": coalesce(summary, pt::text(description))
      }
    }`);
export const getProject = (slug: string) => sanityClient.fetch(projectQuery, { slug });

export const pagesQuery = defineQuery(`*[_type == "page" && defined(title) && defined(slug.current)]{ _id, _createdAt, title, "slug": slug.current }`);
export const getPages = () => sanityClient.fetch(pagesQuery);

export const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]{ _id, _createdAt, title, "slug": slug.current, content }`);
export const getPage = (slug: string) => sanityClient.fetch(pageQuery, { slug });

// the three one-off documents (sanity/schemas), each at its fixed id. Any of them may not exist yet,
// so every query returns null until Harry publishes it, and src/lib/site.ts falls back
export const settingsQuery = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  title,
  description,
  "shareImage": shareImage.asset->url,
  "shareImageAlt": shareImage.alt,
  statement,
  "ambient": ambient.asset->url
}`);
export const getSettings = () => sanityClient.fetch(settingsQuery);

export const aboutQuery = defineQuery(`*[_type == "about" && _id == "about"][0]{
  lede,
  portrait,
  sections[]{ _key, label, items[]{ _key, text, url, "project": project->slug.current } }
}`);
export const getAbout = () => sanityClient.fetch(aboutQuery);

export const contactQuery = defineQuery(`*[_type == "contact" && _id == "contact"][0]{ headline, intro, emailLead, email, links[]{ _key, label, url } }`);
export const getContact = () => sanityClient.fetch(contactQuery);

const builder = createImageUrlBuilder(sanityClient);
/** a Sanity image's own URL, with any crop set in Studio applied, for lib/images.ts to size */
export const imageSource = (source: Parameters<typeof builder.image>[0]) => builder.image(source).url();
