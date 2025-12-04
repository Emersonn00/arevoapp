import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const secret = Deno.env.get("WEBHOOK_SECRET") || "";
  const sig = req.headers.get("x-webhook-signature") || "";
  if (!secret || sig !== secret) return new Response("unauthorized", { status: 401 });

  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return new Response("misconfigured", { status: 500 });

  const client = createClient(url, key);

  const body = await req.json().catch(() => null) as any;
  if (!body) return new Response("bad request", { status: 400 });

  const user_id = body.user_id as string;
  const aula_id = body.aula_id as string;
  const data_aula = body.data_aula as string;
  const status = body.status as string;

  if (!user_id || !aula_id || !data_aula || !status) return new Response("bad request", { status: 400 });

  if (status === "paid") {
    const { error } = await client
      .from("pagamentos_aulas")
      .update({ status: "pago" })
      .eq("user_id", user_id)
      .eq("aula_id", aula_id)
      .eq("data_aula", data_aula)
      .eq("status", "pendente");
    if (error) return new Response("error", { status: 500 });
    return new Response("ok", { status: 200 });
  }

  if (status === "failed") {
    const { error } = await client
      .from("pagamentos_aulas")
      .update({ status: "falha" })
      .eq("user_id", user_id)
      .eq("aula_id", aula_id)
      .eq("data_aula", data_aula)
      .eq("status", "pendente");
    if (error) return new Response("error", { status: 500 });
    return new Response("ok", { status: 200 });
  }

  return new Response("ignored", { status: 200 });
});

