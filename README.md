# Villa Cavo — Admin panel

A separate project from the website, with its own frontend (React, `src/`) and backend
(Vercel serverless functions, `api/`). Edit every page section, show/hide sections, manage suites,
experiences, services, testimonials, gallery, contact details, navigation and site-wide text,
upload/delete photos, preview unpublished changes and restore earlier published versions.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5174   password: admin
```
Locally the backend runs inside the dev server and saves to a git-ignored `.admin-data/` folder.
Start the website too (`npm run dev` in the `VILLA CAVO` folder, port 5173) to use Preview and see changes.

## Deploy on Vercel (its own Vercel project)
This folder is its own git repository, separate from the website's.
1. Push this folder to its own GitHub repository (not the website's).
2. Vercel → **Add New → Project** → import that admin repository (Framework preset: Vite). Deploy.
3. **Storage → Create → Blob** (public access) → connect it to this admin project.
   This adds `BLOB_READ_WRITE_TOKEN` automatically.
4. **Settings → Environment Variables:**
   - `ADMIN_PASSWORD` — the password for signing in
   - `VITE_SITE_URL` — the website address, e.g. `https://villacavo.vercel.app` (for Preview)
5. **Redeploy** the admin project.
6. In the **website** project add `VITE_CONTENT_URL` = `https://<admin-address>/api/content`, then redeploy the website.

## Backend endpoints (`api/`)
| Endpoint | Purpose |
|---|---|
| `POST /api/login` | sign in, returns a 7-day token |
| `GET /api/health` | setup check (password set, storage connected) |
| `GET /api/content` | published content (public, read by the website) |
| `PUT /api/content` | publish (signed in) |
| `GET /api/history` | published versions (signed in) |
| `GET/POST/DELETE /api/media` | list, upload, delete photos (signed in) |

## Shared files
`src/shared/` and `public/images` are copies of the website's default content, icons and photos.
`npm run dev` / `npm run build` refresh them automatically from the website folder next to this one,
`../VILLA CAVO` (or set `SITE_DIR` to point elsewhere). Run `npm run sync` to refresh by hand.
Commit the refreshed copies so the Vercel build (which has no website folder) uses them.
