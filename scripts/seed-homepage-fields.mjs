/**
 * One-off: fill the new homepage fields (themes, disciplines) on Harry's projects.
 * Only sets fields that are still empty, so it never overwrites anything edited in Studio.
 *
 *   SANITY_API_WRITE_TOKEN=... node scripts/seed-homepage-fields.mjs
 *
 * Create a token with "Editor" access at https://www.sanity.io/manage → API → Tokens.
 * ⚠️ These values are first guesses — check them with Harry.
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("Set SANITY_API_WRITE_TOKEN first.");
  process.exit(1);
}

const client = createClient({
  projectId: "aewk7apr",
  dataset: "production",
  apiVersion: "2023-08-20",
  useCdn: false,
  token,
});

// Matched by project name, as shown on the site
const seed = {
  "If these clothes could talk": { disciplines: ["Sound", "Textile"], themes: ["sound", "materials"] },
  "Lets talk dirty (Air)": { disciplines: ["Wearable"], themes: ["materials"] },
  "Living A.I.": { disciplines: ["Biodesign"], themes: ["living systems"] },
  "Microbial leather": { disciplines: ["Material"], themes: ["materials", "living systems"] },
};

const docs = await client.fetch(`*[_type == "project" && !(_id in path("drafts.**"))]{ _id, name }`);

// Link records to their main project ("Part of")
const partOf = { "If these clothes could talk development": "If these clothes could talk" };
for (const [child, parent] of Object.entries(partOf)) {
  const c = docs.find((d) => d.name?.trim() === child);
  const p = docs.find((d) => d.name?.trim() === parent);
  if (c && p) {
    await client.patch(c._id).setIfMissing({ partOf: { _type: "reference", _ref: p._id } }).commit();
    console.log(`✓ ${child} → part of ${parent}`);
  }
}
for (const doc of docs) {
  const values = seed[doc.name?.trim()];
  if (!values) {
    console.log(`– skipped "${doc.name}" (no seed values)`);
    continue;
  }
  await client.patch(doc._id).setIfMissing(values).commit();
  console.log(`✓ ${doc.name}`);
}
