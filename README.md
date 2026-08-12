# sauravchauhan666.github.io

Personal site and portfolio. Static HTML, CSS and JavaScript — no framework, no build step,
no dependencies.

**Live:** https://sauravchauhan666.github.io/

## Structure

```
index.html              one-page landing
projects/*.html         one detail page per project
assets/styles.css       the whole design system; tokens at the top
assets/main.js          the motion layer (see below)
resume.pdf              downloadable résumé
404.html                styled not-found page (served by GitHub Pages)
```

## Motion

`assets/main.js` is ten small modules, no dependencies:

| | |
|---|---|
| Entrance | hero and page headers rise in, staggered; the `<h1>` unmasks |
| Reveal | sections fade up on scroll; children of `[data-stagger]` follow one another |
| Counters | `[data-count]` counts up when it scrolls into view |
| Progress | thin accent bar tracking scroll position |
| Header | hides on scroll down, returns on scroll up |
| Parallax | `[data-parallax="0.12"]` drifts at a fraction of scroll speed |
| Magnetic | buttons lean toward the cursor |
| Sheen | card gradient follows the cursor |
| Smooth scroll | eased wheel scrolling and animated anchor jumps |
| Scroll-spy | nav highlights the section you are in |

Two rules the motion follows:

- **`prefers-reduced-motion: reduce` turns all of it off.** Every module checks the query;
  counters jump to their final value, the marquee freezes, smooth scroll is not installed and
  native scrolling is handed back. Test it with Chrome's *Rendering → Emulate prefers-reduced-motion*.
- **Nothing depends on JavaScript to be readable.** `<html>` ships with `class="no-js"`, which
  an inline script in `<head>` removes before first paint. If the script never runs, the `.no-js`
  rules keep every animated element visible.

### Markup hooks

| Hook | Does |
|---|---|
| `data-enter` | joins the on-load entrance ladder (90ms apart, in document order) |
| `.reveal` + `data-reveal="rail\|figure"` | reveals on scroll; the variant sets direction and duration via `--rx` / `--ry` / `--rdur` |
| `data-stagger` | children reveal as a diagonal wave from the group's top-left |
| `data-draw` | SVG inside draws itself — see below |
| `data-odo` + `data-prefix` / `data-suffix` | odometer digit-roll |
| `data-count` (+ `data-count-manual`) | plain count-up; manual = another module triggers it |
| `data-console` | the tenant-isolation panel |
| `data-pin` | the pinned horizontal stage |
| `data-parallax="0.12"` | drifts at a fraction of scroll speed |

### Drawing an SVG

Every animated stroke carries `pathLength="100"` and `class="stroke"`, with
`style="--i:N"` setting its place on a 45ms ladder. Because `pathLength`
normalises any geometry to 100 units, one `stroke-dasharray` value draws any
path — there is no measuring JavaScript, and the diagrams stay hand-editable.
Filled shapes use `class="fill"` on the same ladder. Anything transformed needs
a `fx-` class prefix, which carries `transform-box: fill-box` (without it, SVG
`transform-origin` resolves against the viewport — the most common silent
failure in hand-written SVG animation).

### The three rules main.js keeps

1. **One rAF loop.** Every scroll-linked job registers in `frameJobs`; the loop
   stops itself when no job reports work. No second loop, no second listener.
2. **Read then write.** A frame job batches all `getBoundingClientRect` reads
   before any style write, so nothing thrashes layout.
3. **The reduced-motion end state is the design.** Every animation is only the
   assembly of a composition that already reads standing still — the console
   shows `patched`, the bar sits at 90, the diagram is fully drawn.

### Colour budget

`--signal-warn` (#e2795a) has a hard budget of **exactly two uses site-wide**:
the leaked `store_id` in the console, and the SECURITY kicker. A third use means
the identity has drifted.

## Running locally

There is nothing to install.

```bash
cd ~/Saurav/portfolio
python3 -m http.server 8000
```

Then open http://localhost:8000. Use a server rather than opening `index.html` directly —
paths are root-relative (`/assets/styles.css`), so `file://` will not resolve them.

## Deploying

GitHub Pages serves the `main` branch root directly. Push and it is live in about a minute.

```bash
git add -A && git commit -m "..." && git push
```

## Editing notes

- **Colours, type and spacing** are CSS custom properties at the top of `assets/styles.css`.
  Change them there; nothing else hardcodes a value.
- **The header and footer are duplicated** across all five HTML files — an accepted cost of
  having no build step. Edit them in every file, or move to a static site generator if the
  site grows past ~8 pages.
- **Résumé updates:** replace `resume.pdf` and update the matching copy in `index.html`.
