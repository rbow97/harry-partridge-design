import React from "react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { TypedObject } from "@portabletext/types";
import { getImageDimensions } from "@sanity/asset-utils";
import { imageSource } from "@/lib/sanity";
import { SIZES, sized, srcset } from "@/lib/images";
import { videoAnchor } from "@/lib/video";

/**
 * Portable Text from Sanity, rendered to static HTML (these components take no client
 * directive, so they ship no JS). Three voices:
 * - SheetText: a Bio or Contact page. Harry writes the lede as "h1" blocks in Studio, so
 *   h1 sets large and "normal" is body; blank blocks are skipped; images are lifted out.
 * - RecordWords: a project's description, in the words column.
 * - RecordWork: a project's content, the work: photos (each with its own caption and size), photos
 *   side by side, quotes and text, every photo at its own proportions. Content from before those
 *   blocks still reads any text after a photo as its caption.
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
    normal: ({ children }) => (hasText(children) ? <p className="text-body leading-relaxed">{linkify(children)}</p> : null),
    h1: ({ children }) =>
      hasText(children) ? <p className="text-lead leading-tight tracking-tight max-w-[32ch]">{linkify(children)}</p> : null,
    h2: ({ children }) => (hasText(children) ? <p className="text-lead leading-tight tracking-tight">{linkify(children)}</p> : null),
    h3: ({ children }) => (hasText(children) ? <p className="hp-label text-muted pt-4">{children}</p> : null),
    blockquote: ({ children }) => <blockquote className="border-l border-ink pl-5 italic">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="text-body leading-relaxed pl-5 list-disc marker:text-accent">{children}</ul>,
    number: ({ children }) => <ol className="text-body leading-relaxed pl-5 list-decimal marker:text-accent">{children}</ol>,
  },
  marks: link,
  types: { image: () => null },
};

const words = (embedded: string[]): PortableTextComponents => ({
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="text-small leading-snug">{children}</p> : null),
    h1: ({ children }) => (hasText(children) ? <p className="text-body leading-snug">{children}</p> : null),
    h2: ({ children }) => (hasText(children) ? <p className="text-body leading-snug">{children}</p> : null),
  },
  marks: recordLink(embedded),
  types: { image: () => null },
});

// one photo in the work column, at its own proportions. `sizes` says how wide it shows, so the
// browser fetches the smallest width that stays sharp
function WorkImage({ image, sizes = SIZES.work }: { image: ImageBlock; sizes?: string }) {
  if (!image?.asset?._ref) return null;
  const { width, height } = getImageDimensions(image);
  return (
    <img
      src={sized(imageSource(image), 1280)}
      srcSet={srcset(imageSource(image))}
      sizes={sizes}
      alt={image.alt ?? ""}
      className="hp-img w-full h-auto"
      style={{ aspectRatio: `${width} / ${height}` }}
      loading="lazy"
      decoding="async"
    />
  );
}

const Caption = ({ text }: { text?: string | null }) =>
  text?.trim() ? <figcaption className="mt-2 text-small leading-snug text-muted max-w-[52ch]">{text}</figcaption> : null;

type Figure = { image: ImageBlock; caption?: string | null; size?: string | null };
type Pair = { images?: ImageBlock[] | null; caption?: string | null };
type Quote = { text?: string | null; cite?: string | null };

// a photo's width in the column: inset and half keep portrait photos from running very tall
const FIGURE_WIDTH: Record<string, string> = { full: "w-full", inset: "md:w-2/3", half: "md:w-1/2" };

/**
 * The work column. `legacy` is content from before the blocks, plain paragraphs between photos:
 * there a paragraph is read as a caption for the photo above it. In the block form each photo
 * carries its own caption, so a paragraph is just text, set small in ink so it reads but doesn't
 * compete with the words column
 */
const work = (embedded: string[], legacy: boolean): PortableTextComponents => ({
  block: {
    normal: ({ children }) =>
      !hasText(children) ? null : legacy ? (
        // text in the work column is a caption for the image above it: small, quiet and drawn up close
        // to it, so the words column stays the one place to read and the two don't compete
        <p className="-mt-3 md:-mt-5 text-small leading-snug text-muted max-w-[52ch]">{children}</p>
      ) : (
        // paragraphs that follow one another close up to read as one passage: the column's gap is for blocks
        <p className="text-small leading-relaxed max-w-[60ch] [p+&]:-mt-3 md:[p+&]:-mt-5">{children}</p>
      ),
  },
  marks: recordLink(embedded),
  types: {
    image: ({ value }: { value: ImageBlock }) => (
      <figure>
        <WorkImage image={value} />
      </figure>
    ),
    figure: ({ value }: { value: Figure }) => (
      <figure className={FIGURE_WIDTH[value.size ?? "full"] ?? "w-full"}>
        <WorkImage image={value.image} sizes={value.size && value.size !== "full" ? SIZES.workHalf : SIZES.work} />
        <Caption text={value.caption} />
      </figure>
    ),
    pair: ({ value }: { value: Pair }) => {
      const images = (value.images ?? []).filter((i) => i?.asset?._ref);
      if (!images.length) return null;
      return (
        <figure>
          <div className={`grid gap-3 md:gap-5 items-start ${images.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {images.map((image) => (
              <WorkImage key={image._key} image={image} sizes={images.length === 3 ? SIZES.workThird : SIZES.workHalf} />
            ))}
          </div>
          <Caption text={value.caption} />
        </figure>
      );
    },
    quote: ({ value }: { value: Quote }) =>
      value.text?.trim() ? (
        <blockquote className="max-w-[36ch] py-2">
          <p className="text-lead leading-tight tracking-tight">“{value.text.trim()}”</p>
          {value.cite?.trim() && <footer className="mt-3 hp-label text-muted">{value.cite.trim()}</footer>}
        </blockquote>
      ) : null,
    // video blocks play as islands between the runs of content (the record page splits at them)
    video: () => null,
  },
});

// the Bio's lede: Harry's heading blocks, large, the statement the page opens on
const ledeLine = ({ children }: { children?: React.ReactNode }) =>
  hasText(children) ? <p className="text-lead leading-[1.18] tracking-tight">{linkify(children)}</p> : null;
// every heading level sets the same: Harry picks whichever in Studio, and it's all the one statement
const lede: PortableTextComponents = {
  block: { h1: ledeLine, h2: ledeLine, h3: ledeLine, h4: ledeLine, h5: ledeLine, h6: ledeLine, normal: ledeLine },
  marks: link,
};

// anything on a Bio that isn't the lede or a sheet row, set small so it reads as an aside
const notes: PortableTextComponents = {
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="text-small leading-snug max-w-[60ch]">{linkify(children)}</p> : null),
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
type RecordProps = { value: Content; embedded?: string[]; legacy?: boolean };
export const RecordWords = ({ value, embedded = [] }: RecordProps) => <PortableText value={value} components={words(embedded)} />;
export const RecordWork = ({ value, embedded = [], legacy = false }: RecordProps) => (
  <PortableText value={value} components={work(embedded, legacy)} />
);

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
        src={sized(imageSource(image), 960)}
        srcSet={srcset(imageSource(image))}
        sizes={SIZES.sheetTray}
        alt={image.alt ?? ""}
        className="hp-img w-full h-auto"
        style={{ aspectRatio: `${width} / ${height}` }}
        loading={index === 0 ? "eager" : "lazy"}
      />
    </figure>
  );
}
