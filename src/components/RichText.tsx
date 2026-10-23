import React from "react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { TypedObject } from "@portabletext/types";
import { getImageDimensions } from "@sanity/asset-utils";
import { imageUrl } from "@/lib/sanity";
import { videoAnchor } from "@/lib/video";

/**
 * Portable Text from Sanity, rendered to static HTML (these components take no client
 * directive, so they ship no JS). Three voices:
 * - SheetText: a Bio or Contact page. Harry writes the lede as "h1" blocks in Studio, so
 *   h1 sets large and "normal" is body; blank blocks are skipped; images are lifted out.
 * - RecordWords: a project's description, in the words column.
 * - RecordWork: a project's content, the work: every image at its own proportions, full
 *   width of the stack, with any text between them reading as a caption.
 */

export type ImageBlock = { _type: "image"; _key: string; alt?: string; asset: { _ref: string } };
export const isImage = (b: unknown): b is ImageBlock => (b as { _type?: string })?._type === "image";

const hasText = (children: React.ReactNode) =>
  React.Children.toArray(children).some((c) => (typeof c === "string" ? c.trim().length > 0 : true));

const linkClass = "hp-link text-accent break-words";

// an email address typed as plain text becomes a mailto link (the Contact page has one)
const EMAIL = /([\w.+-]+@[\w-]+\.[\w.-]+)/g;
const linkify = (children: React.ReactNode) =>
  React.Children.map(children, (c) =>
    typeof c === "string"
      ? c.split(EMAIL).map((part, i) =>
          i % 2 ? (
            <a key={i} href={`mailto:${part}`} className={linkClass}>
              {part}
            </a>
          ) : (
            part
          )
        )
      : c
  );

type LinkMark = { _key: string; href?: string; blank?: boolean };

const ExternalLink = ({ value, children }: { value?: LinkMark; children: React.ReactNode }) => (
  <a
    href={value?.href?.trim()}
    {...(value?.blank || /^https?:/.test(value?.href ?? "") ? { target: "_blank", rel: "noopener" } : {})}
    className={linkClass}
  >
    {children}
  </a>
);

const link: PortableTextComponents["marks"] = { link: ExternalLink };

// on a record, a link to a video embedded on the page jumps to it in the work column instead of leaving the site
const recordLink = (embedded: string[]): PortableTextComponents["marks"] => ({
  link: ({ value, children }: { value?: LinkMark; children: React.ReactNode }) =>
    value && embedded.includes(value._key) ? (
      <a href={`#${videoAnchor(value._key)}`} className={linkClass}>
        {children}
      </a>
    ) : (
      <ExternalLink value={value}>{children}</ExternalLink>
    ),
});

const sheet: PortableTextComponents = {
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="text-lg md:text-xl leading-relaxed">{linkify(children)}</p> : null),
    h1: ({ children }) =>
      hasText(children) ? <p className="text-2xl md:text-4xl leading-tight tracking-tight max-w-[32ch]">{linkify(children)}</p> : null,
    h2: ({ children }) => (hasText(children) ? <p className="text-2xl md:text-3xl leading-tight tracking-tight">{linkify(children)}</p> : null),
    h3: ({ children }) => (hasText(children) ? <p className="hp-label text-muted pt-4">{children}</p> : null),
    blockquote: ({ children }) => <blockquote className="border-l border-ink pl-5 italic">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="text-lg md:text-xl leading-relaxed pl-5 list-disc marker:text-accent">{children}</ul>,
    number: ({ children }) => <ol className="text-lg md:text-xl leading-relaxed pl-5 list-decimal marker:text-accent">{children}</ol>,
  },
  marks: link,
  types: { image: () => null },
};

const words = (embedded: string[]): PortableTextComponents => ({
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="text-sm leading-snug">{children}</p> : null),
    h1: ({ children }) => (hasText(children) ? <p className="text-base md:text-lg leading-snug">{children}</p> : null),
    h2: ({ children }) => (hasText(children) ? <p className="text-base md:text-lg leading-snug">{children}</p> : null),
  },
  marks: recordLink(embedded),
  types: { image: () => null },
});

const work = (embedded: string[]): PortableTextComponents => ({
  block: {
    // text in the work column is a caption for the image above it: small, quiet and drawn up close
    // to it, so the words column stays the one place to read and the two don't compete
    normal: ({ children }) =>
      hasText(children) ? <p className="-mt-3 md:-mt-5 text-sm leading-snug text-muted max-w-[52ch]">{children}</p> : null,
  },
  marks: recordLink(embedded),
  types: {
    image: ({ value }: { value: ImageBlock }) => {
      if (!value?.asset?._ref) return null;
      const { width, height } = getImageDimensions(value);
      return (
        <figure>
          <img src={imageUrl(value, 1800)} alt={value.alt ?? ""} className="hp-img w-full h-auto" style={{ aspectRatio: `${width} / ${height}` }} loading="lazy" />
        </figure>
      );
    },
    // video blocks play as islands between the runs of content (the record page splits at them)
    video: () => null,
  },
});

// the Bio's lede: Harry's heading blocks, large, the statement the page opens on
const ledeLine = ({ children }: { children?: React.ReactNode }) =>
  hasText(children) ? <p className="text-2xl md:text-[clamp(1.5rem,1.9vw,2.25rem)] leading-[1.18] tracking-tight">{linkify(children)}</p> : null;
// every heading level sets the same: Harry picks whichever in Studio, and it's all the one statement
const lede: PortableTextComponents = {
  block: { h1: ledeLine, h2: ledeLine, h3: ledeLine, h4: ledeLine, h5: ledeLine, h6: ledeLine, normal: ledeLine },
  marks: link,
};

// anything on a Bio that isn't the lede or a sheet row, set small so it reads as an aside
const notes: PortableTextComponents = {
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="text-sm leading-snug max-w-[60ch]">{linkify(children)}</p> : null),
  },
  marks: link,
  types: { image: () => null },
};

// The renderers take any Portable Text array, as PortableText itself does: Sanity's generated types
// (src/sanity.types.ts) describe blocks a little more loosely than PortableTextBlock does
type Content = TypedObject[];
export const InfoLede = ({ value }: { value: Content }) => <PortableText value={value} components={lede} />;
export const InfoNotes = ({ value }: { value: Content }) => <PortableText value={value} components={notes} />;

export const SheetText = ({ value }: { value: Content }) => <PortableText value={value} components={sheet} />;
// embedded: the keys of the video links that play on this page
type RecordProps = { value: Content; embedded?: string[] };
export const RecordWords = ({ value, embedded = [] }: RecordProps) => <PortableText value={value} components={words(embedded)} />;
export const RecordWork = ({ value, embedded = [] }: RecordProps) => <PortableText value={value} components={work(embedded)} />;

/** a page image in a specimen tray, beside the text */
export function SheetTray({ image, index }: { image: ImageBlock; index: number }) {
  const { width, height } = getImageDimensions(image);
  return (
    <figure className="relative border border-ink p-7">
      <span aria-hidden="true">
        {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((c) => (
          <span key={c} className={`hp-mark absolute w-3 h-3 border-ink/50 ${c}`} />
        ))}
      </span>
      <img
        src={imageUrl(image, 1200)}
        alt={image.alt ?? ""}
        className="hp-img w-full h-auto"
        style={{ aspectRatio: `${width} / ${height}` }}
        loading={index === 0 ? "eager" : "lazy"}
      />
    </figure>
  );
}
