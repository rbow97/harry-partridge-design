import type { Project } from "@/types/Project";

export type ProjectGroup = { title: string; records: Project[] };

/**
 * Group records into projects using the Sanity "Part of" field.
 * A main project leads its group; records that are part of it follow, in priority order.
 */
export function groupProjects(projects: Project[]): ProjectGroup[] {
  const byPriority = [...projects].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  const ids = new Set(byPriority.map((p) => p._id));
  // a record whose parent isn't published is shown on its own
  const isChild = (p: Project) => !!p.partOf && ids.has(p.partOf);

  return byPriority
    .filter((p) => !isChild(p))
    .map((lead) => ({
      title: lead.name.trim(),
      records: [lead, ...byPriority.filter((p) => p.partOf === lead._id)],
    }));
}

/**
 * Where a record sits in the drawer, for the project bar along the foot of its page.
 * A development record shares its main project's place.
 */
export function placeOf(groups: ProjectGroup[], id: string) {
  const current = Math.max(0, groups.findIndex((g) => g.records.some((r) => r._id === id)));
  return {
    current,
    projects: groups.map((g) => ({ name: g.title, slug: g.records[0].slug })),
  };
}
