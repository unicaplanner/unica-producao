// Protecao simples por senha unica (nao ha varios usuarios). O cookie guarda
// um token HMAC derivado de APP_SECRET, nao a senha em si. Roda em Edge
// runtime (middleware), entao usa Web Crypto em vez do modulo `crypto` do
// Node.

export const SESSION_COOKIE = "unica_producao_session";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string): Promise<string> {
  const secret = process.env.APP_SECRET ?? process.env.APP_PASSWORD ?? "dev-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

export async function createSessionToken(): Promise<string> {
  return hmac("authenticated");
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await createSessionToken());
}

export function checkPassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD;
  return Boolean(expected) && password === expected;
}
