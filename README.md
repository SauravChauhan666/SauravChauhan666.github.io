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

Markup hooks: `data-enter`, `data-stagger`, `data-parallax`, and
`data-count` / `data-prefix` / `data-suffix` / `data-decimals`.

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
