import React from "react";
import { getProjects } from "@/sanity/sanity-utils";
import Link from "next/link";

async function Projects() {
  const projects = await getProjects();

  projects.sort((a, b) => {
    if (a.priority == null) return 1;
    if (b.priority == null) return -1;
    if (a.priority > b.priority) return 1;
    else return -1;
  });

  return (
    <div className="max-w-5xl mx-auto py-48 md:py-60 px-5 md:px-10">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
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
            <p className="w-full text-center mt-2 truncate whitespace-nowrap">
              {project.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Projects;

export const revalidate = 0;
