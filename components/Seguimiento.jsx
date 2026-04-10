"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { DAYS, RECIPES, fmt } from "@/lib/data";

const S = {
  greenDark:  "#2c4a1e",
  greenMid:   "#3a6b28",
  greenLight: "#eaf3e6",
  cream:      "#faf7f2",
  tan:        "#e8e0d0",
  brownDark:  "#2c2416",
  brownMid:   "#6a5a3a",
  brownLight: "#f5f0e8",
  yellow:     "#f5a623",
  red:        "#c0392b",
};

const MEALS = [
  { key: "desayuno",  label: "Desayuno",  icon: "☀️" },
  { key: "almuerzo",  label: "Almuerzo",  icon: "🌿" },
  { key: "merienda",  label: "Merienda",  icon: "🍵" },
  { key: "cena",      label: "Cena",      icon: "🌙" },
];

// Meals that have a planned recipe from the plan
const PLANNED_MEALS = ["almuerzo", "cena"];
  plan:        { label: "Seguí el plan",    icon: "✅", color: S.greenMid },
  alternative: { label: "Comí otra cosa",   icon: "🔄", color: S.yellow  },
  skipped:     { label: "No comí",          icon: "⏭️", color: "#a09080"  },
};

// Get the Monday of the current week
function getWeekStart(offset = 0) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function dateStr(date) {
  return date.toISOString().split("T")[0];
}

function getWeekDates(weekStart) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return dateStr(d);
  });
}

function todayStr() {
  return dateStr(new Date());
}

