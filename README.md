# Villa Cavo — Admin panel

The admin panel's **frontend only** (React, `src/`). Edit every page section, show/hide sections, manage suites,
experiences, services, testimonials, gallery, contact details, navigation and site-wide text,
upload/delete photos, preview unpublished changes and restore earlier published versions.

Everything it saves goes through the shared backend, which is its own repo:

| Repo | What | Local |
|---|---|---|
| `villacavo` | Public website (frontend) | http://localhost:5173 |
| `villacavo-admin` | **This repo**: admin panel (frontend) | http://localhost:5174 |
| `villacavo-backend` | API, storage, sign-in | http://localhost:5175 |

## Run locally
```bash
# 1. backend first (in VILLA CAVO/backend)
npm run dev      # http://localhost:5175
# 2. this admin
npm install
npm run dev      # http://localhost:5174   password: admin
```
Start the website too (`npm run dev` in the parent `VILLA CAVO` folder, port 5173) to use Preview and see changes.

## Deploy on Vercel (its own Vercel project)
1. Push this folder to its own GitHub repository (`villacavo-admin`).
2. Vercel → **Add New → Project** → import it (Framework preset: Vite).
3. **Settings → Environment Variables:**
   - `VITE_API_URL` — the backend address, e.g. `https://villacavo-backend.vercel.app`
   - `VITE_SITE_URL` — the website address, e.g. `https://villacavo.vercel.app` (for Preview)
4. **Redeploy.** The password and the Supabase / Cloudinary keys belong in the **backend** project, not here.

## Shared files
`src/shared/` and `public/images` are copies of the website's default content, icons and photos.
`npm run dev` / `npm run build` refresh them automatically from the website in the parent folder
(or set `SITE_DIR` to point elsewhere). Run `npm run sync` to refresh by hand.
Commit the refreshed copies so the Vercel build (which has no website folder) uses them.
