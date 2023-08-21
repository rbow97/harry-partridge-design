import React from "react";
import { getProjects } from "@/sanity/sanity-utils";
import Image from "next/image";
import Link from "next/link";

const Projects = async () => {
  const projects = await getProjects();
  return (
    <div className="max-w-5xl mx-auto py-20 px-10">
      <h1 className="text-5xl font-extrabold">Projects</h1>
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {projects.map((project) => (
          <Link
            href={`/projects/${project.slug}`}
            className="flex flex-col items-center justify-center rounded-lg p-1 hover:scale-105 transition"
            key={project._id}
          >
            {project.image && (
              <Image
                width={256}
                height={192}
                src={project.image}
                alt={project.name}
                className="max-w-64 h-48 object-cover border-gray-500 w-500-px"
              />
            )}
            <div className="font-extrabold truncate whitespace-nowrap">
              {project.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Projects;
