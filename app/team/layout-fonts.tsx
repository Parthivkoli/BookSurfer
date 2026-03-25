// Replace your existing font import in layout.tsx with this.
// next/font/google downloads fonts at BUILD TIME and serves them from your own domain,
// so no external stylesheet request is made — CSP is satisfied.

import { Syne, DM_Sans, DM_Mono } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

// Then in your RootLayout component, apply the variables to <html>:
//
// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en" className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}>
//       <body>{children}</body>
//     </html>
//   );
// }
//
// Then in team.tsx, replace hardcoded font family strings with CSS variables:
//   fontFamily: "'Syne', sans-serif"      →  fontFamily: "var(--font-syne), sans-serif"
//   fontFamily: "'DM Sans', sans-serif"   →  fontFamily: "var(--font-dm-sans), sans-serif"
//   fontFamily: "'DM Mono', monospace"    →  fontFamily: "var(--font-dm-mono), monospace"
