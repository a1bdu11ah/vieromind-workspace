"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "", organization: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) return setError(data.message || "Something went wrong.");
    router.push("/dashboard"); router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <p className="eyebrow">{isRegister ? "OWNER SETUP" : "EMPLOYEE ACCESS"}</p>
      <h1>{isRegister ? "Set up your workspace." : "Welcome back."}</h1>
      <p className="muted">{isRegister ? "Create the private workspace for your VieroMind team." : "Sign in with your VieroMind employee account to continue."}</p>
      {isRegister && <><label>Your name<input required name="name" autoComplete="name" value={form.name} onChange={update} placeholder="Abdullah" /></label><label>Organization<input required name="organization" autoComplete="organization" value={form.organization} onChange={update} placeholder="VieroMind Team" /></label></>}
      <label>Email<input required name="email" type="email" autoComplete="email" value={form.email} onChange={update} placeholder="you@example.com" /></label>
      <label>Password<input required minLength="6" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={update} placeholder="At least 6 characters" /></label>
      {error && <p className="error">{error}</p>}
      <button className="button full" disabled={loading}>{loading ? "Please wait..." : isRegister ? "Create workspace" : "Sign in to workspace"}</button>
      {isRegister
        ? <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        : <p className="auth-switch">New here? <Link href="/register">Create an account and workspace</Link></p>}
    </form>
  );
}
