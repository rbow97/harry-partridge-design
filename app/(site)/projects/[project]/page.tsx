import { getProject } from "@/sanity/sanity-utils";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import React from "react";

type Props = {
  params: { project: string };
};

const ProjectDetail = async ({ params }: Props) => {
  const slug = params.project;

  const project = await getProject(slug);

  return (
    <div className="max-w-5xl mx-auto py-20">
      <header className="flex justify-between items-center">
        <h1 className="text-5xl font-extrabold">{project.name}</h1>
        <a
          href={project.url}
          title="View Project"
          target="_blank"
          rel="noopener norefferer"
          className="bg-gray-100 rounded-lg text-gray-500 font-bold py-3 px-4 whitespace-nowrap hover:bg-pink-500 hover:text-pink-100 transition"
        >
          View Project
        </a>
      </header>
      <div className="text-lg text-gray-700 mt-5">
        <PortableText value={project.content} />
      </div>
      <Image
        src={project.image}
        alt={project.name}
        width={1920}
        height={1080}
        className="w-full max-h-500 mt-10 border-2 border-gray-700 object-cover "
      />
    </div>
  );
};

export default ProjectDetail;
