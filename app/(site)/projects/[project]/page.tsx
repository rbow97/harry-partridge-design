import { getProject } from "@/sanity/sanity-utils";
import { PortableText, PortableTextComponents } from "@portabletext/react";
import { getImageDimensions } from "@sanity/asset-utils";
import urlBuilder from "@sanity/image-url";
import { createClient } from "next-sanity";
import Image from "next/image";
import React from "react";
import clientConfig from "@/sanity/config/client-config";
import SpoolPlayer from "@/components/SpoolPlayer";
import VoiceType from "@/components/VoiceType";

type Props = {
  params: { project: string };
};

/**
 * A project record: the words in a column on the left that stays put while the work
 * scrolls, the work as a stack of images on the right (after laylabaghai.com/probio).
 * If the words run taller than the window the column scrolls within itself, so a long
 * description is never cut off. On a phone the words come first, then the stack.
 */

const link = ({ value, children }: any) => (
  <a
    href={value?.href?.trim()}
    {...(value?.blank || /^https?:/.test(value?.href ?? "") ? { target: "_blank", rel: "noopener" } : {})}
    className="text-rust underline decoration-1 underline-offset-4 hover:decoration-2 break-words"
  >
    {children}
  </a>
);

const hasText = (children: React.ReactNode) =>
  React.Children.toArray(children).some((c) => (typeof c === "string" ? c.trim().length > 0 : true));

// the description, in the words column
const words: PortableTextComponents = {
  block: {
    normal: ({ children }) => (hasText(children) ? <p className="font-sans text-sm leading-snug">{children}</p> : null),
    h1: ({ children }) => (hasText(children) ? <p className="font-sans text-base md:text-lg leading-snug">{children}</p> : null),
    h2: ({ children }) => (hasText(children) ? <p className="font-sans text-base md:text-lg leading-snug">{children}</p> : null),
  },
  marks: { link },
  types: { image: () => null },
};

type ImageBlock = { _type: "image"; _key: string; alt?: string; asset: { _ref: string } };

const imageUrl = (image: ImageBlock, width: number) =>
  urlBuilder(createClient(clientConfig)).image(image).width(width).auto("format").url();

// the work: every image at its own proportions, full width of the stack; any text between
// them reads as a caption
const work: PortableTextComponents = {
  block: {
    normal: ({ children }) =>
      hasText(children) ? <p className="font-sans text-sm md:text-base leading-relaxed max-w-[60ch]">{children}</p> : null,
  },
  marks: { link },
  types: {
    image: ({ value }: { value: ImageBlock }) => {
      if (!value?.asset?._ref) return null;
      const { width, height } = getImageDimensions(value);
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(value, 1800)}
            alt={value.alt ?? ""}
            className="hp-img w-full h-auto"
            style={{ aspectRatio: `${width} / ${height}` }}
            loading="lazy"
          />
        </figure>
      );
    },
  },
};

// a metadata row, only when there is something to say: no "to add" placeholders on a live record
function MetaRow({ label, children }: { label: string; children?: React.ReactNode }) {
  if (children == null || children === "" || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-4 py-3 border-t border-rule">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted pt-1">{label}</dt>
      <dd className="font-sans text-base">{children}</dd>
    </div>
  );
}

async function ProjectDetail({ params }: Props) {
  const project = await getProject(params.project);
  const recordNo = `HP–${String(project.priority ?? 0).padStart(3, "0")}`;
  // the spool only appears when this record has a recording of its own
  const audio = project.audio;
  const hasMeta = !!(project.year || project.materials || project.process || project.location || project.collaborators || project.press?.length);

  return (
    <article className="min-h-screen bg-paper text-ink">
      {/* from lg the grid starts right under the bar, so the sticky words column is already
          at its resting place on load and never slides */}
      <div className="px-6 md:px-7 pt-24 md:pt-14 pb-24 grid grid-cols-1 md:grid-cols-12 gap-x-8 lg:gap-x-12 gap-y-10">
        {/* the words: a screen-tall column stuck under the bar with its content at the bottom,
            so it sits still at the foot of the screen from the first pixel while the work
            scrolls past. Nothing scrolls inside it; the type is sized so the longest record
            fits a laptop window */}
        <div className="md:col-span-5 xl:col-span-4 self-start flex flex-col justify-end md:sticky md:top-14 md:min-h-[calc(100svh-3.5rem)] md:pb-7 md:pr-4">
          <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted flex flex-wrap gap-x-3">
            <span className="text-ink">{recordNo}</span>
            <span aria-hidden="true">·</span>
            <span>Project record</span>
            {project.year && (
              <>
                <span aria-hidden="true">·</span>
                <span>{project.year}</span>
              </>
            )}
          </p>
          <h1 className="font-sans text-2xl md:text-3xl leading-tight tracking-tight">
            <VoiceType text={project.name} />
          </h1>
          {project.description && (
            <div className="flex flex-col gap-3 max-w-[48ch]">
              <PortableText value={project.description} components={words} />
            </div>
          )}
          {!!project.disciplines?.length && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Work</p>
              <p className="mt-1 font-sans text-sm">{project.disciplines.join(", ")}</p>
            </div>
          )}
          {audio && <SpoolPlayer src={audio} />}
          {hasMeta && (
            <dl className="border-b border-rule">
              <MetaRow label="Materials">{project.materials}</MetaRow>
              <MetaRow label="Process">{project.process}</MetaRow>
              <MetaRow label="Location">{project.location}</MetaRow>
              <MetaRow label="With">{project.collaborators}</MetaRow>
              <MetaRow label="Press">
                {project.press?.length
                  ? project.press.map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noopener" className="block text-rust underline decoration-1 underline-offset-4">
                        {p.title}
                      </a>
                    ))
                  : undefined}
              </MetaRow>
            </dl>
          )}
          </div>
        </div>

        {/* the work: the lead image, then everything in the record, one stack no wider than a sheet */}
        <div className="md:col-span-7 xl:col-span-8 md:pt-14 flex flex-col gap-6 md:gap-8 w-full max-w-[760px]">
          {project.image && (
            <figure>
              <Image src={project.image} alt={project.name} width={1920} height={1440} priority className="hp-img w-full h-auto" />
            </figure>
          )}
          {project.content && <PortableText value={project.content} components={work} />}
        </div>
      </div>
    </article>
  );
}

export default ProjectDetail;
