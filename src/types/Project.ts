import type { ProjectQueryResult, ProjectsQueryResult } from "@/sanity.types";

// Generated from the schema and the queries in lib/sanity.ts (`npm run typegen`), so these always say
// what the queries return. Text and names come back as `string | null`: the schema requires them, but
// a draft or an old document can still be missing one, so the pages check before using them

/** A project or development record, as the homepage and the project bar get it (projectsQuery) */
export type Project = ProjectsQueryResult[number];

/** One record page's project, with its content and development records (projectQuery) */
export type ProjectRecord = NonNullable<ProjectQueryResult>;

/** A development record as its main project's page lists it */
export type DevelopmentRecord = ProjectRecord["development"][number];

/** A project the site can list and link to: one with its name and slug filled in */
export type Listed = Project & { name: string; slug: string };
export const isListed = (p: Project): p is Listed => !!p.name && !!p.slug;

/** The link text for a development record */
export const recordLabel = (r: { recordLabel?: string | null }) => r.recordLabel?.trim() || "Development";
