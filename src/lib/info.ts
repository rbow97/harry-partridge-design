import type { PortableTextBlock } from "@portabletext/types";
import { isImage, type ImageBlock } from "@/components/RichText";

/**
 * Bio and Contact are free text in Studio. These read that text into the parts the pages lay
 * out, so Harry keeps writing the way he does now:
 * - a heading block, whichever level he picks in Studio, is the lede
 * - a line like "Publications: <link>", or "Clients:" followed by a bulleted list, becomes a
 *   labelled row on the record sheet
 * - anything else is a plain note, so nothing he writes is ever dropped
 */

type Span = { _type?: string; text?: string; marks?: string[] };
type LinkDef = { _key: string; _type: string; href?: string };
type Block = PortableTextBlock & { listItem?: string; style?: string };

export type Item = { text: string; href?: string };
export type Row = { label: string; items: Item[] };

const isBlock = (b: unknown): b is Block => (b as { _type?: string })?._type === "block";
const textOf = (b: Block) =>
  ((b.children ?? []) as Span[])
    .map((c) => c.text ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();

/** a bare URL reads as its site, so "https://www.sleek-mag.com/article/…" shows as "sleek-mag.com" */
const siteOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

function linksOf(b: Block): Item[] {
  return ((b.markDefs ?? []) as LinkDef[])
    .filter((m) => m._type === "link" && m.href)
    .map((m) => {
      const href = m.href!.trim();
      const text = ((b.children ?? []) as Span[])
        .filter((c) => c.marks?.includes(m._key))
        .map((c) => c.text ?? "")
        .join("")
        .trim();
      return { href, text: !text || text === href ? siteOf(href) : text };
    });
}

export function readBio(content: unknown[]) {
  const lede: Block[] = [];
  const rows: Row[] = [];
  const notes: Block[] = [];
  const images: ImageBlock[] = [];
  for (let i = 0; i < content.length; i++) {
    const b = content[i];
    if (isImage(b)) images.push(b);
    if (!isBlock(b) || !textOf(b)) continue;
    if (b.style && /^h[1-6]$/.test(b.style)) {
      lede.push(b);
      continue;
    }
    const label = textOf(b).match(/^([^:]{1,80}):\s*(.*)$/);
    if (label && !b.listItem) {
      const items: Item[] = linksOf(b);
      if (!items.length && label[2]) items.push({ text: label[2] });
      // the bulleted list straight after a "Label:" line belongs to it
      while (isBlock(content[i + 1]) && (content[i + 1] as Block).listItem) {
        const li = content[++i] as Block;
        if (textOf(li)) items.push({ text: textOf(li), href: linksOf(li)[0]?.href });
      }
      if (items.length) {
        rows.push({ label: label[1].trim(), items });
        continue;
      }
    }
    notes.push(b);
  }
  return { lede, rows, notes, images };
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

// accounts that no longer exist but are still linked in Studio. Delete an entry once Harry
// removes that line from the Contact page, so a new account of the same kind can show
const RETIRED = ["instagram.com/harrypartridgedesign"];
const retired = (href?: string) => !!href && RETIRED.some((r) => href.replace(/^https?:\/\/(www\.)?/, "").startsWith(r));

export function readContact(content: unknown[]) {
  let email: string | undefined;
  let intro: string | undefined;
  const links: Item[] = [];
  const notes: Block[] = [];
  for (const b of content) {
    if (!isBlock(b) || !textOf(b)) continue;
    const text = textOf(b);
    const found = !email && text.match(EMAIL);
    if (found) {
      email = found[0];
      intro = text.slice(0, found.index).trim() || undefined;
      continue;
    }
    const l = linksOf(b);
    if (l.length) links.push(...l.filter((x) => !retired(x.href)));
    else notes.push(b);
  }
  return { email, intro, links, notes };
}
