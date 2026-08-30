// Helper compartido por todas las Edge Functions que hablan con PayPal.
// PAYPAL_MODE decide sandbox vs live sin cambiar ningun codigo -- solo
// el secreto en Supabase.

const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";

export function paypalApiBase(): string {
  return PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getPaypalAccessToken(): Promise<string> {
  const credentials = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`No se pudo obtener el token de PayPal (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Llama cualquier endpoint REST de PayPal ya autenticado con un token
// fresco -- PayPal no ofrece refresh de token, cada llamada pide uno
// nuevo (los tokens duran ~9h pero pedir uno por llamada es lo mas
// simple y evita manejar expiracion a mano).
export async function paypalFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await getPaypalAccessToken();

  return fetch(`${paypalApiBase()}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
