# Harry Partridge Design — redesign handover

Portfolio site for Harry Partridge (designer: materials, sound, living systems). Owner/dev: Rose.
Astro 7 (static output, Vercel adapter) + React islands + Tailwind v4 + Sanity (Studio embedded at /admin via
@sanity/astro, project `aewk7apr`). Run: `npm run dev` → localhost:3000. `npm run check` (astro check) and
`npm run build` must stay clean. Node 22+.

## Stack (moved from Next 13 on 2026-10-23, branch `feat/astro`)
- `src/pages/*.astro` render at build from Sanity (`src/lib/sanity.ts`, `sanity:client`). Content changes need a
  rebuild: point a Sanity webhook at Vercel's deploy hook. `getStaticPaths` lists pages and projects; the Sanity
  "Projects" page is skipped because `/projects` redirects home (astro.config.mjs).
- `src/layouts/Site.astro`: head, per-page `<title>` ("X · Harry Partridge"), favicon, the ambient `<audio
  id="hp-ambient">`, and the Nav island. React components used from `.astro` without a `client:` directive render
  to static HTML and ship no JS (`RichText.tsx` for Portable Text). Islands: `ProjectColumns` (the whole homepage,
  `client:load`), `Nav` (`client:load`), `VoiceType` and `SpoolPlayer` (`client:visible`) on record pages.
- Sound state is a nanostore (`src/stores/sound.ts`), not React context, because the nav, the homepage and a
  record page are separate islands with no shared React tree. Same model as before: `$soundOn` is the switch,
  `take(el)`/`release(el)` hand the floor between a spool or the tape and the ambient voice.
- Fonts are self-hosted from Fontsource (`@fontsource-variable/instrument-sans/wdth.css` keeps the width axis
  VoiceType uses, `martian-mono/standard.css`), imported in `src/styles/global.css`. Caveat is gone.
- Type: five steps only, in rem so they follow the reader's default text size: `text-label` 0.6875rem
  (11px) mono, `text-small` 0.875rem, `text-body` 1rem/1.125rem, `text-lead` clamp(1.375rem, 1rem + 0.65vw,
  1.875rem), `text-display` 0.25rem + 7vw / 2.8vw (tokens.css `--type-*`). Tailwind's default sizes are
  cleared in global.css (`--text-*: initial`), so `text-xl` and the like don't exist. The Contact address is
  the one exception, fitted to the width by script.
- Tokens: `src/styles/tokens.css` in three tiers (primitives, semantic roles, `[data-mode]` reassignments). Tailwind
  v4 `@theme inline` maps `paper/ink/muted/accent/rule` onto the roles, so `text-ink` is "the text colour" and
  follows the mode; `px-edge` is the 28px/24px shared edge, `h-bar`/`top-bar` the 56px bar, `hp-label` the mono
  label. Canvas code reads roles with `src/lib/tokens.ts` (`token("--accent")`). The per-mode `.text-muted` and
  `.text-accent` override blocks are gone. Mode art direction (felt, reel, flock) stays as `html[data-mode] .hp-*`.
- The embedded Studio needs its origin in the project's CORS list at manage.sanity.io (allow credentials), or it
  shows a blank page with CORS errors for `users/me`. `http://localhost:3000` is already there, so dev is pinned to
  3000 in `astro.config.mjs`. Harry has handed project `aewk7apr` over to Rose (2026-10-23), so
  she can add CORS origins, edit content in Studio and run migrations herself.
- Astro's own dev-server tip: `npx astro dev --background`; the desktop app's preview reads a global launch.json,
  so open the pane with the URL once the server is up.

## State
- Branch `feat/astro` (from `redesign` at `fd6561b`), pushed 2026-10-23. `main` = old live site (still Next).
- The Vercel project's framework preset is still Next.js for `main`, so `vercel.json` sets `"framework": "astro"`
  for this branch. Without it the build stops at `NEXT_NO_VERSION`. Switch the project preset to Astro once this merges.
- Live content is Harry's real Sanity data; new fields are already filled in by Rose in Studio.

## Design
- Concept: "precise, tactile, curious, but not cold". Projects are *records*.
- Palette: paper #F4F1EA, ink #1A1A17, muted #6B675E, verdigris #2B6B5F (the accent, chosen 2026-10-23 over the old rust), plus the mode surfaces
  felt #E9DCC6, verdigris-light #7CC4B3 (the accent on the sound mode), moss #EFE4C2 (see `src/styles/tokens.css`). Fonts: Instrument Sans (variable wght/wdth), Martian Mono.
