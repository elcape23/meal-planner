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
  Moon01Icon, Sun01Icon,
} from "@hugeicons/core-free-icons";

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayLocalStr() { return localDateStr(new Date()); }

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

const CAT_ICON_COMP = {
  "Proteínas":             ForkIcon,
  "Lácteos y quesos":      MilkCartonIcon,
  "Verduras y hojas":      Leaf01Icon,
  "Cereales":              WheatIcon,
  "Aceites y condimentos": OilBarrelIcon,
  "Frutos secos":          NutIcon,
};

const CHECKIN_STATUS = {
  plan:        { label: "Seguí el plan",  color: "#3a6b28" },
  alternative: { label: "Comí otra cosa", color: "#f5a623" },
  skipped:     { label: "No comí",        color: "#a09080" },
};

const S = {
  // Colors
  greenDark:  "#2c4a1e",
  greenMid:   "#3a6b28",
  greenLight: "#eaf3e6",
  cream:      "#faf7f2",
  tan:        "#e8e0d0",
  brownDark:  "#2c2416",
  brownMid:   "#6a5a3a",
  brownLight: "#f5f0e8",
};

function todayPlannerIdx() {
  const day = new Date().getDay(); // 0=Sun
  if (day === 0 || day === 6) return 0;
  return day - 1; // Mon=0 … Fri=4
}

