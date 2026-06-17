import { RECETAS_PN } from "@/lib/recetas";

export const RECIPE_CATEGORIES = {
  MAIN:    "almuerzo_cena",
  SNACK:   "desayuno_merienda",
};

export const RECIPES = {
  plato_equilibrado: {
    name: "Plato equilibrado 1/3, 1/3, 1/3",
    emoji: "🍗",
    category: "almuerzo_cena",
    ingredients: [
      { name: "Carne de pollo",       amount: 150, unit: "g" },
      { name: "Arroz blanco (crudo)", amount: 60,  unit: "g" },
      { name: "Tomate fresco",        amount: 100, unit: "g" },
      { name: "Lechuga mantecosa",    amount: 30,  unit: "g" },
    ],
  },
  bife_ensalada: {
    name: "Bife de vaca + ensalada hojas verdes",
    emoji: "🥩",
    category: "almuerzo_cena",
    ingredients: [
      { name: "Carne de vaca",      amount: 200, unit: "g" },
      { name: "Rúcula",             amount: 47,  unit: "g" },
      { name: "Espinaca fresca",    amount: 47,  unit: "g" },
      { name: "Lechuga mantecosa",  amount: 47,  unit: "g" },
      { name: "Tomate fresco",      amount: 60,  unit: "g" },
      { name: "Pimiento",           amount: 140, unit: "g" },
    ],
  },
  pollo_curry: {
    name: "Pollo al curry con arroz integral",
    emoji: "🍛",
    category: "almuerzo_cena",
    ingredients: [
      { name: "Carne de pollo",               amount: 150, unit: "g" },
      { name: "Arroz integral (crudo)",       amount: 100, unit: "g" },
      { name: "Leche descremada",             amount: 125, unit: "ml" },
      { name: "Curry",                        amount: 1,   unit: "cdp" },
      { name: "Cebolla",                      amount: 60,  unit: "g" },
      { name: "Ajo",                          amount: 5,   unit: "g" },
      { name: "Aceite de oliva extra virgen", amount: 10,  unit: "ml" },
      { name: "Sal y pimienta",               amount: 0,   unit: "c/n" },
    ],
  },
  sopa_verduras: {
    name: "Sopa de verduras",
    emoji: "🍲",
    category: "almuerzo_cena",
    ingredients: [
      { name: "Zapallo",          amount: 100, unit: "g" },
      { name: "Cebolla",          amount: 24,  unit: "g" },
      { name: "Zapallito tierno", amount: 48,  unit: "g" },
      { name: "Pimiento",         amount: 16,  unit: "g" },
      { name: "Apio",             amount: 0.2, unit: "u" },
      { name: "Zanahoria",        amount: 28,  unit: "g" },
      { name: "Brócoli",          amount: 36,  unit: "g" },
      { name: "Perejil fresco",   amount: 0,   unit: "c/n" },
    ],
  },
  ensalada_atun: {
    name: "Ensalada de atún, repollo, tomate, espinaca y queso",
    emoji: "🥗",
    category: "almuerzo_cena",
    ingredients: [
      { name: "Atún en lata",                 amount: 120, unit: "g" },
      { name: "Queso cremoso",                amount: 20,  unit: "g" },
      { name: "Espinaca fresca",              amount: 30,  unit: "g" },
      { name: "Repollo morado",               amount: 100, unit: "g" },
      { name: "Tomate fresco",                amount: 60,  unit: "g" },
      { name: "Queso en hebras",              amount: 20,  unit: "g" },
      { name: "Aceite de oliva extra virgen", amount: 5,   unit: "ml" },
    ],
  },
  tacos_light: {
    name: "Tacos light",
    emoji: "🌮",
    category: "almuerzo_cena",
    note: "2 porciones",
    ingredients: [
      { name: "Carne de vaca",                     amount: 200, unit: "g" },
      { name: "Pimiento",                          amount: 100, unit: "g" },
      { name: "Cebolla de verdeo",                 amount: 1,   unit: "u" },
      { name: "Tapa de empanada light La Salteña", amount: 2,   unit: "u" },
      { name: "Especias y condimentos",            amount: 0,   unit: "c/n" },
    ],
  },
  pollo_brocoli_batata: {
    name: "Pollo al horno con brócoli y batata",
    emoji: "🍗",
    category: "almuerzo_cena",
    ingredients: [
      { name: "Carne de pollo",               amount: 100, unit: "g" },
      { name: "Brócoli",                      amount: 100, unit: "g" },
      { name: "Batata (fresca)",              amount: 80,  unit: "g" },
      { name: "Aceite de oliva extra virgen", amount: 15,  unit: "ml" },
      { name: "Sal y pimienta",               amount: 0,   unit: "c/n" },
    ],
  },
  sandwich_ternera: {
    name: 'Sándwich "Ternera" DS',
    emoji: "🥪",
    category: "desayuno_merienda",
    ingredients: [
      { name: "Mayonesa",           amount: 30, unit: "g" },
      { name: "Lechuga mantecosa",  amount: 60, unit: "g" },
      { name: "Rúcula",             amount: 30, unit: "g" },
      { name: "Tomate fresco",      amount: 45, unit: "g" },
      { name: "Ternera casera",     amount: 50, unit: "g" },
      { name: "Queso feta",         amount: 50, unit: "g" },
    ],
  },
  panqueque_avena_banana: {
    name: "Panqueque de avena y banana",
    emoji: "🥞",
    category: "desayuno_merienda",
    ingredients: [
      { name: "Avena",                        amount: 40, unit: "g"  },
      { name: "Banana",                       amount: 40, unit: "g"  },
      { name: "Huevo entero",                 amount: 50, unit: "g"  },
      { name: "Polvo de hornear",             amount: 2,  unit: "g"  },
      { name: "Aceite de oliva extra virgen", amount: 3,  unit: "ml" },
    ],
  },
  yogurt_granola: {
    name: "Yogurt con media fruta, granola y frutas secas",
    emoji: "🫙",
    category: "desayuno_merienda",
    ingredients: [
      { name: "Yogurt descremado",   amount: 150, unit: "g" },
      { name: "Fruta",               amount: 80,  unit: "g" },
      { name: "Granola",             amount: 30,  unit: "g" },
      { name: "Frutas secas",        amount: 15,  unit: "g" },
    ],
  },
  tostada_queso_tomate: {
    name: "Infusión + tostada con queso blando y tomate",
    emoji: "🍞",
    category: "desayuno_merienda",
    ingredients: [
      { name: "Pan de salvado",      amount: 30, unit: "g" },
      { name: "Queso cremoso",       amount: 30, unit: "g" },
      { name: "Tomate fresco",       amount: 50, unit: "g" },
    ],
  },
  libre: {
    name: "Elijo con libertad",
    emoji: "🍽️",
    category: "libre",
    note: "Podés elegir con más libertad. No hace falta que el plato se parezca tanto al plan.",
    ingredients: [],
  },
  // ── Power Nutrition (507 recetas de Solana Novillo Nutrición) ──
  ...RECETAS_PN,
};

