import { neon } from "@neondatabase/serverless";

const getSql = () => neon(process.env.DATABASE_URL);

/** GET /api/meal-logs?from=YYYY-MM-DD&to=YYYY-MM-DD — logs in the date range. */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  if (!from || !to) {
    return Response.json({ error: "Missing 'from' or 'to' query param" }, { status: 400 });
  }
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, date::text AS date, meal, status, recipe_name, ingredients, notes
      FROM meal_logs
      WHERE date BETWEEN ${from} AND ${to}
    `;
    return Response.json(rows);
  } catch (e) {
    console.error("GET /api/meal-logs failed:", e);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}

/** POST /api/meal-logs — upsert one log keyed by (date, meal). */
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.date || !body?.meal || !body?.status) {
    return Response.json({ error: "Missing 'date', 'meal' or 'status'" }, { status: 400 });
  }
  const { date, meal, status, recipe_name = null, ingredients = null, notes = null } = body;
  try {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO meal_logs (date, meal, status, recipe_name, ingredients, notes)
      VALUES (${date}, ${meal}, ${status}, ${recipe_name}, ${ingredients}, ${notes})
      ON CONFLICT (date, meal) DO UPDATE SET
        status      = EXCLUDED.status,
        recipe_name = EXCLUDED.recipe_name,
        ingredients = EXCLUDED.ingredients,
        notes       = EXCLUDED.notes
      RETURNING id, date::text AS date, meal, status, recipe_name, ingredients, notes
    `;
    return Response.json(rows[0]);
  } catch (e) {
    console.error("POST /api/meal-logs failed:", e);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