export default function Seguimiento() {
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [logs,        setLogs]        = useState({}); // { "2024-01-01": { almuerzo: {...}, cena: {...} } }
  const [loading,     setLoading]     = useState(true);
  const [checkinDay,  setCheckinDay]  = useState(null); // { date, dayIdx, meal }
  const [altForm,     setAltForm]     = useState({ recipeName: "", ingredients: "", notes: "" });
  const [saving,      setSaving]      = useState(false);
  const [view,        setView]        = useState("week"); // "week" | "summary"

  const weekStart = getWeekStart(weekOffset);
  const weekDates = getWeekDates(weekStart);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .in("date", weekDates);

    if (!error && data) {
      const map = {};
      data.forEach(row => {
        if (!map[row.date]) map[row.date] = {};
        map[row.date][row.meal] = row;
      });
      setLogs(map);
    }
    setLoading(false);
  }, [weekOffset]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const weekLabel = () => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 4);
    const opts = { day: "numeric", month: "short" };
    if (weekOffset === 0) return "Esta semana";
    if (weekOffset === -1) return "Semana pasada";
    return `${weekStart.toLocaleDateString("es-AR", opts)} — ${end.toLocaleDateString("es-AR", opts)}`;
  };

  const openCheckin = (date, dayIdx, meal) => {
    setAltForm({ recipeName: "", ingredients: "", notes: "" });
    setCheckinDay({ date, dayIdx, meal });
  };

  const saveLog = async (status) => {
    if (!checkinDay) return;
    setSaving(true);
    const { date, dayIdx, meal } = checkinDay;
    const isPlanned = PLANNED_MEALS.includes(meal);
    const planned   = isPlanned ? RECIPES[DAYS[dayIdx][meal]] : null;

    const payload = {
      date,
      meal,
      status,
      recipe_name:  status === "plan" && planned ? planned.name : (altForm.recipeName || null),
      ingredients:  status === "alternative" ? altForm.ingredients : null,
      notes:        altForm.notes || null,
    };

    const existing = logs[date]?.[meal];
    if (existing?.id) {
      await supabase.from("meal_logs").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("meal_logs").insert(payload);
    }

    setSaving(false);
    setCheckinDay(null);
    loadLogs();
  };

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalMeals    = weekDates.length * 4; // 5 days × 4 meals
  const loggedMeals   = weekDates.reduce((acc, d) => acc + Object.keys(logs[d] || {}).length, 0);
  const onPlan        = weekDates.reduce((acc, d) => acc + Object.values(logs[d] || {}).filter(l => l.status === "plan").length, 0);
  const alternative   = weekDates.reduce((acc, d) => acc + Object.values(logs[d] || {}).filter(l => l.status === "alternative").length, 0);
  const skipped       = weekDates.reduce((acc, d) => acc + Object.values(logs[d] || {}).filter(l => l.status === "skipped").length, 0);
  const adherencePct  = loggedMeals > 0 ? Math.round((onPlan / loggedMeals) * 100) : null;

  const dayStatus = (date) => {
    const dayLogs = logs[date] || {};
    const vals = Object.values(dayLogs);
    if (vals.length === 0) return "none";
    if (vals.every(l => l.status === "plan")) return "green";
    if (vals.some(l => l.status === "plan")) return "yellow";
    if (vals.every(l => l.status === "skipped")) return "grey";
    return "yellow";
  };

  const heatColor = { green: S.greenMid, yellow: S.yellow, grey: "#c0b8a8", none: S.tan };

  return (
    <div style={{ fontFamily:"'Lora',Georgia,serif", color: S.brownDark }}>

      {/* Week navigator */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background:"none", border:`1px solid ${S.tan}`, borderRadius:8, padding:"6px 12px", fontSize:16, cursor:"pointer", color: S.brownMid }}>‹</button>
        <span style={{ fontSize:14, fontWeight:600, color: S.brownDark }}>{weekLabel()}</span>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} disabled={weekOffset === 0}
          style={{ background:"none", border:`1px solid ${S.tan}`, borderRadius:8, padding:"6px 12px", fontSize:16, cursor: weekOffset === 0 ? "not-allowed" : "pointer", color: weekOffset === 0 ? S.tan : S.brownMid }}>›</button>
      </div>

      {/* View toggle */}
      <div style={{ display:"flex", gap:6, marginBottom:18 }}>
        {[["week","📅 Días"],["summary","📊 Resumen"]].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{
            flex:1, padding:"8px", borderRadius:8, border:"none",
            background: view === id ? S.greenMid : "#ede8df",
            color: view === id ? "#fff" : "#8a7a5a",
            fontSize:12, fontFamily:"Lora,serif", fontWeight: view === id ? 600 : 400, cursor:"pointer",
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#8a7a5a", fontStyle:"italic" }}>Cargando...</div>
      ) : view === "week" ? (

        /* ── DAY VIEW ── */
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {weekDates.map((date, di) => {
            const d = DAYS[di];
            const isToday = date === todayStr();
            const isFuture = date > todayStr();
            return (
              <div key={date} style={{
                background: "#fff",
                border:`1.5px solid ${isToday ? S.greenMid : S.tan}`,
                borderRadius:12, overflow:"hidden",
                opacity: isFuture ? 0.45 : 1,
              }}>
                {/* Day header */}
                <div style={{ padding:"10px 14px", background: isToday ? S.greenLight : S.brownLight, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, fontWeight:700, color: isToday ? S.greenDark : S.brownMid }}>
                    {d.day} {isToday && <span style={{ fontSize:10, background: S.greenMid, color:"#fff", borderRadius:4, padding:"1px 6px", marginLeft:6 }}>Hoy</span>}
                  </span>
                  <span style={{ fontSize:11, color:"#a09080" }}>
                    {new Date(date + "T12:00:00").toLocaleDateString("es-AR", { day:"numeric", month:"short" })}
                  </span>
                </div>

                {/* Meals */}
                {MEALS.map(({ key: meal, label: mealLabel, icon }) => {
                  const log      = logs[date]?.[meal];
                  const isPlanned = PLANNED_MEALS.includes(meal);
                  const planned  = isPlanned ? RECIPES[d[meal]] : null;
                  return (
                    <div key={meal} style={{ padding:"10px 14px", borderTop:`1px solid ${S.tan}` }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:"#a09080", marginBottom:3 }}>
                            {icon} {mealLabel}
                          </div>
                          <div style={{ fontSize:12, color: S.brownDark, marginBottom: log ? 4 : 0 }}>
                            {planned ? planned.name : <span style={{ fontStyle:"italic", color:"#a09080" }}>Sin plan específico</span>}
                          </div>
                          {log && (
                            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                              <span style={{ fontSize:13 }}>{STATUS[log.status].icon}</span>
                              <span style={{ fontSize:11, color: STATUS[log.status].color, fontWeight:600 }}>
                                {log.status === "alternative" ? (log.recipe_name || "Otra comida") : STATUS[log.status].label}
                              </span>
                              {log.notes && <span style={{ fontSize:10, color:"#a09080", fontStyle:"italic" }}>· {log.notes}</span>}
                            </div>
                          )}
                        </div>
                        {!isFuture && (
                          <button onClick={() => openCheckin(date, di, meal)} style={{
                            padding:"6px 10px", borderRadius:8, border:`1px solid ${S.tan}`,
                            background: log ? S.greenLight : "#ede8df",
                            color: log ? S.greenMid : "#8a7a5a",
                            fontSize:11, fontFamily:"Lora,serif", cursor:"pointer", flexShrink:0,
                          }}>
                            {log ? "Editar" : "Registrar"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

      ) : (

        /* ── SUMMARY VIEW ── */
        <div>
          {/* Adherence ring */}
          <div style={{ background:"#fff", border:`1.5px solid ${S.tan}`, borderRadius:12, padding:"20px", marginBottom:12, textAlign:"center" }}>
            <div style={{ fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:"#a09080", marginBottom:10 }}>Adherencia semanal</div>
            <div style={{ fontSize:52, fontWeight:900, color: adherencePct >= 80 ? S.greenMid : adherencePct >= 50 ? S.yellow : S.red, fontFamily:"'Playfair Display',serif" }}>
              {adherencePct !== null ? `${adherencePct}%` : "—"}
            </div>
            <div style={{ fontSize:12, color:"#a09080", marginTop:4 }}>
              {onPlan} de {loggedMeals} comidas registradas siguieron el plan
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              { label:"En plan",      value: onPlan,      color: S.greenMid, icon:"✅" },
              { label:"Alternativa",  value: alternative, color: S.yellow,   icon:"🔄" },
              { label:"Sin registro", value: skipped,     color:"#a09080",   icon:"⏭️" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ background:"#fff", border:`1.5px solid ${S.tan}`, borderRadius:10, padding:"12px 8px", textAlign:"center" }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:20, fontWeight:900, color, fontFamily:"'Playfair Display',serif" }}>{value}</div>
                <div style={{ fontSize:10, color:"#a09080" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div style={{ background:"#fff", border:`1.5px solid ${S.tan}`, borderRadius:12, padding:"16px", marginBottom:12 }}>
            <div style={{ fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:"#a09080", marginBottom:12 }}>Mapa de la semana</div>
            <div style={{ display:"flex", gap:6 }}>
              {weekDates.map((date, di) => {
                const status = dayStatus(date);
                const isFuture = date > todayStr();
                return (
                  <div key={date} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#a09080", marginBottom:5 }}>{DAYS[di].short}</div>
                    <div style={{
                      height:40, borderRadius:8,
                      background: isFuture ? "#f0ebe3" : heatColor[status],
                      opacity: isFuture ? 0.4 : 1,
                      transition:"background 0.3s",
                    }}/>
                    <div style={{ fontSize:9, color:"#a09080", marginTop:4 }}>
                      {Object.keys(logs[date] || {}).length}/2
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:12, marginTop:12, justifyContent:"center" }}>
              {[["✅ En plan", S.greenMid],["🔄 Parcial", S.yellow],["⏭️ Sin comida","#c0b8a8"],["— Sin registro", S.tan]].map(([label, color]) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background: color }}/>
                  <span style={{ fontSize:9, color:"#a09080" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Off-plan log */}
          {alternative > 0 && (
            <div style={{ background:"#fff", border:`1.5px solid ${S.tan}`, borderRadius:12, padding:"16px" }}>
              <div style={{ fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:"#a09080", marginBottom:12 }}>Comidas alternativas</div>
              {weekDates.flatMap(date =>
                Object.entries(logs[date] || {})
                  .filter(([, l]) => l.status === "alternative")
                  .map(([meal, l]) => (
                    <div key={`${date}-${meal}`} style={{ padding:"8px 0", borderBottom:`1px solid ${S.tan}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:12, fontWeight:600, color: S.brownDark }}>{l.recipe_name || "Sin nombre"}</span>
                        <span style={{ fontSize:10, color:"#a09080" }}>
                          {new Date(date+"T12:00:00").toLocaleDateString("es-AR",{day:"numeric",month:"short"})} · {meal}
                        </span>
                      </div>
                      {l.ingredients && <div style={{ fontSize:11, color: S.brownMid }}>{l.ingredients}</div>}
                      {l.notes && <div style={{ fontSize:11, color:"#a09080", fontStyle:"italic" }}>{l.notes}</div>}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CHECK-IN MODAL ── */}
      {checkinDay && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background: S.cream, borderRadius:"16px 16px 0 0", padding:"24px 20px 40px", maxHeight:"85vh", overflowY:"auto" }}>
            {/* Modal header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#a09080" }}>
                  {DAYS[checkinDay.dayIdx].day} · {MEALS.find(m => m.key === checkinDay.meal)?.label}
                </div>
                <div style={{ fontSize:14, fontWeight:700, color: S.brownDark, marginTop:2 }}>
                  {PLANNED_MEALS.includes(checkinDay.meal)
                    ? RECIPES[DAYS[checkinDay.dayIdx][checkinDay.meal]].name
                    : "Registrar comida"}
                </div>
              </div>
              <button onClick={() => setCheckinDay(null)} style={{ background:"none", border:"none", fontSize:20, color:"#a09080", cursor:"pointer" }}>✕</button>
            </div>

            {/* Status buttons */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
              {Object.entries(STATUS).map(([key, { label, icon, color }]) => (
                <button key={key} onClick={() => key !== "alternative" && saveLog(key)} style={{
                  width:"100%", padding:"14px 16px",
                  background: "#fff", border:`1.5px solid ${S.tan}`,
                  borderRadius:10, display:"flex", alignItems:"center", gap:12,
                  cursor:"pointer", textAlign:"left",
                  opacity: saving ? 0.6 : 1,
                }}>
                  <span style={{ fontSize:22 }}>{icon}</span>
                  <span style={{ fontSize:14, fontFamily:"Lora,serif", fontWeight:600, color }}>{label}</span>
                </button>
              ))}
            </div>

            {/* Alternative form */}
            <div style={{ background:"#fff", border:`1.5px solid ${S.tan}`, borderRadius:12, padding:"16px" }}>
              <div style={{ fontSize:11, letterSpacing:"1.5px", textTransform:"uppercase", color:"#a09080", marginBottom:12 }}>🔄 Detalle de comida alternativa</div>
              {[
                { key:"recipeName",   label:"Nombre de la comida",  placeholder:"Ej: Milanesa con ensalada" },
                { key:"ingredients",  label:"Ingredientes (opcional)", placeholder:"Ej: Milanesa 200g, lechuga, tomate" },
                { key:"notes",        label:"Notas (opcional)",       placeholder:"Ej: Comí afuera con amigos" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:"#a09080", marginBottom:4 }}>{label}</div>
                  <input
                    value={altForm[key]}
                    onChange={e => setAltForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                      width:"100%", padding:"10px 12px", borderRadius:8,
                      border:`1px solid ${S.tan}`, fontSize:13,
                      fontFamily:"Lora,serif", color: S.brownDark,
                      background: S.cream, outline:"none",
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => saveLog("alternative")}
                disabled={saving || !altForm.recipeName}
                style={{
                  width:"100%", marginTop:4, padding:"12px",
                  background: altForm.recipeName ? `linear-gradient(135deg,${S.greenMid},#2c5020)` : "#ede8df",
                  color: altForm.recipeName ? "#fff" : "#a09080",
                  border:"none", borderRadius:10,
                  fontSize:14, fontFamily:"'Playfair Display',serif", fontWeight:700,
                  cursor: altForm.recipeName ? "pointer" : "not-allowed",
                }}
              >
                {saving ? "Guardando..." : "Guardar comida alternativa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
