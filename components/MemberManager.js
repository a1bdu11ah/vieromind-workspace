"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberManager({ initialMembers, currentUserId, currentRole }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const canManage = currentRole === "owner" || currentRole === "admin";

  const visible = useMemo(() => members.filter(member => `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(query.toLowerCase())), [members, query]);

  async function addMember(event) {
    event.preventDefault(); setLoading(true); setError(""); setNotice("");
    const response = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setError(data.message || "Could not add member.");
    setMembers(current => [...current, data.member]);
    setForm({ name: "", email: "", password: "", role: "member" });
    setOpen(false); setNotice(`${data.member.name} was added to the workspace.`); router.refresh();
  }

  async function changeRole(id, role) {
    setError(""); setNotice("");
    const response = await fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    const data = await response.json();
    if (!response.ok) return setError(data.message || "Could not update role.");
    setMembers(current => current.map(member => member.id === id ? { ...member, role } : member));
    setNotice("Member role updated."); router.refresh();
  }

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) return;
    setError(""); setNotice("");
    const response = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.message || "Could not remove member.");
    setMembers(current => current.filter(item => item.id !== member.id));
    setNotice(`${member.name} was removed.`); router.refresh();
  }

  return <>
    <header className="page-header">
      <div><p className="kicker">People</p><h1>Team members</h1><p>Manage who has access to this workspace and what they can do.</p></div>
      {canManage && <button className="primary-action" onClick={() => setOpen(true)}><span>+</span> Add member</button>}
    </header>
    {notice && <div className="notice success">{notice}</div>}
    {error && <div className="notice danger">{error}</div>}
    <section className="surface members-panel">
      <div className="member-tools">
        <div><h2>All members</h2><p>{members.length} {members.length === 1 ? "person" : "people"} in this workspace</p></div>
        <label className="search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search members" /></label>
      </div>
      <div className="member-table">
        <div className="member-table-head"><span>Member</span><span>Role</span><span>Joined</span><span></span></div>
        {visible.map((member, index) => <div className="member-table-row" key={member.id}>
          <div className="member-identity"><span className={`avatar color-${index % 4}`}>{member.name?.[0]?.toUpperCase()}</span><div><strong>{member.name}{member.id === currentUserId && <em>You</em>}</strong><span>{member.email}</span></div></div>
          <div>{currentRole === "owner" && member.role !== "owner" ? <select value={member.role} onChange={event => changeRole(member.id, event.target.value)}><option value="member">Member</option><option value="admin">Admin</option></select> : <span className={`role-badge ${member.role}`}>{member.role}</span>}</div>
          <span className="joined-date">{member.joined}</span>
          <div>{currentRole === "owner" && member.role !== "owner" && <button className="row-action danger-text" onClick={() => removeMember(member)}>Remove</button>}</div>
        </div>)}
        {!visible.length && <div className="empty-state"><strong>No members found</strong><span>Try a different search.</span></div>}
      </div>
    </section>

    {open && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setOpen(false)}>
      <form className="modal" onSubmit={addMember}>
        <div className="modal-head"><div><p className="kicker">New teammate</p><h2>Add a team member</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
        <p className="modal-copy">Create a login for someone in this workspace. You can change their role later.</p>
        <label>Full name<input required name="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" /></label>
        <label>Email address<input required type="email" name="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="alex@company.com" /></label>
        <div className="form-row"><label>Temporary password<input required minLength="6" type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="6+ characters" /></label><label>Role<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="member">Member</option>{currentRole === "owner" && <option value="admin">Admin</option>}</select></label></div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setOpen(false)}>Cancel</button><button className="primary-action" disabled={loading}>{loading ? "Adding…" : "Add member"}</button></div>
      </form>
    </div>}
  </>;
}
