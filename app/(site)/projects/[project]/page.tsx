import { getProject } from "@/sanity/sanity-utils";
import urlBuilder from "@sanity/image-url";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import React from "react";
import { getImageDimensions } from "@sanity/asset-utils";
import clientConfig from "@/sanity/config/client-config";
import { createClient } from "next-sanity";
import PortableTextComponent from "@/components/PortableTextComponent";

type Props = {
  params: { project: string };
};

async function ProjectDetail({ params }: Props) {
  const slug = params.project;

  const project = await getProject(slug);

  return (
    <div className="max-w-5xl mx-auto py-48 md:py-60 px-5 md:px-10">
      <header className="flex flex-col justify-between items-start">
        <h1 className="text-xl md:text-2xl font-extrabold">{project.name}</h1>
        <div className="text-md md:text-lg text-black dark:text-white mt-5 [&>p]:mt-5">
          <PortableText value={project.description} />
        </div>
      </header>
      <Image
        src={project.image}
        alt={project.name}
        width={1920}
        height={1080}
        className="w-full max-h-500 mt-12 md:mt-16 object-cover "
      />
      <div className="text-md md:text-lg text-black dark:text-white mt-5 [&>p]:mt-5">
        <PortableText
          value={project.content}
          components={PortableTextComponent}
        />
      </div>
    </div>
  );
}

export default ProjectDetail;
