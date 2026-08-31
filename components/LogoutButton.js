"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton({ compact = false }) {
  const router = useRouter();
  return <button className={compact ? "logout-icon" : "ghost-button"} title="Log out" aria-label="Log out" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/');router.refresh();}}>{compact ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg> : "Log out"}</button>;
}
