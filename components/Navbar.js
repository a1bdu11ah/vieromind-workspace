import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Navbar() {
  return (
    <header className="nav-wrap">
      <nav className="nav container">
        <Link href="/" className="brand"><BrandLogo /></Link>
        <div className="nav-links">
          <Link href="/#platform">Platform</Link>
          <Link href="/register">Create account</Link>
          <Link href="/login" className="button small">Employee sign in</Link>
        </div>
      </nav>
    </header>
  );
}
