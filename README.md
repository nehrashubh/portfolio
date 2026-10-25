# Shubhankar Nehra — portfolio

One Vite + React app. The landing is a scroll-driven descent through a sky
into a meadow; its four cards open four full-viewport sections, each built as
its own prototype and assembled here.

| Card | Section | Prototype it came from |
|------|---------|------------------------|
| 01 Skills | chess board and skills panel | `../chess-scene` |
| 02 Projects | painted hands and pill deck | `../project-display` |
| 03 Writeups | book shelf and reader, synced from the Obsidian vault | `../writeups` |
| 04 Work & Education | airship flight through cloud | `../journey-scene` |

The landing comes from `../hero`. Those five directories are archives now;
nothing here reads from them at runtime.

## Commands

    npm run dev              # dev server on http://localhost:5173
    npm run build            # tsc -b && vite build → dist/
    npm test                 # vitest, ~430 tests
    npm run lint             # oxlint
    npm run preview          # serve dist/ on http://localhost:4173
    npm run preview:pages    # serve dist/ the way Cloudflare Pages will,
                             # with public/_headers and _redirects applied

    npm run deploy           # build and upload to Cloudflare Pages
    npm run og               # re-render public/og.jpg from the live hero
    npm run optimize:models  # rebuild public/models/*.glb from the prototypes
    npm run sync:writeups    # pull writeups from the Obsidian vault into content/
    npm run shoot -- all     # screenshots of every section, desktop + iPhone
                             # (preview server must be running)

## Deploying

The site is static and deploys to Cloudflare Pages, where the domain already
lives. `wrangler.toml` names the project `shubhankarnehra` and points at `dist/`.

First time only:

    npx wrangler login              # opens the browser, one click
    npm run deploy                  # creates the project and uploads

Then, in the Cloudflare dashboard: Workers & Pages → shubhankarnehra →
Custom domains → add `shubhankarnehra.com` (and `www`). DNS is on Cloudflare,
so it activates in a minute. Every later `npm run deploy` goes live at once.

`public/_headers` sets caching (hashed assets immutable, everything else a
day at the edge) and a Content-Security-Policy that the whole site runs
under — `wasm-unsafe-eval` for the Draco decoder, `blob:` for the textures
three.js unpacks from the models. `public/_redirects` gives `/resume`,
`/cv`, `/github` and `/linkedin` as short links.

## How it loads

- A first visit downloads 65 KB of JavaScript, gzipped: the entry, React,
  and the module runtime. No three.js, no models. Nothing 3D is fetched
  until a card is opened.
- **React has its own manual chunk, and that rule must stay.** React is
  shared by the landing and every section, so without it the bundler files
  React inside the three chunk and the landing cannot render until all
  1.1 MB of WebGL has arrived — which defeats the whole lazy-section
  design. `npm run build` prints the chunk list; the entry must import
  only `react-*.js` and the runtime.
- Scrolling the landing is damped: the scene and the panels follow the
  scrollbar at a walking pace (`src/landing/Landing.tsx`, DAMPING and
  MAX_SPEED), so a flick cannot throw the descent.
- Each section is a lazy chunk. Hovering, focusing or pressing a card starts
  its download; opening it mounts it into the overlay's slot; closing
  unmounts it.
- three.js, fiber, drei and react-spring live in one shared chunk (~300 KB
  gzipped) that arrives with the first 3D section.
- Models are Draco-compressed with WebP textures at full resolution, built
  offline by `scripts/optimize-models.mjs` and committed:
  chess 548 KB, hands 258 KB, airship 2.1 MB.

There is deliberately no preloader.

## Layout

    src/
      landing/      Hero, About, Ground (the cards), Footer, PetalField, Landing
      lib/          pure maths: descent, flip, wind, petals
      sections/
        registry.ts       card key → lazy chunk; prefetchSection()
        SectionOverlay    the full-viewport frame every section mounts into
        SectionCard
        skills/ projects/ writeups/ journey/
      shared/       useReducedMotion, useMediaQuery, useDpr, hasWebGL, ErrorBoundary
      theme.ts      the four sections, their hours, copy, motion timings
    content/writeups/   synced markdown + index.json (never edited by hand)
    public/
      models/  draco/  fonts/  plates/  books/
    scripts/
      optimize-models.mjs  sync-writeups.mjs  shoot.mjs

