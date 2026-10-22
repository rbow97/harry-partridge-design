# Harry Partridge Design — redesign handover

Portfolio site for Harry Partridge (designer: materials, sound, living systems). Owner/dev: Rose.
Next 13 (app router) + Sanity (Studio at /admin, project `aewk7apr`) + Tailwind. Run: `npm run dev` → localhost:3000.
Node 22. `./node_modules/.bin/tsc --noEmit` and `next lint` must stay clean.

## State
- Branch `redesign`. Commit `929d439` has the first pass; everything since is **staged but uncommitted**
  (modes, ecosystem, cross-stitch, nav, inflate, etc.). Nothing pushed. `main` = old live site (Vercel).
- Live content is Harry's real Sanity data; new fields are already filled in by Rose in Studio.

## Design
- Concept: "precise, tactile, curious, but not cold". Projects are *records* (HP–001…).
- Tokens (tailwind.config.ts): paper #F4F1EA, ink #1A1A17, muted #6B675E, rust #A4471F, rule.
  Fonts: Instrument Sans (`--font-sans`, variable wght/wdth), Martian Mono (`--font-mono`), Caveat (`--font-hand`).
- Homepage (`components/ProjectColumns.tsx`): ruled grid, statement with three hover words, filter row,
  one "specimen tray" column per project (crop marks, ruler, 4:3 image, hover swaps in the process record).
- Avoid copying liyakedar.com (the main reference): keep its ruled-grid *principle*, not its signatures.

## Hover modes (the signature feature)
Hovering **materials / sound / living systems** in the statement changes the whole page (nav included).
- `<html data-mode>` = target look; `<html data-anim>` lingers ~650ms after leaving so motion eases out.
  `--hp-amp` (0→1) scales all motion. All CSS in `app/globals.css`.
- materials: felt texture, woolly SVG filters (strength tweened in JS), cross-stitched statement
  (`components/CrossStitch.tsx`, canvas over the real text, drawn instantly).
- sound: dark oscilloscope, rippling letters, scanlines, scrolling rulers.
- living systems: variants selected by `?living=` (default **inflate**); remove the switcher once chosen:
  - `inflate` — "living systems" becomes glossy balloon letters via SVG filter `#hp-puff` (no WebGL).
    Breath generator in ProjectColumns (varied breaths, overshoot, sigh); per-letter ripple via `--lb`
    + variable font weight on a `.hp-balloon` copy that cross-fades over the printed letters; its underline breathes (`--ub`).
  - `breathe` (per-project breathing), `split` (cell division), `herbarium` (pressed specimens), `eco`
    (Rose's drawn tree `public/images/tree.png` + line-drawn habitats in `components/Ecosystem.tsx`, vine in `components/Vine.tsx`).
- Rules: letter effects must never change letter widths (reflow moves words under the cursor and flips the mode);
  keep ≥50fps; respect prefers-reduced-motion; no grow-in animations in the eco scene (just fade).

## Other pieces
- Sound: `components/sound/SoundProvider.tsx` (Web Audio analyser), `EntryGate.tsx` (enter with/without sound),
  `VoiceType.tsx` (headlines react to loudness), `SpoolPlayer.tsx` ("Play a spool" on project pages).
- Project page (`app/(site)/projects/[project]/page.tsx`): record layout with metadata column.
- Sanity schema (`sanity/schemas/project-schema.tsx`): disciplines (multi-select), summary, themes, partOf
  (reference → groups dev records under a main project, see `lib/group-projects.ts`), year/materials/press/audio.
  `scripts/seed-homepage-fields.mjs` is a one-off seeder (needs SANITY_API_WRITE_TOKEN; values are guesses).
- Nav (`components/Nav.tsx`): slim ruled bar for home + project pages; legacy nav elsewhere.

## Open / next
- Pick the living-systems variant, delete the others and the `?living=` switch.
- Bio page and `/projects` grid still use the old design. Credentials were removed from home; could live on Bio.
- Herbarium Latin names and inflate colour are placeholders — check with Harry.
- Commit, push `redesign`, get a Vercel preview for Harry.
