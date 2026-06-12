// One-time schema setup. Run with:
//   node --env-file=.env.local scripts/init-db.mjs
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS meal_logs (
    id          SERIAL PRIMARY KEY,
    date        DATE NOT NULL,
    meal        TEXT NOT NULL,
    status      TEXT NOT NULL,
    recipe_name TEXT,
    ingredients TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (date, meal)
  )
`;

const [{ count }] = await sql`SELECT count(*)::int AS count FROM meal_logs`;
console.log(`meal_logs table ready (${count} existing rows)`);
