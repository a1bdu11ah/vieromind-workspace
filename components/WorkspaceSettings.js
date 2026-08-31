"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceSettings({ tenant, user }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: tenant.name, slug: tenant.slug });
  const [state, setState] = useState({ loading: false, error: "", success: "" });
  const canEdit = user.role === "owner" || user.role === "admin";

  async function save(event) {
    event.preventDefault(); setState({ loading: true, error: "", success: "" });
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) return setState({ loading: false, error: data.message || "Could not save settings.", success: "" });
    setForm({ name: data.tenant.name, slug: data.tenant.slug });
    setState({ loading: false, error: "", success: "Workspace settings saved." }); router.refresh();
  }

  return <>
    <header className="page-header"><div><p className="kicker">Configuration</p><h1>Workspace settings</h1><p>Manage your workspace identity and account details.</p></div></header>
    <div className="settings-grid">
      <form className="surface settings-card" onSubmit={save}>
        <div className="settings-heading"><span className="settings-icon">◇</span><div><h2>Workspace details</h2><p>These details are visible to everyone on your team.</p></div></div>
        <div className="settings-fields">
          <label>Workspace name<input disabled={!canEdit} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/><small>Use your company or team name.</small></label>
          <label>Workspace URL<div className="slug-input"><span>viero.app/</span><input disabled={!canEdit} value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}/></div><small>Lowercase letters, numbers, and hyphens only.</small></label>
        </div>
        {state.error && <div className="notice danger">{state.error}</div>}
        {state.success && <div className="notice success">{state.success}</div>}
        <div className="settings-footer"><span>{canEdit ? "Changes apply to the whole workspace." : "Only owners and admins can edit these settings."}</span>{canEdit && <button className="primary-action" disabled={state.loading}>{state.loading ? "Saving…" : "Save changes"}</button>}</div>
      </form>
      <aside className="surface settings-card profile-card">
        <div className="settings-heading"><span className="settings-icon warm">{user.name?.[0]?.toUpperCase()}</span><div><h2>Your account</h2><p>Your membership in this workspace.</p></div></div>
        <dl><div><dt>Name</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Role</dt><dd><span className={`role-badge ${user.role}`}>{user.role}</span></dd></div></dl>
        {user.role === "owner" && <div className="owner-note"><strong>Workspace owner</strong><p>You created this workspace. New accounts added from the Team Members page can be assigned member or admin access.</p></div>}
      </aside>
    </div>
  </>;
}
