"use client";

/* Shared bottom-sheet check-in modal — used by both the Home (planner)
   and Registro (Seguimiento) tabs so the design stays identical. */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { RECIPES } from "@/lib/data";
import {
  Coffee, UtensilsCrossed, Search, X, Crown, Plus,
} from "lucide-react";

/* ─── Design tokens (mirror globals.css custom properties) ─── */
const T = {
  bgDefault:     "var(--color-bg-default)",
  bgSurface:     "var(--color-bg-surface-neutral)",
  bgFill:        "var(--color-bg-fill-neutral)",
  textDefault:   "var(--color-text-default)",
  textSecondary: "var(--color-text-secondary)",
  textPrimary:   "var(--color-text-primary)",
  radiusMd:      "12px",
  radiusMax:     "9999px",
};

const HEX = {
  bgDefault:      "#f7f7f3",
  bgFill:         "#e4e6de",
  textDefault:    "#1c1f1b",
  textSecondary:  "#6e736a",
  textPrimary:    "#153014",
  borderDisabled: "#e4e6de",
};

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

/* Bottom-sheet shell — portaled to body so it escapes any ancestor
   `transform` (e.g. the `.fade-in` entrance animation) that would
   otherwise trap `position: fixed`, and clears the bottom navbar. */
export function SheetShell({ onClose, header, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!mounted) return null;

  return createPortal(
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
          maxHeight: "85vh",
          display: "flex", flexDirection: "column",
          fontFamily: "'Inter', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Fixed header */}
        <div style={{ flexShrink: 0, padding: "24px 20px 0" }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: T.bgFill, margin: "0 auto 20px",
          }} />
          {header}
        </div>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px" }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* Check-in sheet — pick the planned recipe, an alternative, a free meal,
   skip, or add a brand-new recipe.
   onSave(status, overrideRecipeName?) where status ∈
   plan | alternative | free | skipped. */
export function CheckinSheet({ checkin, altForm, setAltForm, onClose, onSave, saving }) {
  const { meal, recipe: plannedRecipe } = checkin;
  const Icon = MEAL_ICON[meal] ?? UtensilsCrossed;
  const [search,       setSearch]       = useState("");
  const [showAltForm,  setShowAltForm]  = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const listRef     = useRef(null);
  const sentinelRef = useRef(null);

  const filteredRecipes = Object.entries(RECIPES)
    .filter(([, r]) => r.category === MEAL_CATEGORY[meal])
    .filter(([, r]) => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .sort(([, a], [, b]) => {
      const aPlanned = plannedRecipe && a.name === plannedRecipe.name;
      const bPlanned = plannedRecipe && b.name === plannedRecipe.name;
      return (aPlanned ? 0 : 1) - (bPlanned ? 0 : 1);
    });

  const visibleRecipes = filteredRecipes.slice(0, visibleCount);
  const hasMore        = filteredRecipes.length > visibleCount;

  // Reset visible count on every new search query
  useEffect(() => { setVisibleCount(4); }, [search]);

  // Load +4 when the sentinel scrolls into view inside the list container
  useEffect(() => {
    const container = listRef.current;
    const sentinel  = sentinelRef.current;
    if (!container || !sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + 4); },
      { root: container, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

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
          Registrar comida
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
      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} color={HEX.textSecondary} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar receta..."
          style={{
            width: "100%", padding: "10px 12px 10px 36px",
            borderRadius: T.radiusMd,
            border: `1px solid ${HEX.borderDisabled}`,
            fontSize: 16, lineHeight: "24px",
            fontFamily: "'Inter', sans-serif",
            color: HEX.textDefault, background: HEX.bgDefault,
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Recipe list — capped height so sentinel starts below the fold */}
      <div
        ref={listRef}
        style={{
          display: "flex", flexDirection: "column", gap: 8,
          maxHeight: 256, overflowY: "auto",
          marginBottom: 8,
        }}
      >
        {visibleRecipes.map(([key, rec]) => {
          const isPlanned = plannedRecipe && rec.name === plannedRecipe.name;
          return (
            <button
              key={key}
              onClick={() => onSave(isPlanned ? "plan" : "alternative", rec.name)}
              disabled={saving}
              style={{
                width: "100%", padding: "14px 16px",
                background: isPlanned ? HEX.bgFill : T.bgSurface,
                border: isPlanned ? `1.5px solid ${HEX.textPrimary}` : "1.5px solid transparent",
                borderRadius: T.radiusMd,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", opacity: saving ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
                textAlign: "left",
                flexShrink: 0,
              }}
            >
              <Icon size={20} color={isPlanned ? HEX.textPrimary : HEX.textDefault} strokeWidth={1.75} />
              <span style={{ flex: 1, fontSize: 16, fontWeight: 500, lineHeight: "24px", color: isPlanned ? HEX.textPrimary : T.textDefault }}>
                {rec.name}
              </span>
              {isPlanned && (
                <span style={{ fontSize: 11, fontWeight: 500, color: HEX.textPrimary, background: "rgba(21,48,20,0.08)", padding: "2px 8px", borderRadius: T.radiusMax }}>
                  Plan
                </span>
              )}
            </button>
          );
        })}
        {hasMore && <div ref={sentinelRef} style={{ height: 1, flexShrink: 0 }} />}
      </div>

      {/* Fixed actions — always visible below the list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {/* Comida libre — consumes one of the week's free meals */}
        <button
          onClick={() => onSave("free")}
          disabled={saving}
          style={{
            width: "100%", padding: "14px 16px",
            background: T.bgSurface, border: "1.5px solid transparent",
            borderRadius: T.radiusMd,
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer", opacity: saving ? 0.6 : 1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <Crown size={20} color={HEX.textPrimary} strokeWidth={1.75} />
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: T.textPrimary }}>
            Comida libre
          </span>
        </button>

        {/* No comí */}
        <button
          onClick={() => onSave("skipped")}
          disabled={saving}
          style={{
            width: "100%", padding: "14px 16px",
            background: T.bgSurface, border: "1.5px solid transparent",
            borderRadius: T.radiusMd,
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer", opacity: saving ? 0.6 : 1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: HEX.textSecondary, flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: T.textSecondary }}>No comí</span>
        </button>

        {/* Agregar receta nueva */}
        <button
          onClick={() => setShowAltForm(v => !v)}
          style={{
            width: "100%", padding: "14px 16px",
            background: "none", border: `1.5px dashed ${HEX.borderDisabled}`,
            borderRadius: T.radiusMd,
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <Plus size={20} color={HEX.textSecondary} strokeWidth={1.75} />
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: T.textSecondary }}>
            Agregar receta nueva
          </span>
        </button>
      </div>

      {/* Alt form — shown when toggled */}
      {showAltForm && (
        <div style={{ background: T.bgSurface, borderRadius: T.radiusMd, padding: 16, marginTop: 4 }}>
          {[
            { key: "recipeName",  label: "Nombre",                  placeholder: "Ej: Milanesa con ensalada" },
            { key: "ingredients", label: "Ingredientes (opcional)", placeholder: "Ej: Milanesa 200g, lechuga" },
            { key: "notes",       label: "Notas (opcional)",        placeholder: "Ej: Comí afuera" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 400, lineHeight: "16px", color: T.textSecondary, display: "block", marginBottom: 4 }}>{label}</span>
              <input
                value={altForm[key]}
                onChange={e => setAltForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  width: "100%", padding: "10px 12px",
                  borderRadius: 8, border: `1px solid ${HEX.borderDisabled}`,
                  fontSize: 16, lineHeight: "24px",
                  fontFamily: "'Inter', sans-serif",
                  color: HEX.textDefault, background: HEX.bgDefault,
                  outline: "none", boxSizing: "border-box",
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
            {saving ? "Guardando..." : "Guardar receta nueva"}
          </button>
        </div>
      )}
    </SheetShell>
  );
}