## The section contract

A section is a default-exported component receiving `{ reducedMotion }`. It
fills the overlay's slot, pads its top by `--overlay-chrome` to stay clear of
the title and cross, never sets `position: fixed` on its root, never touches
`body`, and handles its own scrolling. An inner dialog that wants Escape
listens on `document` and calls `preventDefault()`; the overlay listens on
`window` and defers. Anything that loads a model calls `useGLTF.preload` at
module scope so the prefetch warms it. The full contract is in the assembly
spec, §3.

## Typography

Four faces, four jobs, all self-hosted woff2:

- **Gloock** — display titles everywhere
- **Cormorant Garamond 300** — long-form serif sentences
- **JetBrains Mono 400** — meta, labels, numerals, code
- **IBM Plex Sans** (variable) — small dense UI text inside the sections

## Content

Everything on the site comes from the software résumé,
`~/internships/profile/resumes/swe.tex`, published as
`public/shubhankarnehra_resume.pdf`. It is the broad computer-science one;
`security.tex` beside it is the one to switch to once the focus is security
alone, and the About copy in `src/theme.ts` says so where it would change.

- `src/sections/projects/data/projects.ts` — the seven projects
- `src/sections/skills/fischerPosition.ts` — fifteen skills, each linked to the
  work that proves it
- `src/sections/journey/waypoints.ts` — the five stops
- `src/theme.ts` — facts, footer links, copy
- `content/writeups/` — synced from the Obsidian vault by `npm run sync:writeups`

Still to confirm: a public repository for this site once it has one (the
"This site" card links to the GitHub profile until then).

**The published résumé has no phone number, on purpose.** `swe.tex` has one
in its header. The public PDF is built from a copy with that line deleted, so
the number is not in the file at all and the header centres itself:

    grep -vE '[0-9]{3}-[0-9]{3}-[0-9]{4}' ~/internships/profile/resumes/swe.tex > /tmp/swe-public.tex
    cd ~/internships && .venv/bin/python -m scripts.build_resume \
        /tmp/swe-public.tex ~/projects/portfolio/public/shubhankarnehra_resume.pdf
    pdftotext ~/projects/portfolio/public/shubhankarnehra_resume.pdf - \
        | grep -cE '[0-9]{3}-[0-9]{3}-[0-9]{4}'                # must print 0

Never copy `Shubhankar_Nehra_SWE.pdf` straight in: that one has the number.

## URLs

The open section is the URL fragment, so every section and every thing in
one is a link:

    /#skills                   /#skills/piece_queen_white
    /#projects                 /#projects/faith-crm
    /#writeups                 /#writeups/massagold
    /#work                     /#work/dbworkout

The back button leaves a section; closing one clears the fragment without
adding history. Skills use these to point at projects, writeups and journey
stops. `src/sections/route.ts` parses them.

Short links: `/resume`, `/cv`, `/github`, `/linkedin`.

Link previews come from the meta tags in `index.html` and `public/og.jpg`,
which `npm run og` renders from the hero itself. The favicon is one petal.

## The airship scene

Two things make the low-poly cloud asset read as weather rather than cut
paper, both in code, neither touching the model:

- `src/sections/journey/cloudShell.ts` welds the shell's split vertices and
  recomputes normals, so shading rolls across the mass instead of catching
  each facet. The material stays **opaque** on purpose — fading it by view
  angle softens the silhouette but sorts after everything opaque, and the
  dashed route line vanishes behind it.
- Scene fog in the clouds' own dusk violet dissolves the remaining hard
  silhouette into distance. `FOG_NEAR` sits past the camera's orbit radius
  so the ship itself is never hazed.

Each stop is an anchor: drawn in outline ahead of you, stamped (ink on a
pale disc) once you reach it, so the route behind reads as a row of stamps.
Its text sits in the sky beside it: no leader line and no
panel. A soft radial scrim behind it — inscribed in its box so it reaches
full transparency on every side and can never be clipped into an edge —
is what keeps it legible over cloud that runs from near-white to deep
blue. Below 700px there is no room beside a marker, so the text settles at
the foot of the frame as a caption instead.

