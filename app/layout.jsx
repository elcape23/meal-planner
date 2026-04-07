import "./globals.css";

export const metadata = {
  title: "Plan Nutricional — Ledesma Juan José",
  description: "Planificador semanal de comidas y lista de compras",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
