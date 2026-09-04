import { randomUUID } from "node:crypto";
import { getDB } from "@/lib/db";

function userFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password_hash,
    tenantId: row.tenant_id,
    role: row.role,
    createdAt: row.created_at
  };
}

function tenantFromRow(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at };
}

export function serializeTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    status: row.status,
    priority: row.priority,
    progress: row.progress,
    dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
    assignee: row.assignee_id ? { id: row.assignee_id, name: row.assignee_name, email: row.assignee_email } : null,
    creator: row.creator_name ? { name: row.creator_name } : null,
    createdAt: row.created_at
  };
}

export async function findUserByEmail(email) {
  const sql = await getDB();
  const [row] = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return userFromRow(row);
}

export async function findUser(userId, tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT * FROM users WHERE id = ${userId} AND tenant_id = ${tenantId} LIMIT 1`;
  return userFromRow(row);
}

export async function findUserByEmailForTenant(email, tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT * FROM users WHERE LOWER(email) = ${email.toLowerCase()} AND tenant_id = ${tenantId} LIMIT 1`;
  return userFromRow(row);
}

export async function findTenant(tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT * FROM tenants WHERE id = ${tenantId} LIMIT 1`;
  return tenantFromRow(row);
}

export async function createWorkspaceOwner({ name, email, passwordHash, organization, slug }) {
  const sql = await getDB();
  const tenantId = randomUUID();
  const userId = randomUUID();
  await sql.transaction([
    sql`INSERT INTO tenants (id, name, slug) VALUES (${tenantId}, ${organization}, ${slug})`,
    sql`INSERT INTO users (id, name, email, password_hash, tenant_id, role)
        VALUES (${userId}, ${name}, ${email}, ${passwordHash}, ${tenantId}, 'owner')`
  ]);
  return { user: { id: userId, tenantId, role: "owner" }, tenant: { id: tenantId, slug } };
}

export async function findAvailableSlug(baseSlug) {
  const sql = await getDB();
  const rows = await sql`SELECT slug FROM tenants WHERE slug = ${baseSlug} OR slug LIKE ${`${baseSlug}-%`}`;
  const existing = new Set(rows.map(row => row.slug));
  if (!existing.has(baseSlug)) return baseSlug;
  let suffix = 1;
  while (existing.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

export async function listMembers(tenantId, { limit } = {}) {
  const sql = await getDB();
  const rows = limit
    ? await sql`SELECT id, name, email, role, created_at FROM users WHERE tenant_id = ${tenantId} ORDER BY created_at DESC LIMIT ${limit}`
    : await sql`SELECT id, name, email, role, created_at FROM users WHERE tenant_id = ${tenantId} ORDER BY created_at ASC`;
  return rows.map(userFromRow);
}

export async function listMembersByName(tenantId) {
  const sql = await getDB();
  const rows = await sql`SELECT id, name, email FROM users WHERE tenant_id = ${tenantId} ORDER BY name ASC`;
  return rows.map(userFromRow);
}

export async function workspaceCounts(tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT
    COUNT(*)::INTEGER AS member_count,
    COUNT(*) FILTER (WHERE role IN ('owner', 'admin'))::INTEGER AS admin_count
    FROM users WHERE tenant_id = ${tenantId}`;
  return { memberCount: row.member_count, adminCount: row.admin_count };
}

export async function addMember({ tenantId, name, email, passwordHash, role }) {
  const sql = await getDB();
  const id = randomUUID();
  const [row] = await sql`INSERT INTO users (id, name, email, password_hash, tenant_id, role)
    VALUES (${id}, ${name}, ${email}, ${passwordHash}, ${tenantId}, ${role})
    RETURNING id, name, email, role, created_at`;
  return userFromRow(row);
}

export async function updateMemberRole(id, tenantId, role) {
  const sql = await getDB();
  const [row] = await sql`UPDATE users SET role = ${role}
    WHERE id = ${id} AND tenant_id = ${tenantId} AND role <> 'owner'
    RETURNING id, role`;
  return row || null;
}

export async function removeMember(id, tenantId) {
  const sql = await getDB();
  const [row] = await sql`DELETE FROM users
    WHERE id = ${id} AND tenant_id = ${tenantId} AND role <> 'owner'
    RETURNING id`;
  return row || null;
}

const taskSelect = `
  SELECT t.*, assignee.id AS assignee_id, assignee.name AS assignee_name,
    assignee.email AS assignee_email, creator.name AS creator_name
  FROM tasks t
  JOIN users assignee ON assignee.id = t.assigned_to
  LEFT JOIN users creator ON creator.id = t.created_by
`;

export async function listTasks(tenantId, userId, manager) {
  const sql = await getDB();
  const rows = manager
    ? await sql.query(`${taskSelect} WHERE t.tenant_id = $1 ORDER BY t.created_at DESC`, [tenantId])
    : await sql.query(`${taskSelect} WHERE t.tenant_id = $1 AND t.assigned_to = $2 ORDER BY t.created_at DESC`, [tenantId, userId]);
  return rows.map(serializeTask);
}

export async function findMember(id, tenantId) {
  return findUser(id, tenantId);
}

export async function createTask({ tenantId, title, description, assignedTo, createdBy, priority, dueDate }) {
  const sql = await getDB();
  const id = randomUUID();
  await sql`INSERT INTO tasks (id, title, description, tenant_id, assigned_to, created_by, priority, due_date)
    VALUES (${id}, ${title}, ${description}, ${tenantId}, ${assignedTo}, ${createdBy}, ${priority}, ${dueDate || null})`;
  const rows = await sql.query(`${taskSelect} WHERE t.id = $1 AND t.tenant_id = $2`, [id, tenantId]);
  return rows[0] ? serializeTask(rows[0]) : null;
}

export async function findTask(id, tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT * FROM tasks WHERE id = ${id} AND tenant_id = ${tenantId} LIMIT 1`;
  return row || null;
}

export async function updateTask(id, tenantId, { status, progress, priority }) {
  const sql = await getDB();
  const [row] = await sql`UPDATE tasks SET
      status = ${status}, progress = ${progress}, priority = ${priority}, updated_at = NOW()
    WHERE id = ${id} AND tenant_id = ${tenantId}
    RETURNING id, status, progress, priority`;
  return row || null;
}

export async function deleteTask(id, tenantId) {
  const sql = await getDB();
  const [row] = await sql`DELETE FROM tasks WHERE id = ${id} AND tenant_id = ${tenantId} RETURNING id`;
  return row || null;
}

export async function updateTenant(tenantId, name, slug) {
  const sql = await getDB();
  const [row] = await sql`UPDATE tenants SET name = ${name}, slug = ${slug} WHERE id = ${tenantId} RETURNING id, name, slug, created_at`;
  return tenantFromRow(row);
}

export async function slugBelongsToAnotherTenant(slug, tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT 1 FROM tenants WHERE slug = ${slug} AND id <> ${tenantId} LIMIT 1`;
  return Boolean(row);
}
