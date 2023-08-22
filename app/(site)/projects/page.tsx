import React from "react";
import { getProjects } from "@/sanity/sanity-utils";
import Link from "next/link";

async function Projects() {
  const projects = await getProjects();

  return (
    <div className="max-w-5xl mx-auto py-48 md:py-60 px-5 md:px-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {projects.map((project) => (
          <Link
            href={`/projects/${project.slug}`}
            className="flex flex-col items-center p-0 justify-center rounded-lg"
            key={project._id}
          >
            {project.image && (
              <img
                src={project.image}
                alt={project.name}
                className="w-full h-48 object-cover border-gray-500 w-500-px"
              />
            )}
            <div className="mt-2 truncate whitespace-nowrap">
              {project.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Projects;

export const revalidate = 60;
