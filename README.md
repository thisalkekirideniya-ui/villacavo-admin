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
Locally the backend runs inside the dev server and saves to a git-ignored `.admin-data/` folder
(or to Supabase, if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in `.env.local`).
To test Cloudinary uploads locally, put `CLOUDINARY_URL=...` in a `.env.local` file (git-ignored).
Start the website too (`npm run dev` in the parent `VILLA CAVO` folder, port 5173) to use Preview and see changes.

## Deploy on Vercel (its own Vercel project)
This is its own git repository (`villacavo-admin`), fully separate from the website repo. Locally it sits
in the website's `admin/` folder, which the website's `.gitignore` excludes.
1. Push this folder to its own GitHub repository (not the website's).
2. Vercel → **Add New → Project** → import that admin repository (Framework preset: Vite). Deploy.
3. **Storage — Supabase (recommended):** create a project at supabase.com, open **SQL Editor → New query**,
   paste [`supabase/setup.sql`](supabase/setup.sql) and **Run**. Then add `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API) in step 4. Page text and publish history go to the
   `site_versions` table; uploaded photos go to the `media` bucket unless Cloudinary is set.
   *Or* use **Storage → Create → Blob** (public access) in Vercel instead, which adds `BLOB_READ_WRITE_TOKEN`.
   If both are set, Supabase is used.
4. **Settings → Environment Variables:**
   - `ADMIN_PASSWORD` — the password for signing in
   - `VITE_SITE_URL` — the website address, e.g. `https://villacavo.vercel.app` (for Preview)
   - Optional — photos in **Cloudinary**: `CLOUDINARY_URL` — copy the “API environment variable”
     (`cloudinary://KEY:SECRET@CLOUD_NAME`) from the Cloudinary dashboard. Uploaded photos then go to
     the `villa-cavo` folder in Cloudinary (change with `CLOUDINARY_FOLDER`) and are served with
     automatic format and quality. Without it, photos are stored in Vercel Blob. Page text is kept in
     Supabase (or Vercel Blob).
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
`npm run dev` / `npm run build` refresh them automatically from the website in the parent folder
(or set `SITE_DIR` to point elsewhere). Run `npm run sync` to refresh by hand.
Commit the refreshed copies so the Vercel build (which has no website folder) uses them.
