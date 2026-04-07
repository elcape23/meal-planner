# Plan Nutricional — Ledesma Juan José

Weekly meal planner with shopping list, PDF recipe export, and meal tracking.

## Stack
- Next.js 14 (App Router)
- @react-pdf/renderer (server-side PDF generation)
- Supabase (meal tracking database)
- Tailwind CSS

## Supabase Setup

Run this in your Supabase **SQL Editor**:

```sql
create table meal_logs (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  meal text not null check (meal in ('almuerzo', 'cena')),
  status text not null check (status in ('plan', 'alternative', 'skipped')),
  recipe_name text,
  ingredients text,
  notes text,
  created_at timestamptz default now(),
  unique(date, meal)
);
```

## Environment Variables

In Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/meal-planner.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Add environment variables
5. Click **Deploy**

## Run locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)
