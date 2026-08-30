import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalFetch, corsHeaders } from "../_shared/paypal.ts";

// Precios fijos del lado servidor -- nunca se confia en un monto que
// mande el cliente. Mismos valores que ya existen en el frontend
// (TOUCH_PRICE en SpecialTouchCheckout.jsx), mas el nuevo Boost pagado.
const PRICES: Record<string, number> = {
  special_touch: 2.99,
  boost: 1.99,
};

const WEEKLY_LIMIT = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MESSAGE_MAX_LENGTH = 350;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Falta el token de autorización." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Sesión inválida o expirada." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => null);
  const purchaseType = body?.purchase_type;

  if (purchaseType !== "special_touch" && purchaseType !== "boost") {
    return new Response(JSON.stringify({ error: "Tipo de compra inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente separado con service_role: purchase_intents no tiene policy
  // de insert para authenticated a proposito (ver SQL de la ronda 1),
  // asi que esta funcion es el unico camino para crear una fila.
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let metadata: Record<string, unknown> = {};

  if (purchaseType === "special_touch") {
    const recipientId = body?.recipient_id;
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!recipientId || typeof recipientId !== "string" || !UUID_RE.test(recipientId)) {
      return new Response(JSON.stringify({ error: "Falta el destinatario." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.length < 1 || message.length > MESSAGE_MAX_LENGTH) {
      return new Response(JSON.stringify({ error: "invalid_message_length" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Defensa en profundidad: la misma validacion que ya hace
    // send_special_touch/admin_fulfill_special_touch, repetida aqui
    // ANTES de cobrar, para no cobrarle a alguien por algo que de
    // todos modos va a fallar al momento de cumplirse.
    const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();

    const [{ count: matchCount }, { count: pendingCount }, { count: weeklyCount }] = await Promise.all([
      adminClient
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(
          `and(user_id.eq.${user.id},matched_profile_id.eq.${recipientId}),and(user_id.eq.${recipientId},matched_profile_id.eq.${user.id})`
        ),
      adminClient
        .from("special_touches")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .eq("recipient_id", recipientId)
        .eq("status", "pending"),
      adminClient
        .from("special_touches")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .gt("created_at", weekAgo),
    ]);

    if ((matchCount || 0) > 0) {
      return new Response(JSON.stringify({ error: "already_matched" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((pendingCount || 0) > 0) {
      return new Response(JSON.stringify({ error: "already_pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((weeklyCount || 0) >= WEEKLY_LIMIT) {
      return new Response(JSON.stringify({ error: "weekly_limit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    metadata = { recipient_id: recipientId, message };
  }

  const amount = PRICES[purchaseType];

  const { data: intent, error: intentError } = await adminClient
    .from("purchase_intents")
    .insert({
      user_id: user.id,
      purchase_type: purchaseType,
      metadata,
      amount_usd: amount,
    })
    .select()
    .single();

  if (intentError || !intent) {
    console.error("Error creando purchase_intent:", intentError?.message);
    return new Response(JSON.stringify({ error: "No se pudo iniciar la compra." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const orderResponse = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: intent.id,
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
    }),
  });

  const orderData = await orderResponse.json();

  if (!orderResponse.ok || !orderData.id) {
    console.error("Error creando orden en PayPal:", orderData);
    await adminClient
      .from("purchase_intents")
      .update({ status: "failed", failure_reason: "paypal_order_creation_failed" })
      .eq("id", intent.id);

    return new Response(JSON.stringify({ error: "No se pudo crear la orden de pago." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await adminClient
    .from("purchase_intents")
    .update({ paypal_order_id: orderData.id })
    .eq("id", intent.id);

  return new Response(JSON.stringify({ orderID: orderData.id, purchaseIntentId: intent.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
