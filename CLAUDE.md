# Harry Partridge Design — redesign handover

Portfolio site for Harry Partridge (designer: materials, sound, living systems). Owner/dev: Rose.
Next 13 (app router) + Sanity (Studio at /admin, project `aewk7apr`) + Tailwind. Run: `npm run dev` → localhost:3000.
Node 22. `./node_modules/.bin/tsc --noEmit` and `next lint` must stay clean.

## State
- Branch `redesign`. `929d439` first pass, `693b947` modes and variants, `df6b51f` flock + cleanup + nav and touch
  fixes, then the tape machine. Nothing pushed. `main` = old live site (Vercel).
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
- sound: a tape machine (`components/Tape.tsx`). Tray images become spinning reels, the rulers become tape with the
  recording's signal passing a head (canvas), a timecode replaces the project count, and the statement letters lift
  with the recording's loudness (`--lvl`/`--lvl2` on `.hp-statement`, odd and even letters via `--sd`). Loudness comes
  from decoding the file into a 100Hz envelope, so it speaks silently for quiet visitors; with sound on it plays the
  spool and pauses the ambient voice. The recording is the first project with `audio`, else the ambient clip.
  The nav has the only sound toggle after the entry gate.
- living systems: **flock** (`components/Flock.tsx`, chosen 2026-10-22). The tray images dissolve into ~5k boids
  on a fixed canvas that wheel around the cursor and fly home to re-form the images on leave. Images are sampled
  from a 600px Sanity copy (`crossOrigin`), one particle per 10px, drawn as colour-bucketed rects. `<html data-flock>`
  is set while particles are off their pixels; it hides the real `.hp-img`s. Tuning constants are at the top of the
  file; still to tune by eye: speed, spread, whether the flock should avoid the statement text.
  Rejected on the way (all deleted): balloon/inflate, breathe, split, herbarium, eco, a culture spreading along the
  rules (didn't read), a lab-record day counter (too quiet). The `?living=` switch is gone.
- Touch: a tap fires emulated hover then click, so the word buttons ignore hover/focus for touch pointers and taps
  toggle; a tap outside the statement ends the mode.
- Rules: letter effects must never change letter widths (reflow moves words under the cursor and flips the mode);
  keep ≥50fps; respect prefers-reduced-motion. Only `.hp-surface` transitions `color` - a child with its own colour
  transition chases the inherited value and lags the page (this was the nav lag).

## Other pieces
- Sound: `components/sound/SoundProvider.tsx` (Web Audio analyser), `components/EntryGate.tsx` (enter with/without
  sound), `components/VoiceType.tsx` (headlines react to loudness), `components/SpoolPlayer.tsx` ("Play a spool" on
  project pages). The spool and the ambient voice are the same placeholder file until Harry supplies recordings.
- Project page (`app/(site)/projects/[project]/page.tsx`): record layout with metadata column.
- Sanity schema (`sanity/schemas/project-schema.tsx`): disciplines (multi-select), summary, themes, partOf
  (reference → groups dev records under a main project, see `lib/group-projects.ts`), year/materials/press/audio.
  `scripts/seed-homepage-fields.mjs` is a one-off seeder (needs SANITY_API_WRITE_TOKEN; values are guesses).
- Nav (`components/Nav.tsx`): slim ruled bar for home + project pages; legacy nav elsewhere.

## Open / next
- Tune the flock by eye on a real machine and a real phone (frame rate on a phone is unmeasured).
- Materials hover still to review against the flock and the tape: the felt filter blurs text and rules, and nothing
  in it responds to the visitor. Options discussed: a needle/running stitch that follows the cursor, or per-project
  textures instead of felt everywhere.
- Bio page and `/projects` grid still use the old design. Credentials were removed from home; could live on Bio.
- Commit, push `redesign`, get a Vercel preview for Harry.
