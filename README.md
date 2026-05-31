# Mini Uzzle

Static-first React app for generating Uzzle Stack Royale puzzle cards on a half-tile lattice. The current implementation runs entirely in the browser and focuses on deterministic seeded generation plus recursive center-of-mass stability validation.

## Current slice

- React + TypeScript + Vite app for local WSL/Linux development
- Seed-driven card generation with 1 to 4 block sets
- Half-tile placement model using 6x2 and 2x6 footprints
- Recursive support and center-of-mass validation for counterbalanced structures
- Shareable URL state with `seed` and `sets` query params
- GitHub Actions CI and GitHub Pages deployment wiring

## Local development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run test
npm run lint
npm run build
```

## Deployment

The repository is configured for GitHub Pages deployment from GitHub Actions.

- CI runs on pushes and pull requests.
- Pages deploy runs on pushes to `master`.
- The production build uses `/mini-uzzle/` as the base path when `GITHUB_PAGES=true` is set in CI.

## Next implementation targets

- Strengthen generation so it explores better candidate placements and produces more interesting structures.
- Add curated fixture cards and broader engine tests.
- Add printable/exportable card views.
- Add a provider boundary for future multiplayer or server-backed generation.
