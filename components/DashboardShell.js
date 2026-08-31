import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import BrandLogo from "@/components/BrandLogo";

const items = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "tasks" },
  { href: "/dashboard/members", label: "Team members", icon: "users" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" }
];

function Icon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    tasks: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M14 9h3M8 15l1.5 1.5L12 14M14 15h3"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.08A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.08A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function DashboardShell({ active, user, tenant, children }) {
  return <main className="app-shell">
    <aside className="app-sidebar">
      <Link href="/" className="app-logo"><BrandLogo /></Link>
      <div className="workspace-switcher">
        <span className="workspace-avatar">{tenant.name?.[0]?.toUpperCase()}</span>
        <div><strong>{tenant.name}</strong><span>Workspace</span></div>
      </div>
      <nav className="app-nav">
        <p>Workspace</p>
        {items.map(item => <Link key={item.href} href={item.href} className={active === item.icon ? "active" : ""}><Icon name={item.icon}/><span>{item.label}</span></Link>)}
      </nav>
      <div className="sidebar-user">
        <span className="user-avatar">{user.name?.[0]?.toUpperCase()}</span>
        <div><strong>{user.name}</strong><span>{user.email}</span></div>
        <LogoutButton compact />
      </div>
    </aside>
    <div className="app-content">
      <header className="mobile-bar">
        <Link href="/dashboard" className="app-logo"><BrandLogo /></Link>
        <nav>{items.map(item => <Link key={item.href} href={item.href} className={active === item.icon ? "active" : ""}><Icon name={item.icon}/><span>{item.label}</span></Link>)}</nav>
      </header>
      {children}
    </div>
  </main>;
}
