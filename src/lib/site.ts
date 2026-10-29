import type { TypedObject } from "@portabletext/types";
import type { AboutQueryResult, ContactQueryResult, SettingsQueryResult } from "@/sanity.types";
import type { ImageBlock } from "@/components/RichText";
import { readBio, readContact, type Row } from "@/lib/info";

/**
 * Site settings, About and Contact are one-off documents in Studio (sanity/schemas). Each may not
 * exist yet, or be half filled in, so everything here falls back to what the site shipped with,
 * a field at a time. Harry can fill them in whenever he likes, and nothing changes until he does.
 */

// ---- site settings ----

export type Mode = "materials" | "sound" | "living";
/** the homepage statement: plain text, and the words that turn on a mode */
export type SentencePart = string | readonly [string, Mode];

export const FALLBACK = {
  name: "Harry Partridge",
  homeTitle: "Harry Partridge Design",
  description: "Portfolio site for Harry Partridge",
  ambient: "/assets/harry-grad-movie.mp4",
  statement: [
    "I am a designer trained in art and engineering, building working objects from ",
    ["materials", "materials"],
    ", ",
    ["sound", "sound"],
    " and ",
    ["living systems", "living"],
    ".",
  ] as SentencePart[],
};

type Span = { _type?: string; text?: string; marks?: string[] };
type ModeDef = { _key: string; _type: string; mode?: string | null };
const MODES: Mode[] = ["materials", "sound", "living"];

/**
 * What each mode does to the page, in words, for people who can't see it happen: read out when a
 * mode is switched on (the homepage's live region). A new mode needs its line here too
 */
export const MODE_DESCRIPTIONS: Record<Mode, string> = {
  materials: "Materials mode on. The headline is sewn in cross-stitch and the photos turn to felt.",
  sound: "Sound mode on. The photos become records turning on a tape machine.",
  living: "Living systems mode on. The photos break up into a flock that follows the pointer.",
};

/**
 * The statement's first paragraph as the homepage renders it: runs of plain text, and each word
 * Harry marked with a Mode as a word of its own. Null when there's no text, so the fallback shows
 */
type Statement = NonNullable<SettingsQueryResult>["statement"];
export function statementParts(blocks: Statement): SentencePart[] | null {
  const block = blocks?.[0];
  if (!block) return null;
  const modes = new Map(((block.markDefs ?? []) as ModeDef[]).filter((m) => m._type === "mode").map((m) => [m._key, m.mode]));
  const parts: SentencePart[] = [];
  for (const span of (block.children ?? []) as Span[]) {
    const text = span.text ?? "";
    if (!text) continue;
    const mode = span.marks?.map((k) => modes.get(k)).find((m): m is Mode => !!m && MODES.includes(m as Mode));
    const last = parts.at(-1);
    // neighbouring spans in the same voice join up, so a word split by an edit stays one word
    if (mode) {
      if (Array.isArray(last) && last[1] === mode) parts[parts.length - 1] = [last[0] + text, mode];
      else parts.push([text, mode]);
    } else if (typeof last === "string") parts[parts.length - 1] = last + text;
    else parts.push(text);
  }
  return parts.some((p) => (typeof p === "string" ? p : p[0]).trim()) ? parts : null;
}

/** the settings the layout and homepage use, each filled in or falling back */
export function siteSettings(s: SettingsQueryResult) {
  return {
    name: s?.title?.trim() || FALLBACK.name,
    homeTitle: s?.title?.trim() || FALLBACK.homeTitle,
    description: s?.description?.trim() || FALLBACK.description,
    ambient: s?.ambient || FALLBACK.ambient,
    shareImage: s?.shareImage ?? null,
    shareImageAlt: s?.shareImageAlt ?? null,
    statement: statementParts(s?.statement ?? null) ?? FALLBACK.statement,
  };
}

// ---- about (the Bio page) ----

export type Bio = { lede: TypedObject[]; rows: Row[]; notes: TypedObject[]; images: ImageBlock[] };

/**
 * The Bio page's parts: from the About document once it has a statement, otherwise read from the
 * Page document's free text as before (lib/info.ts)
 */
export function bioFrom(about: AboutQueryResult, pageContent: unknown[]): Bio {
  if (!about?.lede?.length) return readBio(pageContent);
  const rows: Row[] = (about.sections ?? [])
    .filter((s) => s.label && s.items?.length)
    .map((s) => ({
      label: s.label!,
      items: (s.items ?? [])
        .filter((i) => i.text)
        .map((i) => ({ text: i.text!, href: i.project ? `/projects/${i.project}` : i.url ?? undefined })),
    }));
  const portrait = about.portrait?.asset ? [{ ...about.portrait, _key: "portrait" } as unknown as ImageBlock] : [];
  return { lede: about.lede, rows, notes: [], images: portrait };
}

// ---- contact ----

export const CONTACT_FALLBACK = {
  headline: "Say hello, I’d love to hear from you.",
  intro: "Whether it’s a project, a collaboration or a half-formed idea, I’m always up for a chat.",
};

/**
 * The Contact page's parts, field by field: the Contact document where it's filled in, otherwise
 * what the page shows now (the lines above, and the email and links read from the Page document)
 */
export function contactFrom(doc: ContactQueryResult, pageContent: unknown[]) {
  const page = readContact(pageContent);
  return {
    headline: doc?.headline?.trim() || CONTACT_FALLBACK.headline,
    intro: doc?.intro?.trim() || CONTACT_FALLBACK.intro,
    emailLead: doc?.emailLead?.trim() || page.intro,
    email: doc?.email?.trim() || page.email,
    links: doc?.links?.length
      ? doc.links.filter((l) => l.label && l.url).map((l) => ({ text: l.label!, href: l.url! }))
      : page.links,
    notes: page.notes,
  };
}
