import "./globals.css";

export const metadata = {
  title: "Universal",
  description: "Grind, Maqsadlar, Chat va Kitoblar — bitta joyda",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
