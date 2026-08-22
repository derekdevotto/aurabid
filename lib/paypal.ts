const isProduction = process.env.PAYPAL_ENV === "production" || process.env.PAYPAL_ENV === "live";
const paypalBaseUrl = isProduction ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET.");
  return { clientId, clientSecret };
}

export async function getPayPalAccessToken() {
  const { clientId, clientSecret } = getCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "PayPal rechazó la autenticación.");
  return data.access_token;
}

export function paypalApiUrl(path: string) {
  return `${paypalBaseUrl}${path}`;
}
