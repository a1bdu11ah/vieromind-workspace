import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createDelivery, finishDelivery, getIntegrationWithSecret } from "@/lib/integrations";

function isPrivateIp(address) {
  if (address === "::1" || address === "::") return true;
  if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  const normalized = address.startsWith("::ffff:") ? address.slice(7) : address;
  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168);
}

export function parseWebhookUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid HTTPS endpoint URL.");
  }
  if (url.protocol !== "https:") throw new Error("Webhook endpoints must use HTTPS.");
  if (url.username || url.password) throw new Error("Webhook URLs cannot contain credentials.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Private network endpoints are not allowed.");
  }
  if (isIP(hostname) && isPrivateIp(hostname)) throw new Error("Private network endpoints are not allowed.");
  return url.toString();
}

async function assertPublicDestination(url) {
  const addresses = await lookup(new URL(url).hostname, { all: true });
  if (!addresses.length || addresses.some(entry => isPrivateIp(entry.address))) {
    throw new Error("The endpoint resolves to a private network address.");
  }
}

export function secretsMatch(provided, expected) {
  if (!provided || !expected) return false;
  const first = Buffer.from(provided);
  const second = Buffer.from(expected);
  return first.length === second.length && timingSafeEqual(first, second);
}

export async function dispatchWebhook(tenantId, event, data) {
  const integration = await getIntegrationWithSecret(tenantId);
  if (!integration?.enabled || !integration.endpoint_url || !integration.secret) return { status: "skipped" };

  const deliveryId = await createDelivery({ tenantId, event, direction: "outgoing" });
  const timestamp = new Date().toISOString();
  const payload = { id: deliveryId, event, createdAt: timestamp, data };
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", integration.secret).update(`${timestamp}.${body}`).digest("hex");

  try {
    const endpoint = parseWebhookUrl(integration.endpoint_url);
    await assertPublicDestination(endpoint);
    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(7000),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Viero-Webhooks/1.0",
        "X-Viero-Event": event,
        "X-Viero-Delivery": deliveryId,
        "X-Viero-Timestamp": timestamp,
        "X-Viero-Signature": `sha256=${signature}`
      },
      body
    });
    const responseText = (await response.text()).slice(0, 500);
    await finishDelivery(deliveryId, tenantId, {
      status: response.ok ? "succeeded" : "failed",
      httpStatus: response.status,
      responseExcerpt: responseText
    });
    return { status: response.ok ? "succeeded" : "failed", httpStatus: response.status, deliveryId };
  } catch (error) {
    await finishDelivery(deliveryId, tenantId, { status: "failed", responseExcerpt: error.message || "Delivery failed." });
    return { status: "failed", error: error.message || "Delivery failed.", deliveryId };
  }
}

export function newIntegrationSecret() {
  return `viero_whsec_${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`;
}
