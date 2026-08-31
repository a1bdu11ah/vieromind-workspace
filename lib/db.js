import { neon } from "@neondatabase/serverless";

const state = globalThis.vieroPostgres || (globalThis.vieroPostgres = {
  url: null,
  sql: null,
  schemaPromise: null
});

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return url;
}

function client() {
  const url = databaseUrl();
  if (!state.sql || state.url !== url) {
    state.url = url;
    state.sql = neon(url);
    state.schemaPromise = null;
  }
  return state.sql;
}

async function ensureSchema(sql) {
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      slug VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      role VARCHAR(10) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql`CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      description VARCHAR(1000) NOT NULL DEFAULT '',
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'completed')),
      priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
      due_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql`CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users (tenant_id)`,
    sql`CREATE INDEX IF NOT EXISTS tasks_tenant_status_idx ON tasks (tenant_id, status)`,
    sql`CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks (assigned_to)`
  ]);
}

export async function getDB() {
  const sql = client();
  if (!state.schemaPromise) {
    state.schemaPromise = ensureSchema(sql).catch(error => {
      state.schemaPromise = null;
      throw error;
    });
  }
  await state.schemaPromise;
  return sql;
}

export async function pingDB() {
  const sql = await getDB();
  await sql`SELECT 1`;
}
