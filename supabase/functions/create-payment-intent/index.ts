import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const key = Deno.env.get("STRIPE_SECRET_KEY") || "";
  if (!key) return new Response("misconfigured", { status: 500 });

  const body = await req.json().catch(() => null) as any;
  if (!body) return new Response("bad request", { status: 400 });

  const amount = Number(body.amount || 0);
  const currency = String(body.currency || "brl");
  const metadata = body.metadata || {};

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(amount),
      currency,
      "automatic_payment_methods[enabled]": "true",
      ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, String(v)])),
    }),
  });

  if (!res.ok) {
    return new Response("error", { status: 500 });
  }
  const json = await res.json();
  return new Response(JSON.stringify({ client_secret: json.client_secret }), { headers: { "Content-Type": "application/json" } });
});