/* Plan nutricional — Ledesma Juan José (Solana Novillo Nutrición).
   El almuerzo es específico por día tal cual el plan. El desayuno, la
   merienda y la cena se distribuyen entre las opciones que ofrece el plan
   (el plan las presenta como opciones a elegir, no fijas por día):
     · Desayuno: Panqueque (pn_12) · Yogurt c/granola (pn_20313) · Sandwich de Pollo (pn_30436)
     · Merienda: Panqueque (pn_12) · Sándwich de queso blando (pn_20312)
                 · Infusión + tostada con queso blando (pn_20309) · Sandwich de Pollo (pn_30436)
     · Cena: Bife de vaca grande 200g + ensalada (pn_10112) · Plato equilibrado (pn_30469)
             · Sábado libre · Domingo omelette de jamón y queso (pn_20292)
   Las ranuras "Opcional Mediodía" (Whey) y "Media Tarde" (manteca de maní)
   del plan no se modelan en la app. */
export const DAYS = [
  { day: "Lunes",     short: "LUN", desayuno: "pn_12",    almuerzo: "pn_20217", merienda: "pn_20312", cena: "pn_10112" },
  { day: "Martes",    short: "MAR", desayuno: "pn_20313", almuerzo: "pn_30402", merienda: "pn_20309", cena: "pn_30469" },
  { day: "Miércoles", short: "MIÉ", desayuno: "pn_30436", almuerzo: "pn_30441", merienda: "pn_12",    cena: "pn_10112" },
  { day: "Jueves",    short: "JUE", desayuno: "pn_12",    almuerzo: "pn_30495", merienda: "pn_20309", cena: "pn_30469" },
  { day: "Viernes",   short: "VIE", desayuno: "pn_20313", almuerzo: "pn_10089", merienda: "pn_30436", cena: "pn_10112" },
  { day: "Sábado",    short: "SÁB", desayuno: "pn_30436", almuerzo: "pn_10085", merienda: "pn_20312", cena: "libre"    },
  { day: "Domingo",   short: "DOM", desayuno: "pn_12",    almuerzo: "libre",    merienda: "pn_20309", cena: "pn_20292" },
];