- Phones (2026-10-23, after liyakedar.com's phone layout): one specimen per row, the 4:3 photo running wall to
  wall between the rules, number and crop marks above, ruler below, label under. The well is `inline-size`
  contained on phones (in flow) and `size` contained from md (absolute in the tray).
- Homepage (`src/components/ProjectColumns.tsx`): ruled grid, statement with three hover words, one "specimen tray"
  column per project (crop marks, ruler, 4:3 image, hover swaps in the process record). The drawer is a 12-column
  grid, four trays across, and every row is full: the trays that don't divide by four come first and wider
  (`src/lib/tray-layout.ts`, albumcolors style - 5 projects = one full-width hero then four). Wider trays are taller,
  and a full-width hero is laid out as a record sheet (photo across two thirds, label beside it on the right,
  bottom-aligned, bigger type) that fills the first screen exactly with 72px of the next row showing
  (`--drawer-top` is measured in ProjectColumns). Chosen 2026-10-23 over a label-below hero, which looked like a
  stretched tray.
  The frame is always 4:3 (`width: min(100cqw, calc(100cqh * 4 / 3))`, the well is a size container), and the
  reel clip is `circle(min(50cqh, 37.5cqw))`, both derived from the well so they hold at any tray size. Verified
  with five projects (Harry has a "Test" one with no image as of 2026-10-23). There is no theme filter (removed 2026-10-23: dimming didn't shorten a long list, and the
  animated alternatives either warp the photos or need empty trays; Rose chose none). `themes` was dropped from the schema on 2026-10-23.
- Transitions between modes: `.hp-img` filters are one canonical list in every mode (CSS only interpolates
  matching filter lists); the reel is a `clip-path: inset(... round 50%)` so it morphs from the rectangle; the
  reel angle is written per frame by Tape.tsx and eased back upright on exit, never a keyframe that snaps.
- Avoid copying liyakedar.com (the main reference): keep its ruled-grid *principle*, not its signatures.

## Hover modes (the signature feature)
Hovering **materials / sound / living systems** in the statement changes the whole page (nav included).
- `<html data-mode>` = target look; `<html data-anim>` lingers ~650ms after leaving so motion eases out.
  `--hp-amp` (0→1) scales all motion. All CSS in `src/styles/global.css`.
- materials: felt texture, woolly photos (`#hp-fuzz`, strength tweened in JS), cross-stitched statement
  (`src/components/CrossStitch.tsx`, canvas over the real text, drawn instantly), and the cursor sews
  (`src/components/Stitch.tsx`), but only once the word has been clicked (pinned): hovering shows the embroidered
  statement, clicking lets you sew. Across the whole statement block it lays crosses wherever it goes, each one five of
  the text's own stitches on the diagonals of a 3x3 block of the text's grid (~10px, same cell size, origin, stroke
  and thread as CrossStitch), never over the letters or underlined words, and it extends the Aida holes over the
  block so the cloth is one piece. Along any rule it lays running stitch. Both fade with the mode. Fat rounded
  8px/14px crosses were tried and rejected: they looked like icons, not thread. A needle-cursor with thread and a hint label were tried and rejected (2026-10-23). The felt displacement
  used to sit on every `.hp-rule` too; removed because it blurred all the text and cost ~19fps on entry (57 after).
- Mode lifetime: hover is the word alone, leave it and the mode ends (a block-wide hover was tried on 2026-10-23 and
  felt stuck, in all three modes). A click pins a mode, shown by a dashed outline round the word (`aria-pressed`),
  so the cursor can roam the whole page: click the word again, click anywhere that isn't one of the three words
  (the plain statement text counts as away), or Escape to release.
  Materials on hover already turns the whole header into cloth (Stitch draws the Aida holes beyond the text box);
  only the sewing waits for the pin.
- Shared edge: the brand, the statement, the nav's right edge and the photos all sit 28px in (24px on phones). The
  hero's photo is left-aligned in its well for the same reason.
- sound: a tape machine (`src/components/Tape.tsx`). Tray images become spinning reels, the rulers become tape with the
  recording's signal passing a head (canvas), and a timecode replaces the project count. The statement letters stay
  still (Rose's call, 2026-10-23). The signal comes from decoding the file into a 100Hz envelope, so the tape runs
  silently for quiet visitors; with sound on it plays the spool and pauses the ambient voice. The recording is the
  first project with `audio`, else the ambient clip. The recording is only audible once "sound" is pinned by a
  click or tap: hovering and Tabbing run the tape silently, so focus never starts audio. The only sound control is
  `src/components/SoundSwitch.tsx`, at the right end of the bar in muted type (a control, not a page), meter-only beside
  the menu button on phones. A fixed corner was tried on 2026-10-23 and sat on content on every page.
- Sound model (`SoundProvider`): `soundOn` is the visitor's one setting and the switch always reflects it. The
  ambient voice loops while sound is on and nothing else has the floor; a spool or the tape calls `take(el)`
  (ambient pauses) and `release(el)` (ambient resumes). Turning the switch off silences whatever is playing. The
  earlier `pauseAmbient()` flipped `soundOn`, so the switch showed off while a recording played.
- living systems: **flock** (`src/components/Flock.tsx`, chosen 2026-10-22). The tray images dissolve into ~5k boids
  on a fixed canvas that wheel around the cursor and fly home to re-form the images on leave. Images are sampled
  from a 600px Sanity copy (`crossOrigin`), one particle per 10px, drawn as colour-bucketed rects. `<html data-flock>`
  is set while particles are off their pixels; it hides the real `.hp-img`s. Tuning constants are at the top of the
  file; still to tune by eye: speed, spread, whether the flock should avoid the statement text.
  Rejected on the way (all deleted): balloon/inflate, breathe, split, herbarium, eco, a culture spreading along the
  rules (didn't read), a lab-record day counter (too quiet). The `?living=` switch is gone.
- Touch: a tap fires emulated hover then click, so the word buttons ignore hover/focus for touch pointers and taps
  toggle; a tap outside the statement ends the mode.
- Islands still render on the server: nothing may touch `window`, `innerWidth` or `document` outside an effect. A
  ref initialised from `innerWidth` in Flock once threw on the server and silently made the homepage client-only.
  Check with `curl localhost:3000 | grep hp-statement` after touching mode code.
- Accessibility baseline (2026-10-23): the statement is the homepage `h1`; Bio, Contact and record pages each have
  one `h1` and their own `<title>` via the layout's `title` prop; the word buttons carry `aria-label`s and a rust
  focus-visible ring (visible in materials, where the letters go transparent); letter spans are `aria-hidden` with
  the text repeated once in `.sr-only` (Letters, VoiceType); a focused tray link rings the whole cell. Still open
  from the review: contrast of muted/rust on the felt and petri surfaces (4.2 to 4.4:1), hover rust in sound mode
  (2.9:1), no live region for mode changes, process image hover-only, no skip link, no transcripts.
- Rules: letter effects must never change letter widths (reflow moves words under the cursor and flips the mode);
  keep ≥50fps; respect prefers-reduced-motion. Only `.hp-surface` transitions `color` - a child with its own colour
  transition chases the inherited value and lags the page (this was the nav lag).

## Other pieces
- Sound: `src/stores/sound.ts` (Web Audio analyser, ambient voice behind the bar's Sound switch),
  `src/components/VoiceType.tsx` (headlines react to loudness, used on project pages), `src/components/SpoolPlayer.tsx`
  ("Play a spool" on project pages). The entry gate ("Enter with sound / quietly") was removed on 2026-10-23, so
  sound is off until the nav switch is clicked, which is the gesture that unlocks audio. The spool and the ambient
  voice are the same placeholder file until Harry supplies recordings.
- Project page (`src/pages/projects/[project].astro`, after laylabaghai.com/probio, 2026-10-23): the words in
  a screen-tall sticky column on the left with its content at the bottom (record line, title, description at
  text-sm, "Work" disciplines, the spool only if the record has a recording, metadata rows only where filled),
  nothing scrolling inside it, the work as a stack of images on the right, up to 60vw wide, at their own proportions.
  Sticky by `bottom` was tried and doesn't hold while scrolling down; sticky by `top` with a min-height does. Phones: words first, then
  the stack. No "to add" placeholders. As of 2026-10-23 no record
  in Sanity has a recording or any metadata, so the spool and the rows are hidden everywhere until Harry fills them.
- Sanity schema (`sanity/schemas/`, step 1 of the cleanup done 2026-10-23): `defineType`/`defineField`, no `any`.
  Projects: name, slug and main image required, main image alt required, disciplines (multi-select), summary,
  partOf (reference: groups dev records under a main project, see `lib/group-projects.ts`), recordLabel,
  year/materials/process/location/collaborators/press/audio. `content` holds blocks, images (alt warns if empty)
  and `video` blocks (`video-schema.ts`, a YouTube or Vimeo link plus caption) that play in place on the record
  page: `[project].astro` splits the content at them so each is a `VideoEmbed` island. Pages: title and slug
  required, content images carry alt. `themes` is gone (Studio flags old data with a remove button).
- Ordering: Projects in Studio is a drag-and-drop list (`@sanity/orderable-document-list`, pinned 2.0.25,
  `orderRank`). The homepage sorts by `orderRank`, falling back to the hidden old `priority` until Harry picks
  "Reset Order" once in the list's menu. As of 2026-10-23 no project has a rank.
- Types: `npm run typegen` extracts the schema (`schema.json`, git-ignored) and generates `src/sanity.types.ts`
  from the `defineQuery` queries in `src/lib/sanity.ts`, so fetches are typed by their query. Run it after changing
  a query or the schema, and commit `src/sanity.types.ts` (the build needs it). Names and slugs come back nullable,
  so the list queries skip entries missing them and the pages check before use.
  `scripts/seed-homepage-fields.mjs` is a one-off seeder (needs SANITY_API_WRITE_TOKEN; values are guesses).
- One-off documents (step 2, 2026-10-23), pinned at the top of the Studio sidebar at fixed ids, never in the "new
  document" menu, and only publishable (no delete, duplicate or unpublish): Site settings (`siteSettings`: the
  homepage statement as one paragraph whose hover words carry a Mode annotation, the ambient recording, site name,
  description, share image), About (`about`: lede, portrait, fact sections whose items link to a project or a
  URL) and Contact (`contact`: headline, intro, the words before the email, email, links). None of them existed
  in Sanity as of 2026-10-23. `src/lib/site.ts` falls back field by field to what the site shipped with, so the
  site looks the same until Harry publishes them: the statement and ambient file in `FALLBACK`, Bio read from
  its Page's free text (`lib/info.ts`) until About has a lede, Contact's lines in `CONTACT_FALLBACK` and its email
  and links from the Page. About fills whichever page has the slug `bio` or `about`.
- Favicon: `public/favicon.svg` (the record stamp: HP in verdigris between the tray's crop marks, drawn as paths, chosen from nine
  variants; a cross-stitch leaned on one subject) and `public/apple-touch-icon.png` rendered from it at
  180px; `Site.astro` writes the link tags.
- Nav (`src/components/Nav.tsx`): the slim ruled bar on every page. On phones the pages sit behind a menu button (three rules that fold into a cross, after liyakedar.com) that drops a panel
  of ruled mono rows from the bar, the page showing beneath; Escape, the button, a tap beneath, or a link closes
  it, focus moves in and back. The panel's display is a class toggle, not the `hidden` attribute, because
  Tailwind's `flex` outranks `[hidden]` and the first version never closed.

## Open / next
- Tune the flock by eye on a real machine and a real phone (frame rate on a phone is unmeasured).
- Materials hover still to review against the flock and the tape: the felt filter blurs text and rules, and nothing
  in it responds to the visitor. Options discussed: a needle/running stitch that follows the cursor, or per-project
  textures instead of felt everywhere.
- Bio and Contact (`src/pages/[slug].astro`) are record sheets too (2026-10-23): text down the left, any
  images in specimen trays on the right. Harry writes his lede as `h1` blocks in Studio, so h1 sets large and
  `normal` is body; blank blocks are skipped. The legacy nav, dark-mode provider and theme switch are deleted,
  every page uses the slim ruled bar. `html` and `body` carry the paper colour (and the mode's colour), so
  overscroll never shows white.
- `/projects` redirects to `/` (astro.config.mjs, a 301 in the Vercel output) and the old grid page is deleted (2026-10-23): the homepage is the
  index. The nav drops any Sanity page with slug `projects` (`Nav.tsx`), so Harry's Studio document can stay.
  Record pages at `/projects/[project]` are unchanged.
- Share the `feat/astro` Vercel preview with Harry.
