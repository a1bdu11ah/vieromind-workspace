import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Navbar() {
  return (
    <header className="nav-wrap">
      <nav className="nav container">
        <Link href="/" className="brand"><BrandLogo /></Link>
        <div className="nav-links">
          <Link href="/#platform">Platform</Link>
          <span className="employee-nav-label">Internal team portal</span>
          <Link href="/login" className="button small">Employee sign in</Link>
        </div>
      </nav>
    </header>
  );
}
