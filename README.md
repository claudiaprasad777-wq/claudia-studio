# The Claudia Studio

This portfolio is now a SvelteKit static site. All original pages, imagery, styling, navigation, and interactions have been retained, with Svelte handling page rendering and client-side behaviour.

## Work locally

```bash
npm install
npm run dev
```

Create the production site with:

```bash
npm run check
npm run build
```

The deployable site is written to `build/`.

## Deploy to Cloudflare Pages

1. Push this folder to a Git repository, then create a **Pages** project in Cloudflare.
2. Select the repository and use these build settings:
   - Framework preset: `SvelteKit` (or `None` if it is not listed)
   - Build command: `npm run build`
   - Build output directory: `build`
   - Node.js version: `20` or newer
3. Deploy. Cloudflare Pages will publish the static SvelteKit output, including the supplied cache and security headers.

For a manual deploy, run `npm run build` and upload the `build/` folder using Cloudflare Pages Direct Upload.
