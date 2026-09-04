import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { getDB } from "@/lib/db";

function encryptionKey() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return createHash("sha256").update(process.env.JWT_SECRET).digest();
}

function encryptSecret(value) {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${encrypted.toString("base64url")}`;
}

function decryptSecret(value) {
  if (!value || !value.startsWith("v1:")) return value || "";
  const [, iv, tag, encrypted] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

function serializeIntegration(row) {
  return {
    endpointUrl: row?.endpoint_url || "",
    enabled: Boolean(row?.enabled),
    hasSecret: Boolean(row?.secret)
  };
}

function serializeDelivery(row) {
  return {
    id: row.id,
    event: row.event,
    direction: row.direction,
    status: row.status,
    httpStatus: row.http_status,
    responseExcerpt: row.response_excerpt || "",
    createdAt: new Date(row.created_at).toISOString()
  };
}

export async function getIntegration(tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT endpoint_url, secret, enabled
    FROM webhook_integrations WHERE tenant_id = ${tenantId} LIMIT 1`;
  return serializeIntegration(row);
}

export async function getIntegrationWithSecret(tenantId) {
  const sql = await getDB();
  const [row] = await sql`SELECT tenant_id, endpoint_url, secret, enabled
    FROM webhook_integrations WHERE tenant_id = ${tenantId} LIMIT 1`;
  return row ? { ...row, secret: decryptSecret(row.secret) } : null;
}

export async function findIntegrationByTenantSlug(slug) {
  const sql = await getDB();
  const [row] = await sql`SELECT wi.tenant_id, wi.secret, wi.enabled
    FROM webhook_integrations wi
    JOIN tenants t ON t.id = wi.tenant_id
    WHERE t.slug = ${slug}
    LIMIT 1`;
  return row ? { ...row, secret: decryptSecret(row.secret) } : null;
}

export async function saveIntegration(tenantId, { endpointUrl, secret, enabled }) {
  const sql = await getDB();
  const [current] = await sql`SELECT secret FROM webhook_integrations WHERE tenant_id = ${tenantId} LIMIT 1`;
  const nextSecret = secret ? encryptSecret(secret) : current?.secret || "";
  const [row] = await sql`INSERT INTO webhook_integrations (tenant_id, endpoint_url, secret, enabled)
    VALUES (${tenantId}, ${endpointUrl}, ${nextSecret}, ${enabled})
    ON CONFLICT (tenant_id) DO UPDATE SET
      endpoint_url = EXCLUDED.endpoint_url,
      secret = EXCLUDED.secret,
      enabled = EXCLUDED.enabled,
      updated_at = NOW()
    RETURNING endpoint_url, secret, enabled`;
  return serializeIntegration(row);
}

export async function createDelivery({ tenantId, event, direction, status = "pending", httpStatus = null, responseExcerpt = "" }) {
  const sql = await getDB();
  const id = randomUUID();
  await sql`INSERT INTO webhook_deliveries
    (id, tenant_id, event, direction, status, http_status, response_excerpt)
    VALUES (${id}, ${tenantId}, ${event}, ${direction}, ${status}, ${httpStatus}, ${responseExcerpt.slice(0, 500)})`;
  return id;
}

export async function finishDelivery(id, tenantId, { status, httpStatus = null, responseExcerpt = "" }) {
  const sql = await getDB();
  await sql`UPDATE webhook_deliveries SET
      status = ${status}, http_status = ${httpStatus}, response_excerpt = ${responseExcerpt.slice(0, 500)}, updated_at = NOW()
    WHERE id = ${id} AND tenant_id = ${tenantId}`;
}

export async function listDeliveries(tenantId, limit = 12) {
  const sql = await getDB();
  const rows = await sql`SELECT id, event, direction, status, http_status, response_excerpt, created_at
    FROM webhook_deliveries WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map(serializeDelivery);
}
