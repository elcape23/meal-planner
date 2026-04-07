import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { RECIPES, DAYS, fmt } from "@/lib/data";

const GREEN_DARK  = "#2c4a1e";
const GREEN_MID   = "#3a6b28";
const GREEN_LIGHT = "#eaf3e6";
const CREAM       = "#faf7f2";
const TAN         = "#e8e0d0";
const BROWN_DARK  = "#2c2416";
const BROWN_MID   = "#6a5a3a";
const BROWN_LIGHT = "#f5f0e8";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    backgroundColor: CREAM,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: GREEN_DARK,
    padding: "28 24 22 24",
  },
  headerLabel: {
    fontSize: 8,
    color: "#8ab87a",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 5,
    fontFamily: "Times-Roman",
  },
  headerTitle: {
    fontSize: 22,
    color: "#f5f0e8",
    fontFamily: "Times-Bold",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 11,
    color: "#6a8a5a",
    fontFamily: "Times-Italic",
  },
  content: {
    padding: "20 24",
  },
  daySection: {
    marginBottom: 16,
  },
  dayDivider: {
    borderTopWidth: 2,
    borderTopColor: GREEN_LIGHT,
    marginBottom: 8,
    paddingTop: 10,
  },
  dayTitle: {
    fontSize: 15,
    fontFamily: "Times-Bold",
    color: GREEN_DARK,
    marginBottom: 8,
  },
  mealBlock: {
    marginBottom: 12,
  },
  mealLabel: {
    fontSize: 8,
    fontFamily: "Times-BoldItalic",
    color: BROWN_MID,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  recipeName: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: BROWN_DARK,
    marginBottom: 6,
  },
  recipeNote: {
    fontSize: 9,
    fontFamily: "Times-Italic",
    color: BROWN_MID,
    marginBottom: 4,
  },
  ingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  ingRowOdd: {
    backgroundColor: BROWN_LIGHT,
  },
  ingRowEven: {
    backgroundColor: "#ffffff",
  },
  ingName: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: BROWN_DARK,
    flex: 1,
  },
  ingQty: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: GREEN_MID,
  },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: TAN,
    marginTop: 10,
    paddingTop: 8,
    marginHorizontal: 24,
  },
  footerText: {
    fontSize: 8,
    fontFamily: "Times-Italic",
    color: "#a09080",
    textAlign: "center",
  },
});

function RecipePDF({ selectedDayIndices, mealTypes }) {
  const selectedDays = selectedDayIndices.map(i => DAYS[i]);
  const dayNames = selectedDays.map(d => d.day).join(", ");

  return (
    <Document title={`Recetas — ${dayNames}`} author="Plan Nutricional Ledesma Juan José">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Plan Nutricional</Text>
          <Text style={styles.headerTitle}>Ledesma Juan José</Text>
          <Text style={styles.headerSub}>{dayNames} · 1 porción</Text>
        </View>

        <View style={styles.content}>
          {selectedDays.map((dayData, di) => (
            <View key={dayData.day} style={styles.daySection}>
              <View style={di === 0 ? { marginBottom: 8 } : styles.dayDivider}>
                <Text style={styles.dayTitle}>{dayData.day.toUpperCase()}</Text>
              </View>

              {["almuerzo", "cena"].filter(m => mealTypes[m]).map(meal => {
                const recipe = RECIPES[dayData[meal]];
                return (
                  <View key={meal} style={styles.mealBlock}>
                    <Text style={styles.mealLabel}>
                      {meal === "almuerzo" ? "ALMUERZO" : "CENA"}
                    </Text>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    {recipe.note && (
                      <Text style={styles.recipeNote}>* {recipe.note}</Text>
                    )}
                    {recipe.ingredients.map((ing, ii) => (
                      <View
                        key={ing.name}
                        style={[styles.ingRow, ii % 2 === 0 ? styles.ingRowOdd : styles.ingRowEven]}
                      >
                        <Text style={styles.ingName}>• {ing.name}</Text>
                        <Text style={styles.ingQty}>{fmt(ing.amount, ing.unit)}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Plan Nutricional · Ledesma Juan José
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function POST(req) {
  try {
    const { selectedDays, meals } = await req.json();

    const buffer = await renderToBuffer(
      <RecipePDF selectedDayIndices={selectedDays} mealTypes={meals} />
    );

    const dayNames = selectedDays.map(i => DAYS[i].short).join("-");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recetas_${dayNames}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
