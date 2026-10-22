import { getProjects } from "@/sanity/sanity-utils";
import EntryGate from "@/components/EntryGate";
import ProjectColumns from "@/components/ProjectColumns";
import { groupProjects } from "@/lib/group-projects";

export const revalidate = 0;

export default async function Home() {
  const groups = groupProjects(await getProjects());
  return (
    <>
      <EntryGate />
      <ProjectColumns groups={groups} />
    </>
  );
}
