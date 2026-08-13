# LensAtlas v1

LensAtlas is a photography discovery platform centered around a world map. This codebase includes:

- Interactive world map with photo markers
- Community and famous-photo categories
- Search by place, landmark, and photographer
- Photographer accounts and profiles
- Photo uploads with location geocoding
- Camera, lens, and shooting-condition metadata
- Likes and saved locations
- "Shoot this location" workflow
- Database schema for comments, follows, saved spots, shoot lists, reports, and famous-photo records
- Supabase authentication + storage + PostgreSQL support
- Demo mode that works without external services

## Run locally

1. Install Node.js 18+.
2. In this folder run:

```bash
npm install
npm run dev
```

3. Open the local URL shown by Vite.

The app works in **Demo Mode** without any environment variables. Demo uploads are stored only in your browser.

## Turn on the real online service

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. In Supabase Storage, verify the `photos` bucket exists and is public for image delivery.
4. Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

5. Restart Vite.

The login, user profiles, photo database, cloud image storage, likes, follows, saves, comments, and moderation tables are then backed by Supabase.

## Production deployment

The easiest deployment path is Vercel:

- Connect this Git repository to Vercel.
- Set the two `VITE_SUPABASE_*` environment variables in Vercel.
- Build command: `npm run build`
- Output directory: `dist`

## Next production hardening

Before a public launch, add:

- Email verification and password reset UX
- Real comment/follow UI screens
- Admin moderation dashboard
- Image transformation/resizing and EXIF stripping policy
- Rate limits / abuse protection
- Copyright reporting flow
- Privacy and terms pages
- Analytics and error monitoring
- Weather/sunrise/golden-hour API integration
- Map clustering for dense cities
- Better famous-photo provenance and licensing records
- Monetization (premium planning tools, photographer promotion, etc.)
