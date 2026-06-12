"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { RECIPES, DAYS, CATEGORIES, fmt, getCat } from "@/lib/data";
import Seguimiento from "@/components/Seguimiento";
import { SheetShell, CheckinSheet } from "@/components/CheckinSheet";
import { fetchWeekLogs, saveMealLog } from "@/lib/mealLogs";
import {
  Home, BookOpen, ShoppingCart,
  ClipboardList, User,
  Coffee, UtensilsCrossed,
  Search, X,
  Clock, Crown,
  Leaf, Milk, Utensils, Wheat, Nut, Droplets,
  FileDown, Download,
  CheckCircle2,
  Bell,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
} from "lucide-react";

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
  return Array.from({ length: 7 }, (_, i) => {
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
  desayuno: Coffee,
  almuerzo: UtensilsCrossed,
  merienda: Coffee,
  cena:     UtensilsCrossed,
};

const MEAL_LABEL = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena:     "Cena",
};

const CAT_ICON_COMP = {
  "Proteínas":             Utensils,
  "Lácteos y quesos":      Milk,
  "Verduras y hojas":      Leaf,
  "Cereales":              Wheat,
  "Aceites y condimentos": Droplets,
  "Frutos secos":          Nut,
  "Otros":                 ShoppingCart,
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
  // Planner data is indexed Mon=0..Dom=6
  const plannerDay = todayDow === 0 ? 6 : todayDow - 1;

  const [carouselDay, setCarouselDay] = useState(plannerDay);
  const carouselDateStr = currentWeekDates()[carouselDay];

  const [tab,        setTab]        = useState("planner");
  const [recipeModal,setRecipeModal]= useState(null); // { meal, recipe }
  const [homeCheckin,setHomeCheckin]= useState(null); // { meal, recipe }
  const [homeAltForm,setHomeAltForm]= useState({ recipeName: "", ingredients: "", notes: "" });
  const [weekLogs,   setWeekLogs]   = useState({});

  const [checked,        setChecked]        = useState({});
  const [collapsedCats,  setCollapsedCats]  = useState(new Set());
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [recipeCat,      setRecipeCat]      = useState("almuerzo_cena");
  const [recipeSearch,   setRecipeSearch]   = useState("");
  const [printModal,     setPrintModal]     = useState(false);
  const [exporting,      setExporting]      = useState(false);
  const [navVisible,     setNavVisible]     = useState(true);
  const lastScrollY = useRef(0);

  /* Hide navbar on scroll-down, reveal on scroll-up */
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setNavVisible(current <= 10 || current < lastScrollY.current);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock body scroll while any sheet is open */
  useEffect(() => {
    document.body.style.overflow = (homeCheckin || recipeModal) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [homeCheckin, recipeModal]);

  /* Refetch on every return to the home tab — registrations made from the
     Seguimiento tab live in its own state, so the home copy goes stale. */
  useEffect(() => {
    if (tab !== "planner") return;
    fetchWeekLogs(currentWeekDates())
      .then(setWeekLogs)
      .catch(e => console.error("No se pudieron cargar los registros:", e));
  }, [tab]);

  const toggleCheck = (n) => setChecked(p => ({ ...p, [n]: !p[n] }));

  /* Optimistic upsert: the UI updates instantly and rolls back if the save fails. */
  const persistLog = async (meal, payload) => {
    const prevLogs = weekLogs;
    setWeekLogs(prev => ({
      ...prev,
      [payload.date]: { ...(prev[payload.date] || {}), [meal]: payload },
    }));
    try {
      const saved = await saveMealLog(payload);
      setWeekLogs(prev => ({
        ...prev,
        [payload.date]: { ...(prev[payload.date] || {}), [meal]: saved },
      }));
    } catch (e) {
      console.error(e);
      setWeekLogs(prevLogs);
      alert("No se pudo guardar el registro. Revisá tu conexión e intentá de nuevo.");
    }
  };

  const saveHomeLog = (status, overrideRecipeName = null) => {
    if (!homeCheckin) return;
    const { meal, recipe } = homeCheckin;
    const payload = {
      date:        carouselDateStr,
      meal,
      status,
      recipe_name: overrideRecipeName ?? (status === "plan" ? recipe?.name ?? null : (homeAltForm.recipeName || null)),
      ingredients: status === "alternative" ? homeAltForm.ingredients : null,
      notes:       homeAltForm.notes || null,
    };
    setHomeCheckin(null);
    setHomeAltForm({ recipeName: "", ingredients: "", notes: "" });
    persistLog(meal, payload);
  };

  const autoRegisterMeal = (meal, recipe) => {
    const payload = {
      date: carouselDateStr, meal, status: "plan",
      recipe_name: recipe?.name ?? null,
      ingredients: null, notes: null,
    };
    setRecipeModal(null);
    persistLog(meal, payload);
  };

  const shoppingList = useMemo(() => {
    const totals = {};
    DAYS.forEach(d => {
      ["desayuno","almuerzo","merienda","cena"].forEach(meal => {
        RECIPES[d[meal]]?.ingredients.forEach(({ name, amount, unit }) => {
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
  const allDayIndices = DAYS.map((_, i) => i);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDays: allDayIndices, meals: { desayuno: true, almuerzo: true, merienda: true, cena: true } }),
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
      ["desayuno","almuerzo","merienda","cena"]
        .filter(meal => RECIPES[d[meal]])
        .map(meal => ({ day: d.day, meal, recipe: RECIPES[d[meal]] }))
    );
  }, []);

  /* ──────────────── Carousel day's planned meals ──────────────── */
  const todayPlannedMeals = useMemo(() => {
    const d = DAYS[carouselDay];
    return ["desayuno","almuerzo","merienda","cena"]
      .filter(meal => RECIPES[d[meal]])
      .map(meal => ({ key: meal, recipe: RECIPES[d[meal]] }));
  }, [carouselDay]);

  /* ──────────────── Registro list — 4 meals for the carousel day ──────────────── */
  const registroMeals = ["desayuno", "almuerzo", "merienda", "cena"].map(meal => {
    const log     = weekLogs[carouselDateStr]?.[meal];
    const planned = DAYS[carouselDay][meal] ? RECIPES[DAYS[carouselDay][meal]] : null;
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
                <Bell size={20} color={HEX.textDefault} strokeWidth={1.75} />
              </button>
            </header>

            {/* ── Day navigation (chevrons + selected day) ───────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 8px" }}>
              <button
                onClick={() => setCarouselDay(d => Math.max(0, d - 1))}
                disabled={carouselDay === 0}
                style={{ background: "none", border: "none", padding: 4, cursor: carouselDay === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: carouselDay === 0 ? 0.25 : 1 }}
              >
                <ChevronLeft size={20} color={HEX.textDefault} strokeWidth={1.75} />
              </button>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 19, fontWeight: 500, lineHeight: "24px", color: T.textDefault }}>
                  {carouselDay === plannerDay ? "Hoy" : DAYS[carouselDay].day}
                </span>
                <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary }}>
                  {formatTodayHeading(new Date(currentWeekDates()[carouselDay] + "T12:00:00"))}
                </span>
              </div>
              <button
                onClick={() => setCarouselDay(d => Math.min(DAYS.length - 1, d + 1))}
                disabled={carouselDay === DAYS.length - 1}
                style={{ background: "none", border: "none", padding: 4, cursor: carouselDay === DAYS.length - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: carouselDay === DAYS.length - 1 ? 0.25 : 1 }}
              >
                <ChevronRight size={20} color={HEX.textDefault} strokeWidth={1.75} />
              </button>
            </div>

            {/* ── Weekly plan progress ───────────────────────────── */}
            <WeekProgress weekLogs={weekLogs} />

            {/* ── Today section ───────────────────────────────────── */}
            <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Carousel of the selected day's planned meals */}
              <div
                className="no-scrollbar"
                style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", marginRight: "-20px" }}
              >
                {todayPlannedMeals.map(({ key, recipe }) => (
                  <TodayCard
                    key={key}
                    meal={key}
                    recipe={recipe}
                    onOpen={() => setRecipeModal({ meal: key, recipe })}
                  />
                ))}
                <div style={{ flexShrink: 0, width: 20 }} />
              </div>
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
                <Leaf size={40} color="#a09080" style={{ margin:"0 auto 12px", display:"block" }} />
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
                      {DAYS.length} días · {DAYS.map(d => d.short).join(", ")}
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

                {[...Object.keys(CATEGORIES), "Otros"].map((cat) => {
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
                        {(() => { const CatIc = CAT_ICON_COMP[cat]; return CatIc ? <CatIc size={16} color={S.brownMid} /> : null; })()}
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
                <FileDown size={18} color="#fff" />
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
              <Search size={16} color="#a09080" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
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
                const RecIc = recipe.category === "almuerzo_cena" ? UtensilsCrossed : Coffee;
                return (
                  <div key={key} style={{ background:"#fff", border:`1.5px solid #e8e2d8`, borderRadius:12, overflow:"hidden" }}>
                    <div onClick={() => setExpandedRecipe(open ? null : key)}
                      style={{ padding:"13px 15px", display:"flex", alignItems:"center", gap:11, cursor:"pointer" }}>
                      <RecIc size={22} color={S.greenMid} />
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
            <User size={48} color={HEX.textSecondary} style={{ margin:"0 auto 16px", display:"block" }} strokeWidth={1.5} />
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
        />
      )}

      {/* ────────────────────── RECIPE MODAL ────────────────────── */}
      {recipeModal && (
        <RecipeSheet
          meal={recipeModal.meal}
          recipe={recipeModal.recipe}
          onClose={() => setRecipeModal(null)}
          onRegister={() => autoRegisterMeal(recipeModal.meal, recipeModal.recipe)}
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
              <X size={18} color="#fff" />
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
                      {MEAL_LABEL[meal]}
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
              <><Download size={16} color="#fff" style={{ display:"inline", verticalAlign:"middle", marginRight:6 }} />Descargar PDF</>
            )}
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────── BOTTOM NAVBAR (Figma) ────────────────────── */}
      <BottomNav tab={tab} setTab={setTab} visible={navVisible} />

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
        <Icon size={24} color={HEX.textPrimary} strokeWidth={1.75} />
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
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
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



/* Almuerzos + cenas are the meals tracked against the weekly plan;
   the user allows himself FREE_MEALS_PER_WEEK "free" meals per week. */
const PROGRESS_MEALS = ["almuerzo", "cena"];
const FREE_MEALS_PER_WEEK = 2;

/** Circular progress ring with the percentage centred inside. */
function ProgressRing({ pct, size = 64, stroke = 6 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={HEX.bgFill} strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={HEX.textDefault} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span style={{
        position: "absolute",
        fontSize: 14, fontWeight: 700, lineHeight: "16px",
        color: HEX.textDefault, fontFamily: "'Inter', sans-serif",
      }}>
        {pct}%
      </span>
    </div>
  );
}

/** Weekly plan progress — almuerzos & cenas logged vs the plan. */
function WeekProgress({ weekLogs }) {
  let onPlan = 0, free = 0, logged = 0;
  Object.values(weekLogs).forEach(dayLogs => {
    PROGRESS_MEALS.forEach(meal => {
      const log = dayLogs?.[meal];
      if (!log) return;
      logged++;
      if (log.status === "plan") onPlan++;
      else if (log.status === "free") free++;
    });
  });

  const totalSlots = PROGRESS_MEALS.length * 7; // 14 almuerzos + cenas per week
  const remaining  = totalSlots - logged;
  // Free meals within the weekly allowance count as following the plan;
  // only from the 3rd one onwards do they drag the percentage down.
  const compliant  = onPlan + Math.min(free, FREE_MEALS_PER_WEEK);
  const pct        = logged > 0 ? Math.round((compliant / logged) * 100) : 0;

  return (
    <section style={{
      background: T.bgSurface, borderRadius: 16, padding: 20,
      display: "flex", flexDirection: "column", gap: 16,
    }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        {/* Left column — tag, headline, meta */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, minWidth: 0 }}>


          <span style={{ fontSize: 19, fontWeight: 500, lineHeight: "28px", color: T.textDefault }}>
            {logged > 0 ? `${compliant} de ${logged} comidas` : "Sin registros"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} color={HEX.textSecondary} strokeWidth={1.75} />
              <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary }}>
                {remaining > 0 ? `${remaining} restantes` : "Semana completa"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Crown size={14} color={HEX.textSecondary} strokeWidth={1.75} />
              <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary }}>
                {free} de {FREE_MEALS_PER_WEEK} libres
              </span>
            </div>
          </div>
        </div>

        {/* Right — progress ring */}
        <div  className="h-full items-center">
          <ProgressRing pct={pct} size={80} stroke={7} />
        </div>
      </div>
    </section>
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
        <Icon size={20} color={HEX.textDefault} strokeWidth={1.75} />
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
            {log.status === "skipped" ? "No comí"
              : log.status === "free" ? "Comida libre"
              : (log.recipe_name || "Registrado")}
          </span>
        )}
      </div>

      <PillButton
        onClick={onRegister}
        style={isLogged ? { background: HEX.textPrimary, color: "#fff" } : {}}
      >
        {isLogged ? (
          <>
            <CheckCircle2 size={14} color="#fff" strokeWidth={1.75} />
            Registrado
          </>
        ) : "Registrar"}
      </PillButton>
    </div>
  );
}

/** Bottom navigation matching the Figma design. */
function BottomNav({ tab, setTab, visible }) {
  const items = [
    { id: "recetas",     label: "Recetas",  icon: BookOpen       },
    { id: "lista",       label: "Lista",    icon: ShoppingCart   },
    { id: "planner",     label: "Home",     icon: Home           },
    { id: "seguimiento", label: "Registro", icon: ClipboardList  },
    { id: "cuenta",      label: "Cuenta",   icon: User           },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: T.bgDefault,
      borderTop: `1px solid ${T.borderDisabled}`,
      display: "flex", justifyContent: "center",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.3s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px 32px",
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
              {(() => { const NavIcon = icon; return <NavIcon size={20} color={active ? HEX.textPrimary : HEX.textSecondary} strokeWidth={active ? 2 : 1.75} />; })()}
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
/* SheetShell and CheckinSheet now live in components/CheckinSheet.jsx so the
   Home and Registro tabs share one design. RecipeSheet stays here. */

function RecipeSheet({ meal, recipe, onClose, onRegister, saving }) {
  const [ingredientsOpen, setIngredientsOpen] = useState(true);
  const [procedureOpen,   setProcedureOpen]   = useState(false);
  const Icon = MEAL_ICON[meal] ?? UtensilsCrossed;

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
      <div style={{
        width: 48, height: 48, borderRadius: T.radiusMd,
        background: T.bgFill,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={24} color={HEX.textPrimary} strokeWidth={1.75} />
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
        <X size={16} color={HEX.textDefault} strokeWidth={1.75} />
      </button>
    </div>
  );

  return (
    <SheetShell onClose={onClose} header={header}>
      {/* Ingredients accordion — open by default */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setIngredientsOpen(o => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 0", marginBottom: 8,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "16px", color: T.textSecondary }}>
            Ingredientes
          </span>
          {ingredientsOpen
            ? <ChevronUp size={16} color={HEX.textSecondary} strokeWidth={1.75} />
            : <ChevronDown size={16} color={HEX.textSecondary} strokeWidth={1.75} />}
        </button>
        {ingredientsOpen && (
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
        )}
      </div>

      {/* Procedure accordion — closed by default */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setProcedureOpen(o => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 0", marginBottom: procedureOpen ? 8 : 0,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "16px", color: T.textSecondary }}>
            Procedimiento
          </span>
          {procedureOpen
            ? <ChevronUp size={16} color={HEX.textSecondary} strokeWidth={1.75} />
            : <ChevronDown size={16} color={HEX.textSecondary} strokeWidth={1.75} />}
        </button>
        {procedureOpen && (
          <div style={{ background: T.bgSurface, borderRadius: T.radiusMd, padding: "14px 16px" }}>
            <p style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: T.textDefault, margin: 0, fontStyle: recipe.note ? "normal" : "italic" }}>
              {recipe.note || "No hay procedimiento disponible para esta receta."}
            </p>
          </div>
        )}
      </div>

      {/* Auto-register button */}
      {onRegister && (
        <button
          onClick={onRegister}
          disabled={saving}
          style={{
            width: "100%", height: 48,
            borderRadius: T.radiusMax, border: "none",
            background: HEX.textPrimary,
            color: "#fff",
            fontSize: 16, fontWeight: 500, lineHeight: "24px",
            fontFamily: "'Inter', sans-serif",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <CheckCircle2 size={18} color="#fff" strokeWidth={1.75} />
          {saving ? "Registrando..." : "Registrar esta comida"}
        </button>
      )}
    </SheetShell>
  );
}
