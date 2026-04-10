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
    category: "almuerzo_cena",
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
};

export const DAYS = [
  { day: "Lunes",     short: "LUN", almuerzo: "plato_equilibrado",    cena: "bife_ensalada" },
  { day: "Martes",    short: "MAR", almuerzo: "pollo_curry",          cena: "sopa_verduras" },
  { day: "Miércoles", short: "MIÉ", almuerzo: "bife_ensalada",        cena: "ensalada_atun" },
  { day: "Jueves",    short: "JUE", almuerzo: "tacos_light",          cena: "sopa_verduras" },
  { day: "Viernes",   short: "VIE", almuerzo: "pollo_brocoli_batata", cena: "bife_ensalada" },
];

export const CATEGORIES = {
  "Proteínas":             ["Carne de pollo", "Carne de vaca", "Atún en lata", "Ternera casera", "Huevo entero"],
  "Lácteos y quesos":      ["Leche descremada", "Queso cremoso", "Queso en hebras", "Queso feta", "Yogurt descremado"],
  "Verduras y hojas":      ["Lechuga mantecosa", "Rúcula", "Espinaca fresca", "Repollo morado",
                            "Tomate fresco", "Pimiento", "Cebolla", "Cebolla de verdeo",
                            "Ajo", "Apio", "Zapallo", "Zapallito tierno", "Zanahoria",
                            "Brócoli", "Batata (fresca)", "Fruta", "Banana"],
  "Cereales":              ["Arroz blanco (crudo)", "Arroz integral (crudo)",
                            "Tapa de empanada light La Salteña", "Avena", "Pan de salvado",
                            "Granola", "Polvo de hornear"],
  "Aceites y condimentos": ["Aceite de oliva extra virgen", "Curry", "Perejil fresco",
                            "Sal y pimienta", "Especias y condimentos", "Mayonesa"],
  "Frutos secos":          ["Frutas secas"],
};

export const CAT_ICONS = {
  "Proteínas": "🥩",
  "Lácteos y quesos": "🧀",
  "Verduras y hojas": "🥬",
  "Cereales": "🌾",
  "Aceites y condimentos": "🫙",
  "Frutos secos": "🥜",
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
