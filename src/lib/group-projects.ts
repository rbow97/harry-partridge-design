import { isListed, type Listed, type Project } from "@/types/Project";

export type ProjectGroup = { title: string; records: Listed[] };

// The order Harry drags the projects into in Studio (orderRank, from the orderable list). Until he
// has chosen "Reset Order" once, projects have no rank, so they fall back to the old priority
// number, and any project still without a rank sorts after the ranked ones
const byOrder = (a: Project, b: Project) => {
  if (a.orderRank && b.orderRank) return a.orderRank < b.orderRank ? -1 : a.orderRank > b.orderRank ? 1 : 0;
  if (a.orderRank || b.orderRank) return a.orderRank ? -1 : 1;
  return (a.priority ?? 999) - (b.priority ?? 999);
};

/**
 * Group records into projects using the Sanity "Part of" field.
 * A main project leads its group; records that are part of it follow, in the same order.
 */
export function groupProjects(projects: Project[]): ProjectGroup[] {
  const byPriority = projects.filter(isListed).sort(byOrder);
  const ids = new Set(byPriority.map((p) => p._id));
  // a record whose parent isn't published is shown on its own
  const isChild = (p: Listed) => !!p.partOf && ids.has(p.partOf);

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