Each stop owns the stretch of the flight nearest it, midpoint to midpoint,
and its text is at full strength across all of it
(`src/sections/journey/revealWindow.ts`). It fades only at a handover, out
before the next fades in, or on a wide screen as its anchor leaves the
frame. The first and last stops hold through to either end.

## Touch

Every section is usable with a finger, and a few things exist only for one:

- The project deck travels the way a list does, so the pills follow the
  finger rather than sliding against it, and a drag covers a card in 150px
  rather than 320.
- A writeup's card appears on a press and hold, since there is no hover to
  give it. The hold peeks; it does not open.
- Skills puts the panel over the foot of the board rather than beside it,
  and the camera reserves that edge so no piece hides underneath.
- Work & Education docks its caption at the foot of the frame, because
  there is no room beside a marker on a portrait screen.

## Plates

`tools/cut_branch.py` keys the blossom branch off its green screen (source in
`../hero/assets/plates/`) and writes `public/plates/branch.webp`. The sky and
ground plates are carried over from the hero prototype as built there.
`scripts/blur-ground.mjs` bakes `ground-blur.webp`, the soft meadow every
section opens over, from the ground plate; it stands in for what used to be a
live full-screen `backdrop-filter`.

## Performance

Measured in headless Chrome on the Intel iGPU of the machine this was built
on, at 1622×900 and 1.56× (the laptop panel), since that GPU is what the
browser actually renders on:

- **Work & Education** was 19 fps. The model's materials are all black with a
  white emissive map and the scene has no lights, so they are swapped for
  unlit ones that draw the identical image (`ShipCloudsScene.tsx`); cloud
  fragments under 3% alpha are discarded rather than blended; MSAA is off at
  1.25× and up, where it was the largest single cost; and the canvas renders
  only while the camera is moving, stepping its pixel ratio down if frames
  run under 50 fps. It flies at 57–60 now and costs nothing while you read.
- Sections open over a baked blurred plate, not a live backdrop blur.
- Opening a section pins the landing where it was (`data-section-active`):
  the descent trails the scrollbar by design, and the distance it still had
  to cover used to play out after the section closed, as the cards jumping.

These were measured by hand; there is no performance test in the suite.

## Scrollbars

There are no browser scrollbars anywhere (`src/index.css`). Where knowing
your place matters, `src/shared/ScrollRail.tsx` draws the site's own: on
the landing and in the flight it shows what is on screen, the glided
position rather than the raw scroll, and a drag or a press on the track
moves there; a writeup's reader gets one too (`ElementRail`). Everything
still scrolls by wheel, touch and keyboard, and the rails are hidden from
assistive tech as the duplicates they are. On touch screens they are an
indicator only.

## Attribution

Both Sketchfab models keep their credit embedded in the file (`asset.extras`),
and both require attribution wherever the site is published. The site gives
it in the footer (`CREDITS` in `src/theme.ts`), with links to each source and
licence and a note that the models were adapted (compressed with
glTF-Transform; the ship's materials re-shaded unlit).

- `public/models/hands.glb` — "Damaged hands" by Coffeek
  (https://sketchfab.com/3d-models/damaged-hands-57df95d1c6e746fd9c414948f71de937),
  CC-BY-4.0.
- `public/models/ship.glb` — "Ship in Clouds" by Bastien Genbrugge
  (https://sketchfab.com/3d-models/ship-in-clouds-c475323dc7f24e26ba2009c08c8e1941),
  CC-BY-4.0.
- `public/models/chess.glb` — "Chess Set" by Riley Queen, Poly Haven
  (https://polyhaven.com/a/chess_set), CC0. Its material and texture names
  (`chess_set_board_diff`, `_nor_gl`, `_rough`) are Poly Haven's. CC0 asks
  for nothing; it is credited in the footer anyway.
- `public/draco/` — Google's Draco decoder, Apache-2.0.
- Fonts: Gloock, Cormorant Garamond, JetBrains Mono and IBM Plex Sans are all
  under the SIL Open Font License 1.1.
- The meadow plate began as a Minecraft screenshot; see the hero spec §9.
