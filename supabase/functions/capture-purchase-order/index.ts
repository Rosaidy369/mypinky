import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalFetch, corsHeaders } from "../_shared/paypal.ts";

// Esta funcion SOLO captura el pago -- el cumplimiento real (mandar el
// Toque Especial, activar el Boost) pasa exclusivamente por el webhook
// al recibir PAYMENT.CAPTURE.COMPLETED, nunca aqui. Asi hay una sola
// fuente de verdad y no hay riesgo de cumplir la compra dos veces si
// esta funcion y el webhook llegaran a correr casi al mismo tiempo.
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
  const orderId = body?.orderID;

  if (!orderId || typeof orderId !== "string") {
    return new Response(JSON.stringify({ error: "Falta el orderID." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Confirma que esta orden le pertenece a quien esta llamando -- nadie
  // puede capturar una orden de otro usuario adivinando el orderID.
  const { data: intent, error: intentError } = await adminClient
    .from("purchase_intents")
    .select("id, user_id, status")
    .eq("paypal_order_id", orderId)
    .single();

  if (intentError || !intent || intent.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Orden no encontrada." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (intent.status !== "created") {
    // Ya capturada (o fallida) -- responde con el estado actual en vez
    // de intentar capturar de nuevo.
    return new Response(JSON.stringify({ status: intent.status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const captureResponse = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
  });

  const captureData = await captureResponse.json();

  if (!captureResponse.ok) {
    console.error("Error capturando orden en PayPal:", captureData);
    await adminClient
      .from("purchase_intents")
      .update({ status: "failed", failure_reason: "paypal_capture_failed" })
      .eq("id", intent.id);

    return new Response(JSON.stringify({ error: "No se pudo capturar el pago." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await adminClient
    .from("purchase_intents")
    .update({ status: "captured" })
    .eq("id", intent.id);

  return new Response(JSON.stringify({ status: "captured" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