export default function MealPlanner() {
  const plannerDay = todayPlannerIdx();
  const [checked,        setChecked]        = useState({});
  const [collapsedCats,  setCollapsedCats]  = useState(new Set());
  const [tab,            setTab]            = useState("planner");
  const [recipeModal,    setRecipeModal]    = useState(null); // { meal, recipe }
  const [homeCheckin,    setHomeCheckin]    = useState(null); // { meal, recipe }
  const [homeAltForm,    setHomeAltForm]    = useState({ recipeName: "", ingredients: "", notes: "" });
  const [homeSaving,     setHomeSaving]     = useState(false);
  const [weekLogs,       setWeekLogs]       = useState({});

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

  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [recipeCat,      setRecipeCat]      = useState("almuerzo_cena");
  const [recipeSearch,   setRecipeSearch]   = useState("");
  const [printModal,     setPrintModal]     = useState(false);
  const [exporting,      setExporting]      = useState(false);
  const toggleCheck = (n) => setChecked(p => ({ ...p, [n]: !p[n] }));

  const saveHomeLog = async (status, overrideRecipeName = null) => {
    if (!homeCheckin) return;
    setHomeSaving(true);
    const { meal, recipe } = homeCheckin;
    const payload = {
      date:        todayLocalStr(),
      meal,
      status,
      recipe_name: overrideRecipeName ?? (status === "plan" ? recipe?.name ?? null : (homeAltForm.recipeName || null)),
      ingredients: status === "alternative" ? homeAltForm.ingredients : null,
      notes:       homeAltForm.notes || null,
    };
    const { data: existing } = await supabase
      .from("meal_logs").select("id").eq("date", todayLocalStr()).eq("meal", meal).maybeSingle();
    if (existing?.id) {
      await supabase.from("meal_logs").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("meal_logs").insert(payload);
    }
    setWeekLogs(prev => {
      const today = todayLocalStr();
      return { ...prev, [today]: { ...(prev[today] || {}), [meal]: { ...payload, id: existing?.id ?? Date.now() } } };
    });
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

  return (
    <div style={{ minHeight:"100vh", background: S.cream, fontFamily:"'Inter',sans-serif", color: S.brownDark }}>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"20px 20px 90px" }}>

        {/* ── PLANNER ── */}
        {tab === "planner" && (
          <div className="fade-in">

            {/* Greeting */}
            <div style={{ marginBottom:24, display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <div style={{ fontSize:32, fontWeight:900, color: S.greenDark, lineHeight:1.1 }}>
                Hola<br/>Juan José
              </div>
              <button onClick={() => setTab("cuenta")} style={{
                width:44, height:44, borderRadius:"50%",
                background: S.greenMid, color:"#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:700, flexShrink:0, marginTop:4,
                border:"none", cursor:"pointer",
              }}>
                JJ
              </button>
            </div>

            {/* Week strip */}
            {(() => {
              const today = new Date();
              const dow = today.getDay(); // 0=Sun
              const sunday = new Date(today);
              sunday.setDate(today.getDate() - dow);
              sunday.setHours(0, 0, 0, 0);
              const DAY_LETTERS = ["S","M","T","W","T","F","S"];
              const isWeekend = (i) => i === 0 || i === 6;
              return (
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:24 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(sunday);
                    d.setDate(sunday.getDate() + i);
                    const isToday = d.toDateString() === today.toDateString();
                    const dateNum = d.getDate().toString().padStart(2, "0");
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                        <div style={{
                          width:30, height:30, borderRadius:"50%",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          border: isToday ? "1.5px dashed #e57373" : "none",
                          background: isToday ? "rgba(229,115,115,0.07)" : "transparent",
                        }}>
                          <span style={{
                            fontSize:12, fontWeight: isToday ? 700 : 500,
                            color: isToday ? "#e57373" : isWeekend(i) ? "#c0b8a8" : S.brownMid,
                          }}>
                            {DAY_LETTERS[i]}
                          </span>
                        </div>
                        <span style={{
                          fontSize:11, fontWeight: isToday ? 700 : 400,
                          color: isToday ? "#e57373" : isWeekend(i) ? "#c0b8a8" : S.brownMid,
                        }}>
                          {dateNum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Weekly progress card */}
            {(() => {
              const allLogs   = Object.values(weekLogs).flatMap(day => Object.values(day)).filter(l => l.meal === "almuerzo" || l.meal === "cena");
              const onPlan    = allLogs.filter(l => l.status === "plan").length;
              const altMeals  = allLogs.filter(l => l.status === "alternative").length;
              const total     = allLogs.length;
              const pct       = total > 0 ? Math.round((onPlan / total) * 100) : 0;
              const r = 28, circ = 2 * Math.PI * r;
              const offset    = circ * (1 - pct / 100);
              const chartColor = pct >= 70 ? S.greenMid : pct >= 50 ? "#f5c542" : pct >= 20 ? "#f5a623" : "#e53935";

              return (
                <div style={{ background: S.greenLight, borderRadius:16, padding:"16px 18px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color: S.greenMid, marginBottom:6 }}>Resumen semanal</div>
                    <div style={{ fontSize:20, fontWeight:800, color: S.greenDark, lineHeight:1.2, marginBottom:14 }}>Tu progreso<br/>esta semana</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background: S.greenMid, flexShrink:0 }}/>
                        <span style={{ fontSize:12, color: S.greenDark }}>
                          <strong>{onPlan}</strong> comidas en plan
                        </span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:"#f5a623", flexShrink:0 }}/>
                        <span style={{ fontSize:12, color: S.brownMid }}>
                          <strong>{altMeals}</strong> fuera del plan
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg width={72} height={72} style={{ flexShrink:0 }}>
                    <circle cx={36} cy={36} r={r} fill="none" stroke="#e8e0d0" strokeWidth={6}/>
                    <circle cx={36} cy={36} r={r} fill="none" stroke={chartColor} strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      transform="rotate(-90 36 36)"
                      style={{ transition:"stroke-dashoffset 0.6s ease" }}
                    />
                    <text x={36} y={32} textAnchor="middle" fontSize={14} fontWeight={800} fill={S.greenDark}>{pct}%</text>
                    <text x={36} y={45} textAnchor="middle" fontSize={8} fill={S.greenMid}>del plan</text>
                  </svg>
                </div>
              );
            })()}

            {(() => {
              const d = DAYS[plannerDay];
              return (
                <>
                  {/* Section 1 — Qué te toca hoy */}
                  <div style={{ fontSize:16, fontWeight:700, color: S.brownDark, marginBottom:12 }}>
                    ¿Qué te toca hoy?
                  </div>
                  <div style={{ display:"flex", gap:10, marginBottom:28 }}>
                    {["almuerzo","cena"].map(meal => {
                      const r = RECIPES[d[meal]];
                      const MealIc = MEAL_ICON[meal];
                      return (
                        <button key={meal} onClick={() => setRecipeModal({ meal, recipe: r })} style={{
                          flex:1, aspectRatio:"1", background:"#fff",
                          border:`1.5px solid #c8dfc0`, borderRadius:16,
                          display:"flex", flexDirection:"column",
                          alignItems:"center", justifyContent:"center",
                          gap:10, cursor:"pointer", padding:12,
                        }}>
                          <HugeiconsIcon icon={MealIc} size={36} color={S.greenMid} />
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color:"#8a7a5a", marginBottom:4 }}>{meal}</div>
                            <div style={{ fontSize:12, fontWeight:600, color: S.brownDark, lineHeight:1.3 }}>{r.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Section 2 — Qué comiste hoy */}
                  <div style={{ fontSize:16, fontWeight:700, color: S.brownDark, marginBottom:12 }}>
                    ¿Qué comiste hoy?
                  </div>
                  <div style={{
                    display:"flex", gap:10,
                    overflowX:"auto", paddingBottom:4,
                    scrollSnapType:"x mandatory",
                    msOverflowStyle:"none", scrollbarWidth:"none",
                  }}>
                    {(["desayuno","almuerzo","merienda","cena"]
                      .slice()
                      .sort((a, b) => {
                        const aLogged = !!weekLogs[todayLocalStr()]?.[a];
                        const bLogged = !!weekLogs[todayLocalStr()]?.[b];
                        return aLogged - bLogged;
                      })
                    ).map(meal => {
                      const r = d[meal] ? RECIPES[d[meal]] : null;
                      const MealIc = MEAL_ICON[meal];
                      const label = meal.charAt(0).toUpperCase() + meal.slice(1);
                      const isLogged = !!weekLogs[todayLocalStr()]?.[meal];
                      return (
                        <div key={meal} style={{
                          flexShrink:0, width:"calc(50% - 5px)", aspectRatio:"1",
                          scrollSnapAlign:"start",
                          background:"#fff",
                          border:`1.5px solid #e8e2d8`, borderRadius:16,
                          padding:14, display:"flex", flexDirection:"column",
                          justifyContent:"space-between",
                        }}>
                          <div>
                            <HugeiconsIcon icon={MealIc} size={28} color={isLogged ? "#a09080" : S.greenMid} />
                            <div style={{ fontSize:13, fontWeight:700, color: S.brownDark, margin:"8px 0 2px" }}>{label}</div>
                            {r && (
                              <div style={{ fontSize:10, color:"#8a7a5a", lineHeight:1.3 }}>{r.name}</div>
                            )}
                          </div>
                          <button
                            onClick={() => { setHomeAltForm({ recipeName:"", ingredients:"", notes:"" }); setHomeCheckin({ meal, recipe: r }); }}
                            style={{
                              width:"100%", padding:"9px 0", borderRadius:8, border:"none",
                              background: isLogged ? S.tan : S.greenMid,
                              color: isLogged ? "#6a5a3a" : "#fff",
                              fontSize:12, fontWeight:600, cursor:"pointer",
                              display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                            }}>
                            {isLogged ? (
                              <>
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color="#6a5a3a" />
                                Registrado
                              </>
                            ) : "Registrar"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

          </div>
        )}

        {/* ── LISTA ── */}
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

            {/* Bottom CTAs */}
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

        {/* ── RECETAS ── */}
        {tab === "recetas" && (
          <div className="fade-in">
            {/* Category chips */}
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

            {/* Search bar */}
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
        {/* ── SEGUIMIENTO ── */}
        {tab === "seguimiento" && (
          <div className="fade-in">
            <Seguimiento />
          </div>
        )}

        {tab === "cuenta" && (
          <div className="fade-in" style={{ textAlign:"center", padding:"60px 0", color:"#a09080" }}>
            <HugeiconsIcon icon={UserIcon} size={48} color="#c0b8a8" style={{ margin:"0 auto 16px", display:"block" }} />
            <div style={{ fontSize:16, fontWeight:600, color: S.brownMid }}>Próximamente</div>
            <div style={{ fontSize:13, marginTop:6 }}>La sección de cuenta estará disponible pronto.</div>
          </div>
        )}

      </div>

      {/* ── HOME CHECK-IN MODAL ── */}
      {homeCheckin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1100, display:"flex", alignItems:"flex-end" }}
          onClick={() => setHomeCheckin(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"100%", maxWidth:480, margin:"0 auto",
            background: S.cream, borderRadius:"16px 16px 0 0",
            padding:"24px 20px 40px", maxHeight:"85vh", overflowY:"auto",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", position:"relative", marginBottom:20 }}>
              <div style={{ width:36, height:4, borderRadius:2, background: S.tan }} />
              <button onClick={() => setHomeCheckin(null)} style={{
                position:"absolute", right:0, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer", padding:4,
                display:"flex", alignItems:"center",
              }}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color="#a09080" />
              </button>
            </div>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:12, background: S.greenLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <HugeiconsIcon icon={MEAL_ICON[homeCheckin.meal]} size={24} color={S.greenMid} />
              </div>
              <div>
                <div style={{ fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color:"#8a7a5a", marginBottom:3 }}>{homeCheckin.meal}</div>
                <div style={{ fontSize:15, fontWeight:700, color: S.brownDark }}>
                  {homeCheckin.recipe ? homeCheckin.recipe.name : `¿Qué comiste en el ${homeCheckin.meal}?`}
                </div>
              </div>
            </div>

            {homeCheckin.recipe ? (
              <>
                {/* Status buttons — plan has a recipe */}
                <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:20 }}>
                  {Object.entries(CHECKIN_STATUS).map(([key, { label, color }]) => (
                    <button key={key} onClick={() => key !== "alternative" && saveHomeLog(key)}
                      disabled={homeSaving}
                      style={{
                        width:"100%", padding:"13px 16px", background:"#fff",
                        border:`1.5px solid ${S.tan}`, borderRadius:10,
                        display:"flex", alignItems:"center", gap:12,
                        cursor: key === "alternative" ? "default" : "pointer",
                        opacity: homeSaving ? 0.6 : 1,
                      }}>
                      <div style={{ width:12, height:12, borderRadius:"50%", background: color, flexShrink:0 }}/>
                      <span style={{ fontSize:14, fontWeight:600, color }}>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Recipe picker — no planned recipe (desayuno / merienda) */}
                <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#a09080", marginBottom:10 }}>Opciones</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                  {Object.entries(RECIPES)
                    .filter(([, rec]) => rec.category === MEAL_CATEGORY[homeCheckin.meal])
                    .map(([key, rec]) => (
                      <button key={key}
                        onClick={() => saveHomeLog("plan", rec.name)}
                        disabled={homeSaving}
                        style={{
                          width:"100%", padding:"13px 16px", background:"#fff",
                          border:`1.5px solid ${S.tan}`, borderRadius:10,
                          display:"flex", alignItems:"center", gap:12,
                          cursor:"pointer", opacity: homeSaving ? 0.6 : 1, textAlign:"left",
                        }}>
                        <HugeiconsIcon icon={Coffee04Icon} size={20} color={S.greenMid} />
                        <span style={{ fontSize:13, fontWeight:600, color: S.brownDark }}>{rec.name}</span>
                      </button>
                    ))
                  }
                  <button onClick={() => saveHomeLog("skipped")} disabled={homeSaving}
                    style={{
                      width:"100%", padding:"13px 16px", background:"#fff",
                      border:`1.5px solid ${S.tan}`, borderRadius:10,
                      display:"flex", alignItems:"center", gap:12,
                      cursor:"pointer", opacity: homeSaving ? 0.6 : 1,
                    }}>
                    <div style={{ width:12, height:12, borderRadius:"50%", background:"#a09080", flexShrink:0 }}/>
                    <span style={{ fontSize:14, fontWeight:600, color:"#a09080" }}>No comí</span>
                  </button>
                </div>
              </>
            )}

            {/* Alternative form */}
            <div style={{ background:"#fff", border:`1.5px solid ${S.tan}`, borderRadius:12, padding:"16px" }}>
              <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"#a09080", marginBottom:12 }}>Comida alternativa</div>
              {[
                { key:"recipeName",  label:"Nombre",               placeholder:"Ej: Milanesa con ensalada" },
                { key:"ingredients", label:"Ingredientes (opcional)", placeholder:"Ej: Milanesa 200g, lechuga" },
                { key:"notes",       label:"Notas (opcional)",       placeholder:"Ej: Comí afuera" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:"#a09080", marginBottom:4 }}>{label}</div>
                  <input
                    value={homeAltForm[key]}
                    onChange={e => setHomeAltForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                      width:"100%", padding:"10px 12px", borderRadius:8,
                      border:`1px solid ${S.tan}`, fontSize:13,
                      fontFamily:"'Inter',sans-serif", color: S.brownDark,
                      background: S.cream, outline:"none",
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => saveHomeLog("alternative")}
                disabled={homeSaving || !homeAltForm.recipeName}
                style={{
                  width:"100%", marginTop:4, padding:"12px", border:"none", borderRadius:10,
                  background: homeAltForm.recipeName ? `linear-gradient(135deg,${S.greenMid},#2c5020)` : "#ede8df",
                  color: homeAltForm.recipeName ? "#fff" : "#a09080",
                  fontSize:14, fontWeight:700, cursor: homeAltForm.recipeName ? "pointer" : "not-allowed",
                }}>
                {homeSaving ? "Guardando..." : "Guardar comida alternativa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECIPE MODAL ── */}
      {recipeModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1100, display:"flex", alignItems:"flex-end" }}
          onClick={() => setRecipeModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"100%", maxWidth:480, margin:"0 auto",
            background: S.cream, borderRadius:"16px 16px 0 0",
            padding:"24px 20px 40px", maxHeight:"85vh", overflowY:"auto",
          }}>
            {/* Handle + close */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", position:"relative", marginBottom:20 }}>
              <div style={{ width:36, height:4, borderRadius:2, background: S.tan }} />
              <button onClick={() => setRecipeModal(null)} style={{
                position:"absolute", right:0, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer", padding:4,
                display:"flex", alignItems:"center",
              }}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color="#a09080" />
              </button>
            </div>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:12, background: S.greenLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <HugeiconsIcon icon={MEAL_ICON[recipeModal.meal] ?? Dish02Icon} size={28} color={S.greenMid} />
              </div>
              <div>
                <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"#8a7a5a", marginBottom:4 }}>{recipeModal.meal}</div>
                <div style={{ fontSize:16, fontWeight:700, color: S.brownDark, lineHeight:1.3 }}>{recipeModal.recipe.name}</div>
              </div>
            </div>
            {/* Note */}
            {recipeModal.recipe.note && (
              <div style={{ fontSize:12, color:"#8a7a5a", fontStyle:"italic", marginBottom:14 }}>* {recipeModal.recipe.note}</div>
            )}
            {/* Ingredients */}
            <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#a09080", marginBottom:10 }}>Ingredientes</div>
            {recipeModal.recipe.ingredients.map(ing => (
              <div key={ing.name} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${S.brownLight}`, fontSize:13, color: S.brownDark }}>
                <span>{ing.name}</span>
                <span style={{ fontWeight:600, color: S.greenMid }}>{fmt(ing.amount, ing.unit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRINT MODAL ── */}
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
      {/* ── BOTTOM NAVBAR ── */}
      {(() => {
        const NAV = [
          { id:"recetas",     label:"Recetas",  icon: BookOpen01Icon },
          { id:"lista",       label:"Lista",    icon: ShoppingCart01Icon },
          { id:"planner",     label:"Inicio",   icon: Home01Icon, center: true },
          { id:"seguimiento", label:"Registro", icon: Task01Icon },
          { id:"cuenta",      label:"Cuenta",   icon: UserIcon },
        ];
        return (
          <div style={{
            position:"fixed", bottom:0, left:0, right:0, zIndex:1000,
            background:"#fff", borderTop:"1px solid #ede8df",
            boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",
            display:"flex", justifyContent:"center",
          }}>
            <div style={{ width:"100%", maxWidth:480, display:"flex", alignItems:"center", padding:"0 8px", marginBottom:20 }}>
              {NAV.map(({ id, label, icon, center }) => {
                const active = tab === id;
                if (center) return (
                  <div key={id} style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center" }}>
                    <button onClick={() => setTab(id)} style={{
                      width:56, height:56, borderRadius:"50%", border:"none",
                      background: active
                        ? `linear-gradient(135deg,${S.greenMid},#2c5020)`
                        : S.greenLight,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      cursor:"pointer", marginBottom:12,
                      boxShadow: active ? "0 4px 16px rgba(58,107,40,0.4)" : "0 2px 8px rgba(58,107,40,0.15)",
                      transition:"background 0.2s, box-shadow 0.2s",
                    }}>
                      <HugeiconsIcon icon={icon} size={26} color={active ? "#fff" : S.greenMid} />
                    </button>
                  </div>
                );
                return (
                  <button key={id} onClick={() => setTab(id)} style={{
                    flex:1, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    gap:3, padding:"10px 0 8px", border:"none", background:"none",
                    cursor:"pointer",
                  }}>
                    <HugeiconsIcon icon={icon} size={22} color={active ? S.greenMid : "#b0a898"} />
                    <span style={{ fontSize:10, fontWeight: active ? 700 : 500, color: active ? S.greenMid : "#b0a898", fontFamily:"'Inter',sans-serif" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
