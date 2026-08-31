import "./globals.css";
export const metadata = { title: "VieroMind Workspace", description: "A private team workspace by VieroMind", icons: { icon: "/vieromind-logo.png", apple: "/vieromind-logo.png" } };
export default function RootLayout({ children }) { return <html lang="en"><body>{children}</body></html>; }
