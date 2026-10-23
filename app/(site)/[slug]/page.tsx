import { getPage } from "@/sanity/sanity-utils";
import { PortableText, PortableTextComponents } from "@portabletext/react";
import { getImageDimensions } from "@sanity/asset-utils";
import urlBuilder from "@sanity/image-url";
import { createClient } from "next-sanity";
import clientConfig from "@/sanity/config/client-config";
import { notFound } from "next/navigation";
import React from "react";

type Props = {
  params: { slug: string };
};

/**
 * A Sanity page (Bio, Contact) laid out as a record sheet, like the homepage hero:
 * the text runs down the left, any images sit in specimen trays on the right.
 * Harry writes the lede as "h1" blocks in Studio, so those set large and the rest reads as body.
 */

const hasText = (children: React.ReactNode) =>
  React.Children.toArray(children).some((c) => (typeof c === "string" ? c.trim().length > 0 : true));

// an email address typed as plain text becomes a mailto link (the Contact page has one)
const EMAIL = /([\w.+-]+@[\w-]+\.[\w.-]+)/g;
const linkify = (children: React.ReactNode) =>
  React.Children.map(children, (c) =>
    typeof c === "string"
      ? c.split(EMAIL).map((part, i) =>
          i % 2 ? (
            <a key={i} href={`mailto:${part}`} className="text-rust underline decoration-1 underline-offset-4 hover:decoration-2 break-words">
              {part}
            </a>
          ) : (
            part
          )
        )
      : c
  );

const sheetText: PortableTextComponents = {
  block: {
    // blank paragraphs come through from Studio as spacing; the layout spaces itself
    normal: ({ children }) =>
      hasText(children) ? <p className="font-sans text-lg md:text-xl leading-relaxed">{linkify(children)}</p> : null,
    h1: ({ children }) =>
      hasText(children) ? (
        <p className="font-sans text-2xl md:text-4xl leading-tight tracking-tight max-w-[32ch]">{linkify(children)}</p>
      ) : null,
    h2: ({ children }) =>
      hasText(children) ? <p className="font-sans text-2xl md:text-3xl leading-tight tracking-tight">{linkify(children)}</p> : null,
    h3: ({ children }) =>
      hasText(children) ? <p className="font-mono text-[11px] uppercase tracking-wider text-muted pt-4">{children}</p> : null,
    blockquote: ({ children }) => <blockquote className="border-l border-ink pl-5 italic">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="font-sans text-lg md:text-xl leading-relaxed pl-5 list-disc marker:text-rust">{children}</ul>,
    number: ({ children }) => <ol className="font-sans text-lg md:text-xl leading-relaxed pl-5 list-decimal marker:text-rust">{children}</ol>,
  },
  marks: {
    link: ({ value, children }) => (
      <a
        href={value?.href?.trim()}
        {...(value?.blank || /^https?:/.test(value?.href ?? "") ? { target: "_blank", rel: "noopener" } : {})}
        className="text-rust underline decoration-1 underline-offset-4 hover:decoration-2 break-words"
      >
        {children}
      </a>
    ),
  },
  types: {
    // images are lifted out into the trays beside the text (see below)
    image: () => null,
  },
};

type ImageBlock = { _type: "image"; _key: string; alt?: string; asset: { _ref: string } };

function Tray({ image, index }: { image: ImageBlock; index: number }) {
  const { width, height } = getImageDimensions(image);
  const src = urlBuilder(createClient(clientConfig)).image(image).width(1200).auto("format").url();
  const mark = "absolute w-3 h-3 border-ink/50";
  return (
    <figure className="relative border border-ink p-7 pt-10 pb-10">
      <span aria-hidden="true">
        <span className={`hp-mark ${mark} top-3 left-3 border-t border-l`} />
        <span className={`hp-mark ${mark} top-3 right-3 border-t border-r`} />
        <span className={`hp-mark ${mark} bottom-3 left-3 border-b border-l`} />
        <span className={`hp-mark ${mark} bottom-3 right-3 border-b border-r`} />
      </span>
      <span className="absolute top-5 left-7 font-mono text-[10px] uppercase tracking-wider text-rust">
        Fig. {String(index + 1).padStart(2, "0")}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={image.alt ?? ""}
        className="hp-img w-full h-auto"
        style={{ aspectRatio: `${width} / ${height}` }}
        loading={index === 0 ? "eager" : "lazy"}
      />
    </figure>
  );
}

export async function generateMetadata({ params }: Props) {
  const page = await getPage(params.slug);
  return { title: page?.title };
}

async function Page({ params }: Props) {
  const page = await getPage(params.slug);
  if (!page) notFound();
  const content = page.content ?? [];
  const images = content.filter((b): b is ImageBlock => (b as { _type?: string })._type === "image");

  return (
    <article className="min-h-screen bg-paper text-ink">
      <div className="px-6 md:px-7 pt-28 md:pt-32 pb-24">
        {/* the record line is the page's heading: small mono, but a real h1 */}
        <h1 className="font-mono font-normal text-[11px] uppercase tracking-wider text-muted flex flex-wrap gap-x-3 m-0">
          <span className="text-ink">Harry Partridge</span>
          <span aria-hidden="true">·</span>
          <span>{page.title}</span>
        </h1>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className={`${images.length ? "lg:col-span-7" : "lg:col-span-9"} flex flex-col gap-6`}>
            <PortableText value={content} components={sheetText} />
          </div>
          {images.length > 0 && (
            <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start flex flex-col gap-8">
              {images.map((img, i) => (
                <Tray key={img._key} image={img} index={i} />
              ))}
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}

export default Page;
