import { getProject } from "@/sanity/sanity-utils";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import React from "react";
import PortableTextComponent from "@/components/PortableTextComponent";
import SpoolPlayer from "@/components/SpoolPlayer";
import VoiceType from "@/components/VoiceType";

type Props = {
  params: { project: string };
};

// While prototyping, borrow the homepage film's soundtrack so the
// spool can be heard before Harry uploads per-project clips in Sanity.
const PROTOTYPE_AUDIO =
  process.env.NODE_ENV === "development" ? "/assets/harry-grad-movie.mp4" : undefined;

const recordText = {
  ...PortableTextComponent,
  marks: {
    link: ({ value, children }: any) => (
      <a
        href={value?.href}
        {...(value?.blank ? { target: "_blank", rel: "noopener" } : {})}
        className="text-rust underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        {children}
      </a>
    ),
  },
};

function MetaRow({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 py-3 border-t border-rule">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted pt-1">{label}</dt>
      <dd className="font-sans text-base">
        {children ?? <span className="text-muted italic">To add</span>}
      </dd>
    </div>
  );
}

async function ProjectDetail({ params }: Props) {
  const project = await getProject(params.project);
  const recordNo = `HP–${String(project.priority ?? 0).padStart(3, "0")}`;
  const audio = project.audio ?? PROTOTYPE_AUDIO;

  return (
    <article className="min-h-screen bg-paper text-ink font-sans">
      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-36 md:pt-44 pb-24">
        {/* Record line */}
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

        <h1 className="mt-4 max-w-5xl text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
          <VoiceType text={project.name} />
        </h1>

        {/* Object first */}
        {project.image && (
          <figure className="mt-10 md:mt-14">
            <Image
              src={project.image}
              alt={project.name}
              width={1920}
              height={1080}
              priority
              className="w-full aspect-[16/9] object-cover"
            />
          </figure>
        )}

        {audio && (
          <div className="mt-5">
            <SpoolPlayer src={audio} />
          </div>
        )}

        {/* Record body */}
        <div className="mt-14 md:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-4 lg:sticky lg:top-32 self-start">
            <dl className="border-b border-rule">
              <MetaRow label="Year">{project.year}</MetaRow>
              <MetaRow label="Materials">{project.materials}</MetaRow>
              <MetaRow label="Process">{project.process}</MetaRow>
              <MetaRow label="Location">{project.location}</MetaRow>
              <MetaRow label="With">{project.collaborators}</MetaRow>
              <MetaRow label="Press">
                {project.press?.length
                  ? project.press.map((p, i) => (
                      <a
                        key={i}
                        href={p.url}
                        target="_blank"
                        rel="noopener"
                        className="block text-rust underline decoration-1 underline-offset-4"
                      >
                        {p.title}
                      </a>
                    ))
                  : undefined}
              </MetaRow>
            </dl>
          </aside>

          <div className="lg:col-span-8">
            <div
              className="text-2xl md:text-3xl leading-snug max-w-[34ch] [&>p+p]:mt-4"
            >
              <PortableText value={project.description} components={recordText} />
            </div>
            <div className="mt-10 text-lg md:text-xl leading-relaxed max-w-[65ch] [&>p]:mt-6 [&_img]:my-10">
              <PortableText value={project.content} components={recordText} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProjectDetail;
