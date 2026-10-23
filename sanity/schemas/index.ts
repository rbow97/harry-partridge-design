import project from "./project-schema";
import page from "./page-schema";
import video from "./video-schema";
import siteSettings from "./settings-schema";
import about from "./about-schema";
import contact from "./contact-schema";
import { figure, pair, quote } from "./content-blocks";

const schemas = [project, page, video, figure, pair, quote, siteSettings, about, contact];

/** the documents there's only ever one of, at a fixed id (sanity.config.ts pins them in the Studio) */
export const SINGLETONS = ["siteSettings", "about", "contact"];

export default schemas;
