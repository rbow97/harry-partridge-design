import type { PortableTextBlock, TypedObject } from "@portabletext/types";

/**
 * YouTube and Vimeo links in a record's text, turned into videos the page can embed.
 * Harry pastes a link in Studio as usual. The link stays in the words column and jumps
 * to the video, which plays in the work column.
 */

export type Provider = "youtube" | "vimeo";
export type Video = { key: string; provider: Provider; id: string; vertical: boolean; title: string; poster?: string; transcript?: string };

export function parseVideo(href: string | undefined): Pick<Video, "provider" | "id" | "vertical"> | null {
  if (!href) return null;
  let url: URL;
  try {
    url = new URL(href.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  const path = url.pathname.split("/").filter(Boolean);
  if (host === "youtu.be" && path[0]) return { provider: "youtube", id: path[0], vertical: false };
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (path[0] === "watch" && url.searchParams.get("v")) return { provider: "youtube", id: url.searchParams.get("v")!, vertical: false };
    if (path[0] === "shorts" && path[1]) return { provider: "youtube", id: path[1], vertical: true };
    if (path[0] === "embed" && path[1]) return { provider: "youtube", id: path[1], vertical: false };
  }
  if (host === "vimeo.com" && /^\d+$/.test(path[0] ?? "")) return { provider: "vimeo", id: path[0], vertical: false };
  if (host === "player.vimeo.com" && path[0] === "video" && /^\d+$/.test(path[1] ?? "")) return { provider: "vimeo", id: path[1], vertical: false };
  return null;
}

/** the in-page anchor a video link jumps to */
export const videoAnchor = (key: string) => `video-${key}`;

/** the player, loaded only once the visitor presses play: no tracking cookies, no related videos */
export const embedSrc = (v: Pick<Video, "provider" | "id">) =>
  v.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : `https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`;

type LinkDef = { _key: string; _type: string; href?: string };
type Span = { text?: string; marks?: string[] };

/** every video linked from these blocks, in reading order, captioned with its link text */
export function videosIn(content: TypedObject[] | null | undefined): Omit<Video, "poster">[] {
  const blocks = (content ?? []).filter((b): b is PortableTextBlock => b._type === "block");
  return blocks.flatMap((b) =>
    ((b.markDefs ?? []) as LinkDef[]).flatMap((m) => {
      const v = m._type === "link" ? parseVideo(m.href) : null;
      if (!v) return [];
      const title = ((b.children ?? []) as Span[])
        .filter((c) => c.marks?.includes(m._key))
        .map((c) => c.text ?? "")
        .join("")
        .trim();
      return [{ ...v, key: m._key, title: title || "Video" }];
    })
  );
}

/**
 * A still for the play screen, looked up at build time. YouTube's is at a fixed address.
 * Vimeo's comes from its oEmbed, which 404s when the owner has turned embedding off, so
 * that video stays a plain link (null) rather than a player that only says "Sorry".
 */
export async function embeddable(v: Omit<Video, "poster">): Promise<Video | null> {
  if (v.provider === "youtube") return { ...v, poster: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` };
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${v.id}`)}&width=1280`);
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return { ...v, poster: data.thumbnail_url };
  } catch {
    return null;
  }
}

/** A video block from a project's content (sanity/schemas/video-schema.ts), as the same video the link form makes */
export function videoBlock(block: { _key?: string; url?: string | null; caption?: string | null; transcript?: string | null }): Omit<Video, "poster"> | null {
  const v = parseVideo(block.url ?? undefined);
  if (!v || !block._key) return null;
  return { ...v, key: block._key, title: block.caption?.trim() || "Video", ...(block.transcript?.trim() && { transcript: block.transcript.trim() }) };
}