export const CATEGORIES = {
  "Proteínas":             ["Carne de pollo", "Carne de vaca", "Atún en lata", "Ternera casera", "Huevo entero",
                            "Carne de pollo promedio", "Carne de vaca promedio", "Huevo entero 3 unidades",
                            "Whey Protein"],
  "Lácteos y quesos":      ["Leche descremada", "Queso cremoso", "Queso en hebras", "Queso feta", "Yogurt descremado",
                            "Leche de vaca parcial descre", "Queso Cremoso", "Queso Por Salut",
                            "Queso untable descremado", "Ricota de leche entera"],
  "Verduras y hojas":      ["Lechuga mantecosa", "Rúcula", "Espinaca fresca", "Repollo morado",
                            "Tomate fresco", "Pimiento", "Cebolla", "Cebolla de verdeo",
                            "Ajo", "Apio", "Zapallo", "Zapallito tierno", "Zanahoria",
                            "Brócoli", "Batata (fresca)", "Fruta", "Banana",
                            "Ajo, bulbo, fresco, crudo", "Ají Morrón", "Banana, fresca", "Calabaza",
                            "Cebolla blanca, bulbo, cruda", "Chaucha, vaina y semilla, cruda",
                            "Espinaca, hoja, fresca, cruda", "Lechuga", "Palta, pulpa, fresca",
                            "Palta, pulpa, fresca 10", "Papa, pulpa sin cáscara, hervida",
                            "Tomate, fresco, crudo", "Tomate, fresco, crudo 1 unidad promedio",
                            "Zanahoria, raiz, pelada, fresca", "zapallo",
                            "Fruta que fruta puede ir aqui soli?"],
  "Cereales":              ["Arroz blanco (crudo)", "Arroz integral (crudo)",
                            "Tapa de empanada light La Salteña", "Avena", "Pan de salvado",
                            "Granola", "Polvo de hornear",
                            "Arroz integral", "Arroz, blanco, crudo", "Galleta de arroz",
                            "Pan integral", "Pan rallado", "Trigo, pan de salvado", "Polvo de Hornear"],
  "Aceites y condimentos": ["Aceite de oliva extra virgen", "Curry", "Perejil fresco",
                            "Sal y pimienta", "Especias y condimentos", "Mayonesa",
                            "Miel", "Pimienta", "Sal"],
  "Frutos secos":          ["Frutas secas", "Nuez, pepita"],
};

export const CAT_ICONS = {
  "Proteínas": "🥩",
  "Lácteos y quesos": "🧀",
  "Verduras y hojas": "🥬",
  "Cereales": "🌾",
  "Aceites y condimentos": "🫙",
  "Frutos secos": "🥜",
  "Otros": "🛒",
};

export const fmt = (amount, unit) => {
  if (unit === "c/n") return "c/n";
  if (unit === "u")   return `${Number.isInteger(amount) ? amount : amount.toFixed(1)} u`;
  if (unit === "cdp") return `${amount} cdp`;
  if (unit === "ml")  return `${Math.round(amount)} ml`;
  return `${Math.round(amount)} g`;
};

export const getCat = (name) => {
  for (const [cat, items] of Object.entries(CATEGORIES)) {
    if (items.includes(name)) return cat;
  }
  return "Otros";
};
