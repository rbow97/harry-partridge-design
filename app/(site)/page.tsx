import { getProjects } from "@/sanity/sanity-utils";
import ProjectColumns from "@/components/ProjectColumns";
import { groupProjects } from "@/lib/group-projects";

export const revalidate = 0;

export default async function Home() {
  const groups = groupProjects(await getProjects());
  return <ProjectColumns groups={groups} />;
}
