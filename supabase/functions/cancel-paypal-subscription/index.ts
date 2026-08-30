import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalFetch, corsHeaders } from "../_shared/paypal.ts";

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

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("paypal_subscription_id, plan_cancelled")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.paypal_subscription_id) {
    return new Response(JSON.stringify({ error: "No se encontró una suscripción activa." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (profile.plan_cancelled) {
    return new Response(JSON.stringify({ success: true, alreadyCancelled: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cancelResponse = await paypalFetch(
    `/v1/billing/subscriptions/${profile.paypal_subscription_id}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ reason: "Cancelado por el usuario desde MyPinky." }),
    }
  );

  // PayPal responde 204 sin cuerpo cuando la cancelacion sale bien.
  if (!cancelResponse.ok && cancelResponse.status !== 204) {
    const errorData = await cancelResponse.json().catch(() => null);
    console.error("Error cancelando suscripción en PayPal:", errorData);
    return new Response(JSON.stringify({ error: "No se pudo cancelar la suscripción en PayPal." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ plan_cancelled: true })
    .eq("id", user.id);

  if (updateError) {
    console.error("Suscripción cancelada en PayPal pero falló al guardar en la base:", updateError.message);
    return new Response(JSON.stringify({ error: "La suscripción se canceló, pero hubo un error guardando el estado. Contacta a soporte." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
