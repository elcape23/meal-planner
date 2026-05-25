"use client";

import { useState, useMemo, useEffect } from "react";
import { RECIPES, DAYS, CATEGORIES, fmt, getCat } from "@/lib/data";
import Seguimiento from "@/components/Seguimiento";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon, BookOpen01Icon, ShoppingCart01Icon,
  Task01Icon, UserIcon,
  Coffee04Icon, Dish02Icon,
  Search01Icon, Cancel01Icon,
  Leaf01Icon, MilkCartonIcon, ForkIcon, WheatIcon, NutIcon, OilBarrelIcon,
  FileDownloadIcon, Download01Icon,
  CheckmarkCircle01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";

/* ───────────────────────── Design tokens ─────────────────────────
   Mirrors Figma design system variables exposed via CSS custom
   properties in globals.css. Use `T.*` in inline styles for clarity. */
const T = {
  bgDefault:        "var(--color-bg-default)",
  bgSurface:        "var(--color-bg-surface-neutral)",
  bgFill:           "var(--color-bg-fill-neutral)",
  textDefault:      "var(--color-text-default)",
  textSecondary:    "var(--color-text-secondary)",
  textPrimary:      "var(--color-text-primary)",
  iconDefault:      "var(--color-icon-default)",
  iconSecondary:    "var(--color-icon-secondary)",
  iconPrimary:      "var(--color-icon-primary)",
  borderDisabled:   "var(--color-border-disabled)",
  radiusMd:         "12px",
  radiusMax:        "9999px",
};

/* ─── Raw hex (used where vars can't be — gradients, rgba mixes) ─── */
const HEX = {
  bgDefault:     "#f7f7f3",
  bgSurface:     "#f1f2ec",
  bgFill:        "#e4e6de",
  textDefault:   "#1c1f1b",
  textSecondary: "#6e736a",
  textPrimary:   "#153014",
  borderDisabled:"#e4e6de",
};

/* ──────────────────── Legacy palette (other tabs) ────────────────
   The Lista / Recetas tabs were built earlier with the warmer cream
   palette; we keep them untouched so this PR is scoped to the Home
   page redesign only. */
const S = {
  greenDark:  "#2c4a1e",
  greenMid:   "#3a6b28",
  greenLight: "#eaf3e6",
  cream:      "#faf7f2",
  tan:        "#e8e0d0",
  brownDark:  "#2c2416",
  brownMid:   "#6a5a3a",
  brownLight: "#f5f0e8",
};

/* ───────────────────────── Helpers ───────────────────────── */
function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function currentWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDateStr(d);
  });
}

/** "Buen día" / "Buenas tardes" / "Buenas noches" by local hour. */
function greetingForHour(h) {
  if (h < 12) return "Buen día,";
  if (h < 20) return "Buenas tardes,";
  return "Buenas noches,";
}

/** "Miércoles, 02 Sep" — Spanish, capitalised weekday. */
function formatTodayHeading(date) {
  const s = date.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "short" });
  // Output like "miércoles, 02 sept." → "Miércoles, 02 Sep"
  return s
    .replace(/\.$/, "")
    .replace(/sept/i, "Sep")
    .replace(/^./, c => c.toUpperCase());
}

const MEAL_CATEGORY = {
  desayuno: "desayuno_merienda",
  almuerzo: "almuerzo_cena",
  merienda: "desayuno_merienda",
  cena:     "almuerzo_cena",
};

const MEAL_ICON = {
  desayuno: Coffee04Icon,
  almuerzo: Dish02Icon,
  merienda: Coffee04Icon,
  cena:     Dish02Icon,
};

const MEAL_LABEL = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena:     "Cena",
};

const CAT_ICON_COMP = {
  "Proteínas":             ForkIcon,
  "Lácteos y quesos":      MilkCartonIcon,
  "Verduras y hojas":      Leaf01Icon,
  "Cereales":              WheatIcon,
  "Aceites y condimentos": OilBarrelIcon,
  "Frutos secos":          NutIcon,
};

const CHECKIN_STATUS = {
  plan:        { label: "Seguí el plan",  color: HEX.textPrimary },
  alternative: { label: "Comí otra cosa", color: "#a37200" },
  skipped:     { label: "No comí",        color: HEX.textSecondary },
};


/* ───────────────────────── Reusable primitives ───────────────────────── */

