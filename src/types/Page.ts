import type { PageQueryResult, PagesQueryResult } from "@/sanity.types";

// generated from the schema and the queries in lib/sanity.ts (`npm run typegen`)

/** A Sanity page (Bio, Contact) as the nav lists it (pagesQuery) */
export type Page = PagesQueryResult[number];

/** One page with its content (pageQuery) */
export type PageWithContent = NonNullable<PageQueryResult>;
