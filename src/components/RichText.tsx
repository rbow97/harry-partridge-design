import React from "react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { getImageDimensions } from "@sanity/asset-utils";
import { imageUrl } from "@/lib/sanity";

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

const linkClass = "text-rust underline decoration-1 underline-offset-4 hover:decoration-2 break-words";

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

const link: PortableTextComponents["marks"] = {
  link: ({ value, children }) => (
    <a
      href={value?.href?.trim()}
      {...(value?.blank || /^https?:/.test(value?.href ?? "") ? { target: "_blank", rel: "noopener" } : {})}
      className={linkClass}
    >
      {children}
    </a>
  ),
};

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
    bullet: ({ children }) => <ul className="text-lg md:text-xl leading-relaxed pl-5 list-disc marker:text-rust">{children}</ul>,
    number: ({ children }) => <ol className="text-lg md:text-xl leading-relaxed pl-5 list-decimal marker:text-rust">{children}</ol>,
  },
  marks: link,
  types: { image: () => null },
};

const words: PortableTextComponents = {
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="text-sm leading-snug">{children}</p> : null),
    h1: ({ children }) => (hasText(children) ? <p className="text-base md:text-lg leading-snug">{children}</p> : null),
    h2: ({ children }) => (hasText(children) ? <p className="text-base md:text-lg leading-snug">{children}</p> : null),
  },
  marks: link,
  types: { image: () => null },
};

const work: PortableTextComponents = {
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="text-sm md:text-base leading-relaxed max-w-[60ch]">{children}</p> : null),
  },
  marks: link,
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
  },
};

export const SheetText = ({ value }: { value: PortableTextBlock[] }) => <PortableText value={value} components={sheet} />;
export const RecordWords = ({ value }: { value: PortableTextBlock[] }) => <PortableText value={value} components={words} />;
export const RecordWork = ({ value }: { value: PortableTextBlock[] }) => <PortableText value={value} components={work} />;

/** a page image in a specimen tray, beside the text */
export function SheetTray({ image, index }: { image: ImageBlock; index: number }) {
  const { width, height } = getImageDimensions(image);
  return (
    <figure className="relative border border-ink p-7 pt-10 pb-10">
      <span aria-hidden="true">
        {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((c) => (
          <span key={c} className={`hp-mark absolute w-3 h-3 border-ink/50 ${c}`} />
        ))}
      </span>
      <figcaption className="absolute top-5 left-7 hp-label text-[10px] text-rust">Fig. {String(index + 1).padStart(2, "0")}</figcaption>
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
