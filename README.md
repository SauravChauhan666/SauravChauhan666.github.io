# sauravchauhan666.github.io

Personal portfolio of **Saurav Chauhan**, full-stack developer at BitQit working on Sparq, a Shopify
search and merchandising app (NestJS, PostgreSQL, Redis, Vue.js / Nuxt).

**Live:** https://sauravchauhan666.github.io/

Built with plain HTML, CSS and JavaScript: no framework, no build step, no dependencies.

## Structure

```
index.html          one-page landing
projects/*.html     one detail page per project
assets/styles.css   styles; colours, type and spacing are variables at the top
assets/main.js      scroll and entrance animations (switched off for prefers-reduced-motion)
resume.pdf          downloadable résumé
404.html            not-found page
```

## Running locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Use a server rather than opening `index.html` directly, because
paths are root-relative and won't resolve over `file://`.

## Deploying

GitHub Pages serves the `main` branch. Push and the site updates in about a minute.
