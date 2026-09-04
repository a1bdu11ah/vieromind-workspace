"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function createSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `viero_whsec_${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("")}`;
}

export default function IntegrationsPanel({ initialIntegration, initialDeliveries, tenantSlug, canEdit }) {
  const router = useRouter();
  const [form, setForm] = useState({ endpointUrl: initialIntegration.endpointUrl, secret: "", enabled: initialIntegration.enabled });
  const [incomingUrl, setIncomingUrl] = useState(`/api/webhooks/incoming/${tenantSlug}`);
  const [state, setState] = useState({ loading: false, error: "", success: "" });

  useEffect(() => setIncomingUrl(`${window.location.origin}/api/webhooks/incoming/${tenantSlug}`), [tenantSlug]);

  async function save(event) {
    event.preventDefault(); setState({ loading: true, error: "", success: "" });
    const response = await fetch("/api/integrations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) return setState({ loading: false, error: data.message || "Could not save integration.", success: "" });
    setState({ loading: false, error: "", success: "Integration settings saved." }); router.refresh();
  }

  async function sendTest() {
    setState({ loading: true, error: "", success: "" });
    const response = await fetch("/api/integrations/test", { method: "POST" });
    const data = await response.json();
    setState(response.ok ? { loading: false, error: "", success: data.message } : { loading: false, error: data.message || "Test delivery failed.", success: "" }); router.refresh();
  }

  async function copy(value) {
    await navigator.clipboard.writeText(value);
    setState(current => ({ ...current, success: "Copied to clipboard.", error: "" }));
  }

  return <>
    <header className="page-header"><div><p className="kicker">Connected systems</p><h1>API & webhooks</h1><p>Send signed task events to an external API and accept authenticated task creation requests.</p></div></header>
    <div className="integration-grid">
      <form className="surface settings-card integration-card" onSubmit={save}>
        <div className="settings-heading"><span className="settings-icon">↗</span><div><h2>Outgoing API calls</h2><p>Viero sends task.created, task.updated, and task.deleted events.</p></div></div>
        <div className="settings-fields">
          <label>External HTTPS endpoint<input disabled={!canEdit} type="url" value={form.endpointUrl} onChange={event => setForm({ ...form, endpointUrl: event.target.value })} placeholder="https://api.example.com/webhooks/viero"/><small>Private network and non-HTTPS destinations are blocked.</small></label>
          <label>Integration secret<div className="secret-input"><input disabled={!canEdit} type="password" value={form.secret} onChange={event => setForm({ ...form, secret: event.target.value })} placeholder={initialIntegration.hasSecret ? "Secret saved — leave blank to keep it" : "Generate or enter at least 24 characters"}/>{canEdit && <button type="button" onClick={() => setForm({ ...form, secret: createSecret() })}>Generate</button>}</div><small>The same secret authenticates incoming calls and signs outgoing payloads.</small></label>
          {form.secret && <div className="secret-preview"><code>{form.secret}</code><button type="button" onClick={() => copy(form.secret)}>Copy</button></div>}
          <label className="toggle-row"><input disabled={!canEdit} type="checkbox" checked={form.enabled} onChange={event => setForm({ ...form, enabled: event.target.checked })}/><span><strong>Enable webhook integration</strong><small>Turn off to stop both incoming and outgoing calls.</small></span></label>
        </div>
        {state.error && <div className="notice danger">{state.error}</div>}{state.success && <div className="notice success">{state.success}</div>}
        <div className="settings-footer"><button type="button" className="secondary-action" disabled={state.loading || !initialIntegration.enabled} onClick={sendTest}>Send test</button>{canEdit && <button className="primary-action" disabled={state.loading}>{state.loading ? "Working…" : "Save integration"}</button>}</div>
      </form>
      <section className="surface settings-card integration-card">
        <div className="settings-heading"><span className="settings-icon warm">↓</span><div><h2>Incoming webhook</h2><p>External systems can create tasks for workspace members.</p></div></div>
        <div className="endpoint-box"><span>POST endpoint</span><code>{incomingUrl}</code><button type="button" onClick={() => copy(incomingUrl)}>Copy URL</button></div>
        <div className="webhook-docs"><p>Send the saved secret as <code>Authorization: Bearer YOUR_SECRET</code>.</p><pre>{`{
  "event": "task.create",
  "data": {
    "title": "Prepare monthly report",
    "assigneeEmail": "member@example.com",
    "priority": "high",
    "description": "Optional details",
    "dueDate": "2026-10-01"
  }
}`}</pre></div>
      </section>
    </div>
    <section className="surface delivery-panel">
      <div className="surface-head"><div><p className="kicker">Activity</p><h2>Recent deliveries</h2></div><span className="delivery-count">{initialDeliveries.length} shown</span></div>
      {initialDeliveries.length ? <div className="delivery-list">{initialDeliveries.map(delivery => <article key={delivery.id}><span className={`delivery-status ${delivery.status}`}/><div><strong>{delivery.event}</strong><small>{delivery.direction} · {new Date(delivery.createdAt).toLocaleString()}</small></div><span className="delivery-result">{delivery.httpStatus ? `HTTP ${delivery.httpStatus}` : delivery.status}</span></article>)}</div> : <div className="empty-state">No webhook calls yet. Save the integration and send a test.</div>}
    </section>
  </>;
}
