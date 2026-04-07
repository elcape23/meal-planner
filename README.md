# Plan Nutricional — Ledesma Juan José

Weekly meal planner with shopping list and PDF recipe export.

## Stack
- Next.js 14 (App Router)
- @react-pdf/renderer (server-side PDF generation)
- Tailwind CSS

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
4. Click **Deploy** — that's it!

## Run locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)
