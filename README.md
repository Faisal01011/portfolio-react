# Faisal Fayaz — Interactive Portfolio

Neon-themed React + Vite portfolio powered by real GitHub projects.

## Features

- **Dark / light theme** with persistence (`localStorage`)
- **XP + achievements** for exploring (open projects, try filters, toggle theme, send contact, type `ionstorm`)
- **Contact form** with validation (swap in Formspree / your API for production)
- **3D tilt project cards**, particle background, typing hero
- Filterable projects: games · AI/ML · web/3D · mobile · tools

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push to GitHub and import into Vercel (framework: Vite). Zero config.

## Wire the contact form

In `src/components/ContactForm.tsx`, replace the simulated send with Formspree (or your backend):

```ts
await fetch('https://formspree.io/f/YOUR_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form),
});
```

## Stack

React 19 · TypeScript · Vite · CSS custom properties (theme tokens)

## Author

[@Faisal01011](https://github.com/Faisal01011)