/** Pill button — Figma `ButtonNeutral / sm / filled`. */
function PillButton({ children, onClick, disabled, variant = "filled", style = {} }) {
  const filled = variant === "filled";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 36,
        padding: "8px 16px",
        borderRadius: T.radiusMax,
        border: "none",
        background: filled ? T.bgFill : "transparent",
        color: T.textDefault,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: "16px",
        fontFamily: "'Inter', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Underlined text-link button — Figma `ButtonNeutral / lg / link`. */
function LinkButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: T.textDefault,
        fontFamily: "'Inter', sans-serif",
        fontSize: 16,
        fontWeight: 500,
        lineHeight: "24px",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
      }}
    >
      {children}
    </button>
  );
}

/** Section heading — Figma `Globals - Heading` (heading + optional action). */
function SectionHeading({ title, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "4px 8px", width: "100%",
    }}>
      <span style={{
        fontSize: 19, fontWeight: 500, lineHeight: "24px",
        color: T.textDefault, fontFamily: "'Inter', sans-serif",
      }}>{title}</span>
      {action}
    </div>
  );
}


/* ───────────────────────── Component ───────────────────────── */

export default function MealPlanner() {
  const today = useMemo(() => new Date(), []);
  const todayDow = today.getDay(); // 0=Sun, 6=Sat
  const isWeekend = todayDow === 0 || todayDow === 6;
  // Planner data is indexed Mon=0..Fri=4
  const plannerDay = !isWeekend ? todayDow - 1 : null;
  const todayDateStr = useMemo(() => localDateStr(today), [today]);

  const [tab,        setTab]        = useState("planner");
  const [recipeModal,setRecipeModal]= useState(null); // { meal, recipe }
  const [homeCheckin,setHomeCheckin]= useState(null); // { meal, recipe }
  const [homeAltForm,setHomeAltForm]= useState({ recipeName: "", ingredients: "", notes: "" });
  const [homeSaving, setHomeSaving] = useState(false);
  const [weekLogs,   setWeekLogs]   = useState({});

  const [checked,        setChecked]        = useState({});
  const [collapsedCats,  setCollapsedCats]  = useState(new Set());
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [recipeCat,      setRecipeCat]      = useState("almuerzo_cena");
  const [recipeSearch,   setRecipeSearch]   = useState("");
  const [printModal,     setPrintModal]     = useState(false);
  const [exporting,      setExporting]      = useState(false);

  useEffect(() => {
    const dates = currentWeekDates();
    supabase.from("meal_logs").select("*").in("date", dates).then(({ data }) => {
      if (!data) return;
      const map = {};
      data.forEach(row => {
        if (!map[row.date]) map[row.date] = {};
        map[row.date][row.meal] = row;
      });
      setWeekLogs(map);
    });
  }, []);

  const toggleCheck = (n) => setChecked(p => ({ ...p, [n]: !p[n] }));

  const saveHomeLog = async (status, overrideRecipeName = null) => {
    if (!homeCheckin) return;
    setHomeSaving(true);
    const { meal, recipe } = homeCheckin;
    const payload = {
      date:        todayDateStr,
      meal,
      status,
      recipe_name: overrideRecipeName ?? (status === "plan" ? recipe?.name ?? null : (homeAltForm.recipeName || null)),
      ingredients: status === "alternative" ? homeAltForm.ingredients : null,
      notes:       homeAltForm.notes || null,
    };
    const { data: existing } = await supabase
      .from("meal_logs").select("id").eq("date", todayDateStr).eq("meal", meal).maybeSingle();
    if (existing?.id) {
      await supabase.from("meal_logs").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("meal_logs").insert(payload);
    }
    setWeekLogs(prev => ({
      ...prev,
      [todayDateStr]: { ...(prev[todayDateStr] || {}), [meal]: { ...payload, id: existing?.id ?? Date.now() } },
    }));
    setHomeSaving(false);
    setHomeCheckin(null);
    setHomeAltForm({ recipeName: "", ingredients: "", notes: "" });
  };

  const shoppingList = useMemo(() => {
    const totals = {};
    DAYS.forEach(d => {
      ["almuerzo","cena"].forEach(meal => {
        RECIPES[d[meal]].ingredients.forEach(({ name, amount, unit }) => {
          if (!totals[name]) totals[name] = { amount: 0, unit };
          totals[name].amount += amount;
        });
      });
    });
    return Object.entries(totals).map(([name, { amount, unit }]) => ({
      name, amount, unit, cat: getCat(name),
    }));
  }, []);

  const grouped = useMemo(() => {
    const g = {};
    shoppingList.forEach(item => {
      if (!g[item.cat]) g[item.cat] = [];
      g[item.cat].push(item);
    });
    return g;
  }, [shoppingList]);

  const total        = shoppingList.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allDayIndices = [0,1,2,3,4];

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDays: allDayIndices, meals: { almuerzo: true, cena: true } }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `recetas_semana.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error generando el PDF. Intentá de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  const modalEntries = useMemo(() => {
    return DAYS.flatMap(d =>
      ["almuerzo","cena"].map(meal => ({ day: d.day, meal, recipe: RECIPES[d[meal]] }))
    );
  }, []);

  /* ──────────────── Today's planned meals (for the carousel) ──────────────── */
  const todayPlannedMeals = useMemo(() => {
    if (plannerDay === null) return [];
    const d = DAYS[plannerDay];
    return [
      { key: "almuerzo", recipe: RECIPES[d.almuerzo] },
      { key: "cena",     recipe: RECIPES[d.cena] },
    ];
  }, [plannerDay]);

  /* ──────────────── Registro list — 4 meals for today ──────────────── */
  const registroMeals = ["desayuno", "almuerzo", "merienda", "cena"].map(meal => {
    const log     = weekLogs[todayDateStr]?.[meal];
    const planned = plannerDay !== null && DAYS[plannerDay][meal]
      ? RECIPES[DAYS[plannerDay][meal]]
      : null;
    return { meal, log, planned };
  });

  return (
    <div style={{ minHeight: "100vh", background: T.bgDefault, fontFamily: "'Inter', sans-serif", color: T.textDefault }}>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px 110px" }}>

        {/* ────────────────────── PLANNER (HOME) ────────────────────── */}
        {tab === "planner" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 40 }}>

            {/* Header — greeting + bell */}
            <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{
                  fontSize: 19, fontWeight: 400, lineHeight: "24px",
                  color: T.textSecondary,
                }}>
                  {greetingForHour(today.getHours())}
                </span>
                <span style={{
                  fontSize: 28, fontWeight: 700, lineHeight: "32px",
                  color: T.textDefault,
                }}>
                  Juan José
                </span>
              </div>
              <button
                aria-label="Notificaciones"
                style={{
                  width: 36, height: 36, borderRadius: T.radiusMax,
                  background: "transparent", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <HugeiconsIcon icon={Notification01Icon} size={20} color={HEX.textDefault} strokeWidth={1.75} />
              </button>
            </header>

            {/* ── Today section ───────────────────────────────────── */}
            <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Heading row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 8px" }}>
                <span style={{
                  fontSize: 19, fontWeight: 500, lineHeight: "24px",
                  color: T.textDefault,
                }}>
                  Hoy
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 400, lineHeight: "24px",
                  color: T.textSecondary,
                }}>
                  {formatTodayHeading(today)}
                </span>
              </div>

              {/* Carousel of today's planned meals */}
              {plannerDay === null ? (
                <EmptyDayCard />
              ) : (
                <div
                  className="no-scrollbar"
                  style={{
                    display: "flex", gap: 12,
                    overflowX: "auto", scrollSnapType: "x mandatory",
                    marginRight: "-20px",
                  }}
                >
                  {todayPlannedMeals.map(({ key, recipe }) => (
                    <TodayCard
                      key={key}
                      meal={key}
                      recipe={recipe}
                      onOpen={() => setRecipeModal({ meal: key, recipe })}
                    />
                  ))}
                  {/* right-edge spacer — padding-right is ignored on overflow:auto flex containers */}
                  <div style={{ flexShrink: 0, width: 20 }} />
                </div>
              )}
            </section>

            {/* ── Registro section ───────────────────────────────── */}
            <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionHeading
                title="Registro"
                action={<LinkButton onClick={() => setTab("seguimiento")}>Ver todo</LinkButton>}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {registroMeals.map(({ meal, log, planned }) => (
                  <RegistroListItem
                    key={meal}
                    meal={meal}
                    log={log}
                    onRegister={() => {
                      setHomeAltForm({ recipeName: "", ingredients: "", notes: "" });
                      setHomeCheckin({ meal, recipe: planned });
                    }}
                  />
                ))}
              </div>
            </section>

          </div>
        )}

        {/* ────────────────────── LISTA (untouched legacy palette) ────────────────────── */}
        {tab === "lista" && (
          <div className="fade-in">
            {shoppingList.length === 0 ? (
              <div style={{ textAlign:"center", padding:"50px 0", color:"#8a7a5a" }}>
                <HugeiconsIcon icon={Leaf01Icon} size={40} color="#a09080" style={{ margin:"0 auto 12px", display:"block" }} />
                <p style={{ fontStyle:"italic" }}>Seleccioná días en la pestaña Semana.</p>
              </div>
            ) : (
              <>
                <div style={{
                  background:`linear-gradient(135deg,${S.greenMid},#2c5020)`,
                  borderRadius:12, padding:"15px 18px", marginBottom:18,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                  <div>
                    <div style={{ fontSize:13, color:"#a8d5a0" }}>
                      5 días · {DAYS.map(d => d.short).join(", ")}
                    </div>
                    {checkedCount > 0 && <div style={{ fontSize:11, color:"#7aaa6a", marginTop:2 }}>{checkedCount} de {total} listos</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:28, fontWeight:900, color:"#fff", fontFamily:"'Inter',sans-serif" }}>{total}</div>
                    <div style={{ fontSize:10, color:"#a8d5a0" }}>ingredientes</div>
                  </div>
                </div>

                {checkedCount > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ height:4, background: S.tan, borderRadius:4 }}>
                      <div style={{ height:"100%", width:`${(checkedCount/total)*100}%`, background: S.greenMid, borderRadius:4, transition:"width 0.3s" }}/>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:11, color:"#8a7a5a" }}>
                      <span>{checkedCount} en el carrito</span>
                      <button onClick={() => setChecked({})} style={{ background:"none", border:"none", fontSize:11, color:"#8a7a5a", fontFamily:"'Inter',sans-serif", textDecoration:"underline", cursor:"pointer" }}>Limpiar</button>
                    </div>
                  </div>
                )}

                {Object.entries(CATEGORIES).map(([cat]) => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;
                  const catChecked = items.filter(i => checked[i.name]).length;
                  const collapsed  = collapsedCats.has(cat);
                  const toggleCat  = () => setCollapsedCats(prev => {
                    const next = new Set(prev);
                    collapsed ? next.delete(cat) : next.add(cat);
                    return next;
                  });
                  return (
                    <div key={cat} style={{ marginBottom:12, background:"#fff", border:`1.5px solid #e8e2d8`, borderRadius:12, overflow:"hidden" }}>
                      <div onClick={toggleCat} style={{ display:"flex", alignItems:"center", gap:7, padding:"12px 14px", cursor:"pointer" }}>
                        {(() => { const catIc = CAT_ICON_COMP[cat]; return catIc ? <HugeiconsIcon icon={catIc} size={16} color={S.brownMid} /> : null; })()}
                        <span style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color: S.brownMid, fontWeight:600 }}>{cat}</span>
                        <span style={{ marginLeft:"auto", fontSize:10, color:"#a09080", marginRight:6 }}>{catChecked > 0 ? `${catChecked}/${items.length}` : items.length}</span>
                        <span style={{ fontSize:12, color:"#a09080", transform: collapsed ? "none" : "rotate(180deg)", transition:"transform 0.2s" }}>▾</span>
                      </div>
                      {!collapsed && (
                        <div style={{ borderTop:`1px solid #f0ebe3`, padding:"8px 10px", display:"flex", flexDirection:"column", gap:5 }}>
                          {items.map(({ name, amount, unit }) => {
                            const done = checked[name];
                            return (
                              <div key={name} onClick={() => toggleCheck(name)} style={{
                                display:"flex", alignItems:"center", gap:11,
                                padding:"11px 13px", borderRadius:9,
                                background: done ? "#f0ebe3" : S.cream,
                                border:`1px solid ${done ? "#d8cfc0" : "#e8e2d8"}`,
                                cursor:"pointer", transition:"background 0.15s",
                              }}>
                                <div style={{
                                  width:20, height:20, borderRadius:5, flexShrink:0,
                                  border:`1.5px solid ${done ? S.greenMid : "#c0b8a8"}`,
                                  background: done ? S.greenMid : "transparent",
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontSize:11, color:"#fff",
                                }}>
                                  {done ? "✓" : ""}
                                </div>
                                <span style={{ flex:1, fontSize:13, color: done ? "#a09080" : S.brownDark, textDecoration: done ? "line-through" : "none", fontStyle: done ? "italic" : "normal" }}>{name}</span>
                                <span style={{ fontSize:13, fontWeight:600, color: done ? "#b0a090" : S.greenMid }}>
                                  {fmt(amount, unit)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            <div style={{ marginTop:18, display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={() => setPrintModal(true)} style={{
                width:"100%", padding:"14px",
                background:`linear-gradient(135deg,${S.greenMid},#2c5020)`,
                color:"#fff", border:"none", borderRadius:10,
                fontSize:15, fontFamily:"'Inter',sans-serif", fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                <HugeiconsIcon icon={FileDownloadIcon} size={18} color="#fff" />
                Exportar recetas (semana completa)
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────── RECETAS (untouched legacy) ────────────────────── */}
        {tab === "recetas" && (
          <div className="fade-in">
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              {[
                { cat: "almuerzo_cena",     label: "Almuerzo / Cena"     },
                { cat: "desayuno_merienda", label: "Desayuno / Merienda" },
              ].map(({ cat, label }) => (
                <button key={cat} onClick={() => { setRecipeCat(cat); setExpandedRecipe(null); setRecipeSearch(""); }} style={{
                  flex:1, padding:"9px 8px", borderRadius:8, border:"none",
                  background: recipeCat === cat ? S.greenMid : "#ede8df",
                  color: recipeCat === cat ? "#fff" : "#8a7a5a",
                  fontSize:12, fontFamily:"'Inter',sans-serif",
                  fontWeight: recipeCat === cat ? 600 : 400,
                  cursor:"pointer",
                }}>{label}</button>
              ))}
            </div>

            <div style={{ position:"relative", marginBottom:16 }}>
              <HugeiconsIcon icon={Search01Icon} size={16} color="#a09080" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
              <input
                value={recipeSearch}
                onChange={e => setRecipeSearch(e.target.value)}
                placeholder="Buscar receta..."
                style={{
                  width:"100%", padding:"10px 12px 10px 36px", borderRadius:10,
                  border:`1.5px solid ${S.tan}`, fontSize:16,
                  fontFamily:"'Inter',sans-serif", background:"#fff",
                  color: S.brownDark, outline:"none", boxSizing:"border-box",
                }}
              />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {Object.entries(RECIPES)
                .filter(([, r]) => r.category === recipeCat)
                .filter(([, r]) => !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase()))
                .map(([key, recipe]) => {
                const open = expandedRecipe === key;
                const recIc = recipe.category === "almuerzo_cena" ? Dish02Icon : Coffee04Icon;
                return (
                  <div key={key} style={{ background:"#fff", border:`1.5px solid #e8e2d8`, borderRadius:12, overflow:"hidden" }}>
                    <div onClick={() => setExpandedRecipe(open ? null : key)}
                      style={{ padding:"13px 15px", display:"flex", alignItems:"center", gap:11, cursor:"pointer" }}>
                      <HugeiconsIcon icon={recIc} size={22} color={S.greenMid} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color: S.brownDark, lineHeight:1.3 }}>{recipe.name}</div>
                      </div>
                      <span style={{ fontSize:13, color:"#a09080", display:"block", transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</span>
                    </div>
                    {open && (
                      <div style={{ borderTop:`1px solid ${S.brownLight}`, padding:"12px 15px", background:"#fcfaf7" }}>
                        {recipe.note && <div style={{ fontSize:11, color:"#8a7a5a", fontStyle:"italic", marginBottom:8 }}>* {recipe.note}</div>}
                        {recipe.ingredients.map(ing => (
                          <div key={ing.name} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:12, borderBottom:`1px solid ${S.brownLight}`, color: S.brownDark }}>
                            <span>{ing.name}</span>
                            <span style={{ fontWeight:600, color: S.greenMid }}>{fmt(ing.amount, ing.unit)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ────────────────────── SEGUIMIENTO ────────────────────── */}
        {tab === "seguimiento" && (
          <div className="fade-in">
            <Seguimiento />
          </div>
        )}

        {/* ────────────────────── CUENTA ────────────────────── */}
        {tab === "cuenta" && (
          <div className="fade-in" style={{ textAlign:"center", padding:"60px 0", color: T.textSecondary }}>
            <HugeiconsIcon icon={UserIcon} size={48} color={HEX.textSecondary} style={{ margin:"0 auto 16px", display:"block" }} strokeWidth={1.5} />
            <div style={{ fontSize:19, fontWeight:500, color: T.textDefault, lineHeight: "24px" }}>Próximamente</div>
            <div style={{ fontSize:13, marginTop:6, lineHeight: "16px" }}>La sección de cuenta estará disponible pronto.</div>
          </div>
        )}

      </div>

      {/* ────────────────────── HOME CHECK-IN MODAL ────────────────────── */}
      {homeCheckin && (
        <CheckinSheet
          checkin={homeCheckin}
          altForm={homeAltForm}
          setAltForm={setHomeAltForm}
          onClose={() => setHomeCheckin(null)}
          onSave={saveHomeLog}
          saving={homeSaving}
        />
      )}

      {/* ────────────────────── RECIPE MODAL ────────────────────── */}
      {recipeModal && (
        <RecipeSheet
          meal={recipeModal.meal}
          recipe={recipeModal.recipe}
          onClose={() => setRecipeModal(null)}
        />
      )}

      {/* ────────────────────── PRINT MODAL (legacy) ────────────────────── */}
      {printModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", flexDirection:"column" }}>
          <div style={{ background:`linear-gradient(135deg,#2c4a1e,#1a2e12)`, padding:"20px 20px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:"2px", color:"#8ab87a", textTransform:"uppercase", marginBottom:3 }}>Recetas</div>
              <div style={{ fontSize:16, fontWeight:900, color:"#f5f0e8", fontFamily:"'Inter',sans-serif" }}>
                {DAYS.map(d => d.day).join(", ")}
              </div>
            </div>
            <button onClick={() => setPrintModal(false)} style={{ background:"rgba(255,255,255,0.15)", border:"none", width:34, height:34, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="#fff" />
            </button>
          </div>

          <div style={{ flex:1, overflowY:"auto", background: S.cream, padding:"20px 20px 120px" }}>
            {modalEntries.map(({ day, meal, recipe }, idx, arr) => {
              const isNewDay = idx === 0 || arr[idx-1].day !== day;
              return (
                <div key={`${day}-${meal}`}>
                  {isNewDay && (
                    <div style={{ borderTop: idx === 0 ? "none" : `2px solid ${S.greenLight}`, paddingTop: idx === 0 ? 0 : 16, marginTop: idx === 0 ? 0 : 16, marginBottom:12 }}>
                      <span style={{ fontSize:16, fontWeight:900, color: S.greenDark, fontFamily:"'Inter',sans-serif" }}>{day.toUpperCase()}</span>
                    </div>
                  )}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#8a7a5a", marginBottom:4 }}>
                      {meal === "almuerzo" ? "Almuerzo" : "Cena"}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color: S.brownDark, marginBottom:8 }}>{recipe.name}</div>
                    {recipe.note && <div style={{ fontSize:10, fontStyle:"italic", color:"#8a7a5a", marginBottom:6 }}>* {recipe.note}</div>}
                    {recipe.ingredients.map((ing,i) => (
                      <div key={ing.name} style={{ display:"flex", justifyContent:"space-between", padding:"6px 10px", background: i % 2 === 0 ? S.brownLight : "#fff", fontSize:13, color: S.brownDark }}>
                        <span>• {ing.name}</span>
                        <span style={{ fontWeight:700, color: S.greenMid }}>{fmt(ing.amount, ing.unit)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:`1px solid ${S.tan}`, padding:"14px 20px 28px" }}>
            <button onClick={handleExport} disabled={exporting} style={{
              width:"100%", padding:"13px",
              background: exporting ? "#6a9a58" : `linear-gradient(135deg,${S.greenMid},#2c5020)`,
              color:"#fff", border:"none", borderRadius:10,
              fontSize:14, fontFamily:"'Inter',sans-serif", fontWeight:700, cursor: exporting ? "not-allowed" : "pointer",
            }}>
              {exporting ? "Generando PDF..." : (
              <><HugeiconsIcon icon={Download01Icon} size={16} color="#fff" style={{ display:"inline", verticalAlign:"middle", marginRight:6 }} />Descargar PDF</>
            )}
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────── BOTTOM NAVBAR (Figma) ────────────────────── */}
      <BottomNav tab={tab} setTab={setTab} />

    </div>
  );
}


/* ───────────────────────── Subcomponents ───────────────────────── */

/** A large 260×320 today-meal card matching the Figma carousel slot. */
function TodayCard({ meal, recipe, onOpen }) {
  const Icon = MEAL_ICON[meal];
  return (
    <button
      onClick={onOpen}
      style={{
        flexShrink: 0,
        width: 260, height: 320,
        borderRadius: T.radiusMd,
        background: T.bgSurface,
        border: "none",
        padding: 20,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        scrollSnapAlign: "start",
        textAlign: "left",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: T.radiusMd,
        background: T.bgFill,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <HugeiconsIcon icon={Icon} size={24} color={HEX.textPrimary} strokeWidth={1.75} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{
          fontSize: 13, fontWeight: 400, lineHeight: "16px",
          color: T.textSecondary, textTransform: "capitalize",
        }}>
          {MEAL_LABEL[meal]}
        </span>
        <span style={{
          fontSize: 19, fontWeight: 500, lineHeight: "24px",
          color: T.textDefault,
        }}>
          {recipe.name}
        </span>
        {recipe.note && (
          <span style={{
            fontSize: 13, fontWeight: 400, lineHeight: "16px",
            color: T.textSecondary, marginTop: 8, fontStyle: "italic",
          }}>
            {recipe.note}
          </span>
        )}
      </div>
    </button>
  );
}

/** Empty-day card for weekends (no plan available). */
function EmptyDayCard() {
  return (
    <div style={{
      width: "100%", height: 200,
      borderRadius: T.radiusMd,
      background: T.bgSurface,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8,
      padding: 20,
    }}>
      <HugeiconsIcon icon={Coffee04Icon} size={28} color={HEX.textSecondary} strokeWidth={1.75} />
      <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: T.textDefault }}>
        Día libre
      </span>
      <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary, textAlign: "center" }}>
        No hay plan para hoy. Disfrutá tu fin de semana.
      </span>
    </div>
  );
}

/** Single row in the Registro list — icon, label, action pill. */
function RegistroListItem({ meal, log, onRegister }) {
  const Icon = MEAL_ICON[meal];
  const isLogged = !!log;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "20px 12px", height: 80, width: "100%",
      borderRadius: T.radiusMd,
      background: T.bgSurface,
    }}>
      <div style={{
        width: 24, height: 24, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <HugeiconsIcon icon={Icon} size={20} color={HEX.textDefault} strokeWidth={1.75} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{
          fontSize: 16, fontWeight: 500, lineHeight: "24px",
          color: T.textDefault,
        }}>
          {MEAL_LABEL[meal]}
        </span>
        {isLogged && (
          <span style={{
            fontSize: 13, fontWeight: 400, lineHeight: "16px",
            color: T.textSecondary,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {log.status === "alternative" ? (log.recipe_name || "Otra comida") : CHECKIN_STATUS[log.status]?.label}
          </span>
        )}
      </div>

      <PillButton onClick={onRegister}>
        {isLogged ? (
          <>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color={HEX.textDefault} strokeWidth={1.75} />
            Registrado
          </>
        ) : "Registrar"}
      </PillButton>
    </div>
  );
}

/** Bottom navigation matching the Figma design. */
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "recetas",     label: "Recetas",  icon: BookOpen01Icon     },
    { id: "lista",       label: "Lista",    icon: ShoppingCart01Icon },
    { id: "planner",     label: "Home",     icon: Home01Icon         },
    { id: "seguimiento", label: "Registro", icon: Task01Icon         },
    { id: "cuenta",      label: "Cuenta",   icon: UserIcon           },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: T.bgDefault,
      borderTop: `1px solid ${T.borderDisabled}`,
      display: "flex", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px 20px",
      }}>
        {items.map(({ id, label, icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
                width: 60, height: 60,
                border: "none", background: "none", cursor: "pointer",
                padding: 0,
              }}
            >
              <HugeiconsIcon
                icon={icon}
                size={20}
                color={active ? HEX.textPrimary : HEX.textSecondary}
                strokeWidth={active ? 2 : 1.75}
              />
              <span style={{
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                lineHeight: "16px",
                color: active ? HEX.textPrimary : HEX.textSecondary,
                textDecoration: active ? "underline" : "none",
                textUnderlineOffset: "2px",
                fontFamily: "'Inter', sans-serif",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


/* ───────────────────────── Bottom-sheet modals ───────────────────────── */

function SheetShell({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: T.bgDefault,
          borderRadius: "16px 16px 0 0",
          padding: "24px 20px 40px",
          maxHeight: "85vh", overflowY: "auto",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: T.bgFill,
          margin: "0 auto 20px",
        }} />
        {children}
      </div>
    </div>
  );
}

function RecipeSheet({ meal, recipe, onClose }) {
  const Icon = MEAL_ICON[meal] ?? Dish02Icon;
  return (
    <SheetShell onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: T.radiusMd,
          background: T.bgFill,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <HugeiconsIcon icon={Icon} size={24} color={HEX.textPrimary} strokeWidth={1.75} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary }}>
            {MEAL_LABEL[meal]}
          </span>
          <span style={{ fontSize: 19, fontWeight: 500, lineHeight: "24px", color: T.textDefault }}>
            {recipe.name}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            width: 36, height: 36, borderRadius: T.radiusMax,
            background: T.bgFill, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} color={HEX.textDefault} strokeWidth={1.75} />
        </button>
      </div>

      {recipe.note && (
        <p style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary, marginBottom: 16, fontStyle: "italic" }}>
          {recipe.note}
        </p>
      )}

      <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "16px", color: T.textSecondary, display: "block", marginBottom: 12 }}>
        Ingredientes
      </span>
      <div style={{ display: "flex", flexDirection: "column", borderRadius: T.radiusMd, overflow: "hidden", background: T.bgSurface }}>
        {recipe.ingredients.map((ing, i) => (
          <div
            key={ing.name}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px",
              borderTop: i === 0 ? "none" : `1px solid ${T.bgFill}`,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 400, lineHeight: "24px", color: T.textDefault }}>{ing.name}</span>
            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "16px", color: T.textPrimary }}>{fmt(ing.amount, ing.unit)}</span>
          </div>
        ))}
      </div>
    </SheetShell>
  );
}

function CheckinSheet({ checkin, altForm, setAltForm, onClose, onSave, saving }) {
  const { meal, recipe } = checkin;
  const Icon = MEAL_ICON[meal];
  const hasPlan = !!recipe;

  return (
    <SheetShell onClose={onClose}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: T.radiusMd,
          background: T.bgFill,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <HugeiconsIcon icon={Icon} size={24} color={HEX.textPrimary} strokeWidth={1.75} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary }}>
            {MEAL_LABEL[meal]}
          </span>
          <span style={{ fontSize: 19, fontWeight: 500, lineHeight: "24px", color: T.textDefault }}>
            {hasPlan ? recipe.name : "Registrar comida"}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            width: 36, height: 36, borderRadius: T.radiusMax,
            background: T.bgFill, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} color={HEX.textDefault} strokeWidth={1.75} />
        </button>
      </div>

      {hasPlan ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {Object.entries(CHECKIN_STATUS).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => key !== "alternative" && onSave(key)}
              disabled={saving}
              style={{
                width: "100%", padding: "14px 16px",
                background: T.bgSurface,
                border: "none",
                borderRadius: T.radiusMd,
                display: "flex", alignItems: "center", gap: 12,
                cursor: key === "alternative" ? "default" : "pointer",
                opacity: saving ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
                textAlign: "left",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: T.textDefault }}>{label}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "16px", color: T.textSecondary, display: "block", marginBottom: 12 }}>
            Opciones
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {Object.entries(RECIPES)
              .filter(([, rec]) => rec.category === MEAL_CATEGORY[meal])
              .map(([key, rec]) => (
                <button
                  key={key}
                  onClick={() => onSave("plan", rec.name)}
                  disabled={saving}
                  style={{
                    width: "100%", padding: "14px 16px",
                    background: T.bgSurface,
                    border: "none",
                    borderRadius: T.radiusMd,
                    display: "flex", alignItems: "center", gap: 12,
                    cursor: "pointer", opacity: saving ? 0.6 : 1,
                    fontFamily: "'Inter', sans-serif",
                    textAlign: "left",
                  }}
                >
                  <HugeiconsIcon icon={MEAL_ICON[meal]} size={20} color={HEX.textDefault} strokeWidth={1.75} />
                  <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: T.textDefault }}>{rec.name}</span>
                </button>
              ))}
            <button
              onClick={() => onSave("skipped")}
              disabled={saving}
              style={{
                width: "100%", padding: "14px 16px",
                background: T.bgSurface, border: "none",
                borderRadius: T.radiusMd,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", opacity: saving ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: HEX.textSecondary, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: T.textSecondary }}>No comí</span>
            </button>
          </div>
        </>
      )}

      {/* Alternative form */}
      <div style={{
        background: T.bgSurface,
        borderRadius: T.radiusMd,
        padding: 16,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "16px", color: T.textSecondary, display: "block", marginBottom: 12 }}>
          Comida alternativa
        </span>
        {[
          { key: "recipeName",  label: "Nombre",                 placeholder: "Ej: Milanesa con ensalada" },
          { key: "ingredients", label: "Ingredientes (opcional)",placeholder: "Ej: Milanesa 200g, lechuga" },
          { key: "notes",       label: "Notas (opcional)",       placeholder: "Ej: Comí afuera" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary, display: "block", marginBottom: 4 }}>{label}</span>
            <input
              value={altForm[key]}
              onChange={e => setAltForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${HEX.borderDisabled}`,
                fontSize: 16, lineHeight: "24px",
                fontFamily: "'Inter', sans-serif",
                color: HEX.textDefault, background: HEX.bgDefault,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        <button
          onClick={() => onSave("alternative")}
          disabled={saving || !altForm.recipeName}
          style={{
            width: "100%", marginTop: 6,
            height: 44, borderRadius: T.radiusMax, border: "none",
            background: altForm.recipeName ? HEX.textPrimary : HEX.bgFill,
            color: altForm.recipeName ? "#fff" : HEX.textSecondary,
            fontSize: 16, fontWeight: 500, lineHeight: "24px",
            fontFamily: "'Inter', sans-serif",
            cursor: altForm.recipeName ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Guardando..." : "Guardar comida alternativa"}
        </button>
      </div>
    </SheetShell>
  );
}
