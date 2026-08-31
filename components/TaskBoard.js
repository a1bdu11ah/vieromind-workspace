"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const columns = [
  { id: "todo", label: "To do", tone: "slate" },
  { id: "in-progress", label: "In progress", tone: "blue" },
  { id: "review", label: "In review", tone: "orange" },
  { id: "completed", label: "Completed", tone: "green" }
];

function TaskCard({ task, canManage, onUpdate, onDelete }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
  const due = task.dueDate ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(task.dueDate)) : "No due date";
  return <article className="task-card">
    <div className="task-card-top"><span className={`priority ${task.priority}`}>{task.priority}</span>{canManage && <button onClick={() => onDelete(task)} title="Delete task">×</button>}</div>
    <h3>{task.title}</h3>{task.description && <p>{task.description}</p>}
    <div className="task-assignee"><span>{task.assignee.name?.[0]?.toUpperCase()}</span><div><strong>{task.assignee.name}</strong><small>{task.assignee.email}</small></div></div>
    <div className="task-progress-head"><span>Progress</span><strong>{task.progress}%</strong></div>
    <div className="progress-track"><i style={{ width: `${task.progress}%` }}/></div>
    <div className="task-controls">
      <select aria-label="Task status" value={task.status} onChange={event => onUpdate(task.id, { status: event.target.value })}>{columns.map(column => <option value={column.id} key={column.id}>{column.label}</option>)}</select>
      <select aria-label="Task progress" value={task.progress} disabled={task.status === "completed"} onChange={event => onUpdate(task.id, { progress: Number(event.target.value) })}>{[0,10,25,50,75,90,100].map(value => <option value={value} key={value}>{value}%</option>)}</select>
    </div>
    <div className={`task-due ${overdue ? "overdue" : ""}`}><span>◷</span>{overdue ? "Overdue · " : "Due · "}{due}</div>
  </article>;
}

export default function TaskBoard({ initialTasks, members, currentRole, currentUserId }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState({ title: "", description: "", assignedTo: members[0]?.id || "", priority: "medium", dueDate: "" });
  const canManage = currentRole === "owner" || currentRole === "admin";
  const visibleTasks = useMemo(() => filter === "mine" ? tasks.filter(task => task.assignee.id === currentUserId) : tasks, [tasks, filter, currentUserId]);
  const completed = tasks.filter(task => task.status === "completed").length;
  const average = tasks.length ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length) : 0;

  async function createTask(event) {
    event.preventDefault(); setLoading(true); setMessage({ type: "", text: "" });
    const response = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setMessage({ type: "danger", text: data.message || "Could not create task." });
    setTasks(current => [data.task, ...current]); setOpen(false);
    setForm({ title: "", description: "", assignedTo: members[0]?.id || "", priority: "medium", dueDate: "" });
    setMessage({ type: "success", text: `Task assigned to ${data.task.assignee.name}.` }); router.refresh();
  }

  async function updateTask(id, changes) {
    setMessage({ type: "", text: "" });
    const response = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const data = await response.json();
    if (!response.ok) return setMessage({ type: "danger", text: data.message || "Could not update task." });
    setTasks(current => current.map(task => task.id === id ? { ...task, ...data.task } : task)); router.refresh();
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setMessage({ type: "danger", text: data.message || "Could not delete task." });
    setTasks(current => current.filter(item => item.id !== task.id)); setMessage({ type: "success", text: "Task deleted." }); router.refresh();
  }

  return <>
    <header className="page-header task-page-header">
      <div><p className="kicker">Team workflow</p><h1>{canManage ? "Tasks & progress" : "My tasks"}</h1><p>{canManage ? "Assign work, follow progress, and keep your team moving." : "Update your assigned work so your team knows how it’s going."}</p></div>
      {canManage && <button className="primary-action" disabled={!members.length} onClick={() => setOpen(true)}><span>+</span> Assign task</button>}
    </header>

    <section className="task-summary">
      <article><span>All tasks</span><strong>{tasks.length}</strong></article>
      <article><span>Completed</span><strong>{completed}</strong></article>
      <article><span>Team progress</span><strong>{average}%</strong><div className="progress-track"><i style={{ width: `${average}%` }}/></div></article>
      <div className="task-filter"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{canManage ? "Everyone" : "All"}</button>{canManage && <button className={filter === "mine" ? "active" : ""} onClick={() => setFilter("mine")}>Assigned to me</button>}</div>
    </section>
    {message.text && <div className={`notice ${message.type}`}>{message.text}</div>}

    <section className="task-board">
      {columns.map(column => {
        const columnTasks = visibleTasks.filter(task => task.status === column.id);
        return <div className="task-column" key={column.id}>
          <div className="task-column-head"><div><i className={column.tone}/><strong>{column.label}</strong></div><span>{columnTasks.length}</span></div>
          <div className="task-column-body">{columnTasks.map(task => <TaskCard task={task} canManage={canManage} onUpdate={updateTask} onDelete={deleteTask} key={task.id}/>)}{!columnTasks.length && <div className="empty-column">No tasks here</div>}</div>
        </div>;
      })}
    </section>

    {open && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setOpen(false)}><form className="modal" onSubmit={createTask}>
      <div className="modal-head"><div><p className="kicker">New assignment</p><h2>Assign a task</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
      <p className="modal-copy">Set clear ownership, priority, and a due date for the work.</p>
      <label>Task title<input required maxLength="120" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Prepare the monthly report"/></label>
      <label>Description<textarea maxLength="1000" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Add useful context and expected outcome…"/></label>
      <div className="form-row task-form-row"><label>Assign to<select required value={form.assignedTo} onChange={event => setForm({ ...form, assignedTo: event.target.value })}>{members.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label>Priority<select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div>
      <label>Due date<input type="date" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })}/></label>
      {message.type === "danger" && <p className="form-error">{message.text}</p>}
      <div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setOpen(false)}>Cancel</button><button className="primary-action" disabled={loading}>{loading ? "Assigning…" : "Assign task"}</button></div>
    </form></div>}
  </>;
}
