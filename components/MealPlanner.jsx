"use client";

import { useState, useMemo } from "react";
import { RECIPES, DAYS, CATEGORIES, CAT_ICONS, fmt, getCat } from "@/lib/data";
import Seguimiento from "@/components/Seguimiento";

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
  const [plannerDay,     setPlannerDay]     = useState(todayPlannerIdx);
  const [checked,        setChecked]        = useState({});
  const [tab,            setTab]            = useState("planner");
  const [ingredientsOpen, setIngredientsOpen] = useState(null);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [printModal,     setPrintModal]     = useState(false);
  const [exporting,      setExporting]      = useState(false);

  const toggleCheck = (n) => setChecked(p => ({ ...p, [n]: !p[n] }));

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
    return DAYS.flatMap((d, idx) =>
      ["almuerzo","cena"].map(meal => ({ day: d.day, meal, recipe: RECIPES[d[meal]] }))
    );
  }, []);

  return (
    <div style={{ minHeight:"100vh", background: S.cream, fontFamily:"'Lora',Georgia,serif", color: S.brownDark }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(155deg,#2c4a1e,#1a2e12)", padding:"30px 20px 26px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }}/>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ fontSize:10, letterSpacing:"3px", color:"#8ab87a", textTransform:"uppercase", marginBottom:8 }}>Plan Nutricional</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:"#f5f0e8", lineHeight:1.2, marginBottom:5 }}>
            Ledesma<br/>Juan José
          </h1>
          <p style={{ fontSize:12, color:"#6a8a5a", fontStyle:"italic" }}>Almuerzo & Cena · 1 porción · Lunes a Viernes</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 20px" }}>
        <div style={{ display:"flex", borderBottom:`2px solid ${S.tan}` }}>
          {[
            { id:"planner", label:"Semana",  icon:"📅" },
            { id:"lista",   label:`Lista${total > 0 ? ` · ${total}` : ""}`, icon:"🛒" },
            { id:"recetas", label:"Recetas", icon:"📖" },
            { id:"seguimiento", label:"Seguimiento", icon:"📈" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:"13px 6px", background:"none", border:"none",
              borderBottom: tab === t.id ? `2px solid ${S.greenMid}` : "2px solid transparent",
              marginBottom:-2,
              color: tab === t.id ? S.greenMid : "#8a7a5a",
              fontSize:12, fontFamily:"Lora,serif", fontWeight: tab === t.id ? 600 : 400,
              cursor:"pointer",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"20px 20px 60px" }}>

        {/* ── PLANNER ── */}
        {tab === "planner" && (
          <div className="fade-in">
            {/* Day chips */}
            <div style={{ display:"flex", gap:6, marginBottom:14 }}>
              {DAYS.map((d, i) => {
                const isToday    = i === todayPlannerIdx();
                const isSelected = i === plannerDay;
                return (
                  <button key={i} onClick={() => { setPlannerDay(i); setIngredientsOpen(null); }} style={{
                    flex:1, padding:"8px 4px", borderRadius:8, border:"none",
                    background: isSelected ? S.greenMid : "#ede8df",
                    color: isSelected ? "#fff" : S.brownMid,
                    fontSize:10, fontFamily:"Lora,serif",
                    fontWeight: isSelected ? 700 : 400,
                    cursor:"pointer", position:"relative",
                  }}>
                    {d.short}
                    {isToday && (
                      <div style={{
                        position:"absolute", bottom:3, left:"50%", transform:"translateX(-50%)",
                        width:4, height:4, borderRadius:"50%",
                        background: isSelected ? "#fff" : S.greenMid,
                      }}/>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day — one card per meal */}
            {(() => {
              const d = DAYS[plannerDay];
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {["almuerzo","cena"].map(meal => {
                    const r    = RECIPES[d[meal]];
                    const open = ingredientsOpen === meal;
                    return (
                      <div key={meal} style={{ background:"#fff", border:`1.5px solid #c8dfc0`, borderRadius:12, overflow:"hidden" }}>
                        <div style={{ padding:"13px 15px", display:"flex", alignItems:"center", gap:11, cursor:"pointer" }}
                          onClick={() => setIngredientsOpen(open ? null : meal)}>
                          <div style={{
                            width:34, height:34, borderRadius:7, flexShrink:0,
                            background: S.greenLight,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:18,
                          }}>
                            {r.emoji}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"#8a7a5a", marginBottom:3 }}>{meal}</div>
                            <div style={{ fontSize:13, fontWeight:600, color: S.brownDark, lineHeight:1.3 }}>{r.name}</div>
                          </div>
                          <span style={{ fontSize:13, color:"#a09080", transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</span>
                        </div>
                        {open && (
                          <div style={{ borderTop:"1px solid #eee", padding:"12px 15px", background:"#fcfaf7" }}>
                            {r.ingredients.map(ing => (
                              <div key={ing.name} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 0", borderBottom:`1px solid ${S.brownLight}`, color: S.brownDark }}>
                                <span>{ing.name}</span>
                                <span style={{ color: S.greenMid, fontWeight:600 }}>{fmt(ing.amount, ing.unit)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        )}

        {/* ── LISTA ── */}
        {tab === "lista" && (
          <div className="fade-in">
            {shoppingList.length === 0 ? (
              <div style={{ textAlign:"center", padding:"50px 0", color:"#8a7a5a" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🥬</div>
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
                    <div style={{ fontSize:28, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>{total}</div>
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
                      <button onClick={() => setChecked({})} style={{ background:"none", border:"none", fontSize:11, color:"#8a7a5a", fontFamily:"Lora,serif", textDecoration:"underline", cursor:"pointer" }}>Limpiar</button>
                    </div>
                  </div>
                )}

                {Object.entries(CATEGORIES).map(([cat]) => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;
                  const catChecked = items.filter(i => checked[i.name]).length;
                  return (
                    <div key={cat} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 0", marginBottom:7 }}>
                        <span style={{ fontSize:15 }}>{CAT_ICONS[cat]}</span>
                        <span style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color: S.brownMid, fontWeight:600 }}>{cat}</span>
                        <span style={{ marginLeft:"auto", fontSize:10, color:"#a09080" }}>{catChecked > 0 ? `${catChecked}/${items.length}` : items.length}</span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        {items.map(({ name, amount, unit }) => {
                          const done = checked[name];
                          return (
                            <div key={name} onClick={() => toggleCheck(name)} style={{
                              display:"flex", alignItems:"center", gap:11,
                              padding:"11px 13px", borderRadius:9,
                              background: done ? "#f0ebe3" : "#fff",
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
                                {unit === "c/n" ? "c/n" : fmt(amount, unit)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
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
                fontSize:15, fontFamily:"'Playfair Display',serif", fontWeight:700, cursor:"pointer",
              }}>
                📄 Exportar recetas (semana completa)
              </button>
            </div>
          </div>
        )}

        {/* ── RECETAS ── */}
        {tab === "recetas" && (
          <div className="fade-in">
            {[
              { cat: "almuerzo_cena",      label: "Almuerzo / Cena"      },
              { cat: "desayuno_merienda",  label: "Desayuno / Merienda"  },
            ].map(({ cat, label }) => {
              const entries = Object.entries(RECIPES).filter(([, r]) => r.category === cat);
              return (
                <div key={cat} style={{ marginBottom:22 }}>
                  <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color: S.brownMid, fontWeight:600, marginBottom:10 }}>
                    {label}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {entries.map(([key, recipe]) => {
                      const open   = expandedRecipe === key;
                      const usedIn = DAYS.flatMap(d => {
                        const r = [];
                        if (d.almuerzo === key) r.push(`${d.day} (almuerzo)`);
                        if (d.cena     === key) r.push(`${d.day} (cena)`);
                        return r;
                      });
                      return (
                        <div key={key} style={{ background:"#fff", border:`1.5px solid #e8e2d8`, borderRadius:12, overflow:"hidden" }}>
                          <div onClick={() => setExpandedRecipe(open ? null : key)}
                            style={{ padding:"13px 15px", display:"flex", alignItems:"center", gap:11, cursor:"pointer" }}>
                            <span style={{ fontSize:22 }}>{recipe.emoji}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:600, color: S.brownDark, lineHeight:1.3 }}>{recipe.name}</div>
                              {usedIn.length > 0 && (
                                <div style={{ fontSize:11, color:"#8a7a5a", marginTop:2 }}>{usedIn.join(" · ")}</div>
                              )}
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
              );
            })}
          </div>
        )}
        {/* ── SEGUIMIENTO ── */}
        {tab === "seguimiento" && (
          <div className="fade-in">
            <Seguimiento />
          </div>
        )}

      </div>

      {/* ── PRINT MODAL ── */}
      {printModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", flexDirection:"column" }}>
          <div style={{ background:`linear-gradient(135deg,#2c4a1e,#1a2e12)`, padding:"20px 20px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:"2px", color:"#8ab87a", textTransform:"uppercase", marginBottom:3 }}>Recetas</div>
              <div style={{ fontSize:16, fontWeight:900, color:"#f5f0e8", fontFamily:"'Playfair Display',serif" }}>
                {DAYS.map(d => d.day).join(", ")}
              </div>
            </div>
            <button onClick={() => setPrintModal(false)} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:34, height:34, borderRadius:"50%", fontSize:16, cursor:"pointer" }}>✕</button>
          </div>

          <div style={{ flex:1, overflowY:"auto", background: S.cream, padding:"20px 20px 120px" }}>
            {modalEntries.map(({ day, meal, recipe }, idx, arr) => {
              const isNewDay = idx === 0 || arr[idx-1].day !== day;
              return (
                <div key={`${day}-${meal}`}>
                  {isNewDay && (
                    <div style={{ borderTop: idx === 0 ? "none" : `2px solid ${S.greenLight}`, paddingTop: idx === 0 ? 0 : 16, marginTop: idx === 0 ? 0 : 16, marginBottom:12 }}>
                      <span style={{ fontSize:16, fontWeight:900, color: S.greenDark, fontFamily:"'Playfair Display',serif" }}>{day.toUpperCase()}</span>
                    </div>
                  )}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#8a7a5a", marginBottom:4 }}>
                      {meal === "almuerzo" ? "🌿 Almuerzo" : "🌙 Cena"}
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
              fontSize:14, fontFamily:"'Playfair Display',serif", fontWeight:700, cursor: exporting ? "not-allowed" : "pointer",
            }}>
              {exporting ? "⏳ Generando PDF..." : "⬇️ Descargar PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
